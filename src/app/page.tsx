import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { RainbowButton } from "@/components/ui/rainbow-button";
import Loading from "@/components/common/loading";

const Spline = dynamic(() => import("@splinetool/react-spline/next"), {
  ssr: true,
  loading: () => <Loading />,
});

export default function Sahayak() {
  return (
    <div className="relative h-screen w-full bg-white overflow-hidden">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <Link href="/auth/student" className="inline-block">
          <RainbowButton>Login</RainbowButton>
        </Link>
      </div>
      <div className="h-full w-full flex items-center justify-center">
        <Spline scene="https://prod.spline.design/H6ABeSZWeDwQPUd7/scene.splinecode" />
      </div>
    </div>
  );
}
