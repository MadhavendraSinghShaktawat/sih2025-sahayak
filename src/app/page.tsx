"use client";

import React from "react";
import Link from "next/link";
import MovingBorderButton from "@/components/blocks/moving-border-button";
import LanguageSwitcher from "@/components/common/language-switcher";

export default function Sahayak() {
  return (
    <div className="relative min-h-screen bg-white">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <LanguageSwitcher />
        <Link href="/auth/teacher" className="inline-block">
          <MovingBorderButton>Login</MovingBorderButton>
        </Link>
      </div>
    </div>
  );
}
