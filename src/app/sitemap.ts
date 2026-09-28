import type { MetadataRoute } from "next";

export const dynamic = "force-static";
const base = "https://janys0v0.github.io";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/overview", "/work/isf", "/work/acme"].map((p) => ({ url: base + p, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
