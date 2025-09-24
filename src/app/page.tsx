"use client";

import React from "react";
import Link from "next/link";
import MovingBorderButton from "@/components/blocks/moving-border-button";
import { Navbar } from "@/components/blocks/navbar";
import LanguageSwitcher from "@/components/blocks/language-switcher";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function Home() {
  const [showRoles, setShowRoles] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar
        slots={[
          <LanguageSwitcher key="lang" />,
          <AnimatedThemeToggler key="theme" />,
        ]}
      />

      <div className="w-full max-w-xl mx-auto mt-10 rounded-2xl border bg-white shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Welcome to Sahayak
        </h1>
        <p className="text-gray-600 text-center mb-8">Simple classroom chat</p>

        {!showRoles ? (
          <div className="flex items-center justify-center">
            <div onClick={() => setShowRoles(true)}>
              <MovingBorderButton>Login</MovingBorderButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-600">Continue as</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-6">
                <h2 className="font-semibold mb-2">Teacher</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Create rooms and invite students
                </p>
                <Link href="/auth/teacher" className="inline-block">
                  <MovingBorderButton>Continue</MovingBorderButton>
                </Link>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="font-semibold mb-2">Student</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Join your teacher&apos;s class
                </p>
                <Link href="/auth/student" className="inline-block">
                  <MovingBorderButton>Continue</MovingBorderButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
