"use client";

import React from "react";
import { Navbar } from "@/components/blocks/navbar";
import LanguageSwitcher from "@/components/blocks/language-switcher";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar
        slots={[
          <LanguageSwitcher key="lang" />,
          <AnimatedThemeToggler key="theme" />,
        ]}
      />
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
