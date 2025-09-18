"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function IndochinaStarfishPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Ensure the iframe loads the PDF
    if (iframeRef.current) {
      iframeRef.current.src = "/Indochina Starfish Foundation Portfolio.pdf";
    }
  }, []);

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          
          <h1 className="text-xl font-bold text-white">
            Indochina Starfish Foundation Portfolio
          </h1>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="h-[calc(100vh-80px)]">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Indochina Starfish Foundation Portfolio"
          src="/Indochina Starfish Foundation Portfolio.pdf#toolbar=1&navpanes=1&scrollbar=1"
        />
      </div>

      {/* Download Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="/Indochina Starfish Foundation Portfolio.pdf"
          download="Indochina Starfish Foundation Portfolio.pdf"
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download PDF</span>
        </a>
      </div>
    </div>
  );
}
