import type { Metadata } from "next";

// Old URL from the previous site: forward to the new case study.
export const metadata: Metadata = { title: "Moved · janys.ponder", robots: { index: false } };

export default function Moved() {
  return (
    <main className="grid min-h-svh place-items-center bg-ink p-6 text-center">
      <meta httpEquiv="refresh" content="0; url=/work/isf" />
      <p>This page moved. <a className="text-frog underline" href="/work/isf">Go to the ISF case study →</a></p>
    </main>
  );
}
