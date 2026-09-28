"use client";

import dynamic from "next/dynamic";

// Load the 3D scene after the text: the page is readable before three.js arrives.
const PondCanvas = dynamic(() => import("./PondCanvas"), { ssr: false });

export function HomeScene() {
  return <PondCanvas />;
}
