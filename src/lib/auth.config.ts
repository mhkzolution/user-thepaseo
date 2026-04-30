import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { PrismaClient } from "@prisma/client";

/**
 * ✅ Prisma singleton
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    /**
     * =========================
     * ✅ OTP LOGIN
     * =========================
     */
    CredentialsProvider({
      id: "otp-login",
      name: "OTP Login",
      credentials: {
        phone: {},
        otp: {},
      },

      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Missing phone or OTP");
        }

        const phone = String(credentials.phone);
        const otp = String(credentials.otp);

        /**
         * 🔥 ต้องมี OTP ที่ verify แล้วเท่านั้น
         */
        const otpRecord = await prisma.otpVerification.findFirst({
          where: {
            phone,
            token: otp,
            verifiedAt: { not: null },
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!otpRecord) {
          throw new Error("OTP not verified");
        }

        /**
         * 🔥 กัน reuse (optional แต่แนะนำ)
         */
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: {
            verifiedAt: new Date(),
          },
        });

        /**
         * 🔍 หา user
         */
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        /**
         * 🆕 create ถ้ายังไม่มี
         */
        if (!user) {
          const referralCode = await generateUniqueReferralCode();

          user = await prisma.user.create({
            data: {
              phone,
              name: phone,
              isPhoneVerified: true,
              referralCode,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone ?? null,
          role: user.role,
        } as any;
      },
    }),

    /**
     * =========================
     * ✅ LINE OAUTH (WEB)
     * =========================
     */
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),

    /**
     * =========================
     * ✅ LINE LIFF (MOBILE)
     * =========================
     */
    CredentialsProvider({
      id: "line-liff",
      name: "LINE LIFF",
      credentials: {
        lineUserId: {},
        displayName: {},
        pictureUrl: {},
      },

      async authorize(credentials) {
        const lineUserId = String(credentials?.lineUserId);

        if (!lineUserId) {
          throw new Error("Missing LINE userId");
        }

        let user = await prisma.user.findUnique({
          where: { lineId: lineUserId },
        });

        if (!user) {
          const referralCode = await generateUniqueReferralCode();

          user = await prisma.user.create({
            data: {
              lineId: lineUserId,
              name: String(credentials?.displayName || "LINE User"),
              avatar: String(credentials?.pictureUrl || ""),
              referralCode,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone ?? null,
          role: user.role,
        } as any;
      },
    }),
  ],

  callbacks: {
    /**
     * ✅ LINE OAUTH create user
     */
    async signIn({ account, profile }) {
      if (account?.provider === "line" && profile) {
        const lineId = (profile as any).sub;

        let user = await prisma.user.findUnique({
          where: { lineId },
        });

        if (!user) {
          const referralCode = await generateUniqueReferralCode();

          await prisma.user.create({
            data: {
              lineId,
              name: (profile as any).name,
              avatar: (profile as any).picture,
              referralCode,
            },
          });
        }
      }

      return true;
    },

    /**
     * ✅ JWT
     */
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = (user as any).phone ?? null;
      }

      if (account?.provider === "line" && profile) {
        const lineId = (profile as any).sub;

        const dbUser = await prisma.user.findUnique({
          where: { lineId },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone ?? null;
        }
      }

      return token;
    },

    /**
     * ✅ SESSION
     */
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone ?? null;
      }

      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

/**
 * 🔥 generate referral code (unique)
 */
async function generateUniqueReferralCode() {
  let code;
  let exists = true;

  while (exists) {
    code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const user = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!user) exists = false;
  }

  return code!;
}