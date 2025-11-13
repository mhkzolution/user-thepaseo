// app/unauthorized/page.tsx
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2">You do not have permission to access this page.</p>
      <Link href="/" className="mt-4 text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}