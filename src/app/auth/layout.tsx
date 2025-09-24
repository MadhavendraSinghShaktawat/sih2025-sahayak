"use client";

import React from "react";
import { Navbar } from "@/components/common/navbar";
import LanguageSwitcher from "@/components/common/language-switcher";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-b">
      <Navbar
        slots={[
          <LanguageSwitcher key="lang" />,
          <AnimatedThemeToggler key="theme" />,
        ]}
      />
      {children}
    </div>
  );
}
