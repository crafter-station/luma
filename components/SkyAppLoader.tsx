"use client";

import dynamic from "next/dynamic";

const SkyApp = dynamic(() => import("./SkyApp"), {
  ssr: false,
  loading: () => (
    <div className="grid h-screen w-screen place-items-center bg-[#05070d] text-sm text-white/60">
      Loading sky engine…
    </div>
  ),
});

export default function SkyAppLoader() {
  return <SkyApp />;
}
