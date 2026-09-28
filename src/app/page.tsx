"use client";

import FrogHop from "@/components/frogHop";
import SocialPanel from "@/components/SocialPanel";
import dynamic from "next/dynamic";

const CylinderScene = dynamic(() => import("@/components/CylinderScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0d1117",
      }}
    >
      {/* ── True 3D cylinder — canvas texture on smooth geometry ── */}
      <CylinderScene />

      {/* ── Frog (above canvas) ── */}
      <div className="absolute inset-0 frog-container" style={{ zIndex: 20 }}>
        <FrogHop />
      </div>

      {/* ── Social panel ── */}
      <SocialPanel />
    </main>
  );
}
