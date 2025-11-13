
// src/app/auth/error.tsx

"use client";

import { useRouter } from "next/navigation";

const ErrorPage = () => {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center">Error</h2>
        <p className="text-red-500 mt-4">
          Something went wrong. Please try again later.
        </p>
        <button
          onClick={() => router.push("/auth/signin")}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded-md"
        >
          Go Back to Login
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
