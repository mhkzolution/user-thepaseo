import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { decode as jwtDecode } from "jsonwebtoken";
import bcrypt from "bcryptjs"; // ✅ เพิ่มเพื่อใช้ตรวจรหัสผ่านแอดมิน
import { generateReferralCode } from "@/utils/referral";

export const authConfig: NextAuthOptions = {
  providers: [
    // ✅ ADMIN LOGIN (Email + Password)
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<any> {
        const { email, password } = credentials ?? {};
        if (!email || !password) throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");

        const admin = await prisma.user.findUnique({ where: { email } });
        if (!admin) throw new Error("ไม่พบผู้ใช้");

        if (!["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"].includes(admin.role)) {
          throw new Error("บัญชีนี้ไม่มีสิทธิ์เข้าหลังบ้าน");
        }

        const isValid = await bcrypt.compare(password, admin.password ?? "");
        if (!isValid) throw new Error("รหัสผ่านไม่ถูกต้อง");

        await prisma.user.update({
          where: { id: admin.id },
          data: { lastLogin: new Date() },
        });

        // ✅ ใช้ as any เพื่อให้ type ตรง authorize requirement
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        } as any;
      }
    }),

    // ✅ USER LOGIN (Phone + OTP)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials) throw new Error("No credentials provided.");
        const { phone, otp } = credentials;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) throw new Error("User not found");
        if (user.otp !== otp) throw new Error("Invalid OTP");

        const now = new Date();
        if (!user.otpExpiry || user.otpExpiry < now)
          throw new Error("OTP expired");

        await prisma.user.update({
          where: { phone },
          data: { otp: null, otpExpiry: null, lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
        };
      },
    }),

    // ✅ LINE OAUTH LOGIN
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: { params: { scope: "openid profile email" } },
    }),

    // ✅ LINE LIFF LOGIN
    {
      id: "line-liff",
      name: "LINE LIFF",
      type: "credentials",
      credentials: { idToken: { label: "LINE ID Token", type: "text" } },
      async authorize(credentials): Promise<any> {
        if (!credentials?.idToken) return null;
        const decoded = jwtDecode(credentials.idToken) as any;
        if (!decoded?.sub) return null;

        let user = await prisma.user.findUnique({
          where: { email: decoded.email ?? `${decoded.sub}@line.fake` },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: decoded.name ?? "LINE User",
              email: decoded.email ?? `${decoded.sub}@line.fake`,
              role: "USER",
              referralCode: generateReferralCode(),
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
        };
      },
    },
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/auth/login" },

  callbacks: {
    // ✅ JWT callback
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "line") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.lineId = user?.id;
      }

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.phone = user.phone;
        token.email = user.email;
        token.role = user.role;
        token.dateOfBirth = user.dateOfBirth ?? null;
        token.gender = user.gender ?? null;
        token.branchId = user.branchId ?? null;
        token.occupation = user.occupation ?? null;

        if ((user as any).lineId) token.lineId = (user as any).lineId;
        if ((user as any).avatar) token.avatar = (user as any).avatar;
        if ((user as any).redirectTo) token.redirectTo = (user as any).redirectTo;
      }

      if (trigger === "update" && session) {
        token.dateOfBirth = session.dateOfBirth ?? null;
        token.branchId = session.branchId ?? null;
        token.occupation = (user as any).occupation ?? null;
        token.gender = (user as any).gender ?? null;
      }

      return token;
    },

    // ✅ Session callback
      async session({ session, token }) {
        if (token) {
          const t = token as any;
          session.user.id = t.id;
          session.user.name = t.name;
          session.user.phone = t.phone;
          session.user.email = t.email;
          session.user.role = t.role;
          session.user.dateOfBirth = t.dateOfBirth;
          session.user.gender = t.gender;
          session.user.branchId = t.branchId;
          session.user.occupation = t.occupation;
          session.user.redirectTo = t.redirectTo;

          session.user.lineId = t.lineId;
          session.user.lineToken = t.accessToken;
          session.user.avatar = t.avatar;
          session.user.permissions = t.permissions ?? [];
        }

        return session;
      },

    // ✅ SignIn callback (LINE auto create/update)
    async signIn({ user, account, profile }) {
      if (account?.provider === "line" && profile) {
        const lineProfile = profile as {
          sub: string;
          name?: string;
          email?: string;
          picture?: string;
        };

        const email = lineProfile.email ?? `${lineProfile.sub}@line.fake`;
        const avatar = lineProfile.picture ?? null;
        const expiresIn =
          typeof account.expires_in === "number" ? account.expires_in : null;
        const lineTokenExpiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null;

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lineId: lineProfile.sub,
              avatar,
              lineToken: account.access_token,
              lineRefreshToken: account.refresh_token,
              lineTokenExpiresAt,
              lastLogin: new Date(),
            },
          });

          Object.assign(user, {
            id: existingUser.id,
            name: existingUser.name,
            phone: existingUser.phone,
            role: existingUser.role,
            avatar,
            lineId: lineProfile.sub,
          });
        } else {
          const newUser = await prisma.user.create({
            data: {
              name: lineProfile.name ?? "LINE User",
              email,
              referralCode: generateReferralCode(),
              lineId: lineProfile.sub,
              avatar,
              lineToken: account.access_token,
              lineRefreshToken: account.refresh_token,
              lineTokenExpiresAt,
              lastLogin: new Date(),
            },
          });

          Object.assign(user, {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            avatar,
            lineId: lineProfile.sub,
          });
        }
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          dateOfBirth: true,
          gender: true,
          branchId: true,
          occupation: true,
        },
      });

      Object.assign(user, dbUser);
      if (!dbUser) return false;

      const isIncomplete =
        !dbUser.dateOfBirth ||
        !dbUser.gender ||
        !dbUser.phone ||
        !dbUser.branchId ||
        !dbUser.occupation;

      if (isIncomplete) {
        (user as any).redirectTo = "/complete-profile";
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/complete-profile")) {
        return `${baseUrl}/complete-profile`;
      }
      return baseUrl;
    },
  },
};
