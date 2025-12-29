"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    >
      Sign out
    </button>
  );
}

