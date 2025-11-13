"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("admin-login", {
      redirect: false,
      email,
      password,
      callbackUrl: "/admin",
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/admin");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" width={64} height={64} alt="The Paseo" />
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          เข้าสู่ระบบผู้ดูแลระบบ
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-paseo focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-paseo focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-paseo hover:bg-paseo-hover text-white py-2 rounded-full font-semibold"
          >
            เข้าสู่ระบบ
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-4">
          © The Paseo Admin Portal
        </p>
      </div>
    </div>
  );
}
