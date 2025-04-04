"use client";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Correct import for Next.js

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center min-h-screen p-24 relative">
      {/* Top section - Fixed at the top */}
      <div className="absolute top-0 left-0 w-full flex justify-between p-4 mr-2">
        <div>
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={50}
            height={50}
            className="object-cover m-4"
          />
        </div>
        <div>
          <button
            className="border-2 border-gray-900 rounded-md bg-gray-800 m-4 p-2"
            onClick={() => router.push("/login")} // Navigate to login
          >
            Log in
          </button>
          <button
            className="border-2 border-gray-900 rounded-md bg-gray-800 m-4 p-2"
            onClick={() => router.push("/signup")} // Navigate to signup
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Middle section - Centered */}
      <div className="flex flex-grow justify-center items-center">
        <div className="text-5xl"><p>Welcome to CODEKRO</p></div>
      </div>
    </div>
  );
}
