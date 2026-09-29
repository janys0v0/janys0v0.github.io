// Scripted answers for "Ask the frog". Each answer is matched by keywords; sources point back to the site.
import { experience } from "./experience";
import { profile } from "./profile";
import { terraces } from "./skills";

export type Faq = { q: string; keys: string[]; a: string; sources: { label: string; href: string }[] };

const exp = (id: string) => experience.find((e) => e.id === id)!;
const src = (id: string) => ({ label: exp(id).org, href: `/#${id}` });

export const faq: Faq[] = [
  { q: "Who is Janys?", keys: ["who", "janys", "about", "yourself", "intro", "background"],
    a: `${profile.bio} In short: an amphibian between how people think and how systems get built.`, sources: [{ label: "Overview", href: "/overview" }] },
  { q: "What are you looking for?", keys: ["looking", "role", "job", "hiring", "open", "relocat", "next", "opportunit"],
    a: `Roles where data science, AI and product meet, such as AI product, applied ML or data science with real users. ${profile.status}.`, sources: [{ label: "Let's Chat", href: "/#chat" }] },
  { q: "Why cognitive science + data science?", keys: ["cognitive", "cog", "psych", "why", "science", "combine", "both"],
    a: "Cognitive science explains how people think and decide; data science and ML turn that into systems that work for them. Research at ACME Lab and product work at ISF both sit right in that overlap.",
    sources: [src("acme"), src("isf")] },
  { q: "What did you build at Balyasny?", keys: ["balyasny", "bam", "forecast", "hedge", "finance", "agent platform"],
    a: `${exp("bam").summary} The question: “${exp("bam").problem}” The answer: ${exp("bam").result}`, sources: [src("bam")] },
  { q: "What's your AI / agent experience?", keys: ["ai", "agent", "agentic", "llm", "rag", "genai", "generative", "langchain", "openai", "automation"],
    a: "AI agents for model analysis at an investment firm, an AI analytics assistant at Cathay Pacific, and an AI document reader at Ekimetrics: practical AI that saves people time.",
    sources: [src("bam"), src("cathay"), src("ekimetrics")] },
  { q: "Tell me about your product management work", keys: ["product", "pm", "manager", "prd", "roadmap", "0→1", "0 to 1", "launch", "isf", "develop for good"],
    a: `${exp("isf").summary} ${exp("isf").result} I led it from user interviews to a shipped product.`, sources: [src("isf"), { label: "ISF case study", href: "/work/isf" }] },
  { q: "How do you do user research?", keys: ["research", "user", "interview", "usability", "test", "ux", "customer"],
    a: "Interviews first, then usability tests that turn friction into fixes. It is how the ISF product and the Emotion Compass took shape.",
    sources: [{ label: "ISF case study", href: "/work/isf" }, { label: "Emotion Compass", href: "/work/acme" }] },
  { q: "What was Cathay Pacific about?", keys: ["cathay", "airline", "chrome", "extension", "shopping"],
    a: `${exp("cathay").summary} ${exp("cathay").result}`, sources: [src("cathay")] },
  { q: "What is Harvard Grid?", keys: ["harvard", "grid", "incubator", "startup", "mentor", "demo day", "teach"],
    a: `${exp("harvard-grid").summary} ${exp("harvard-grid").result}`, sources: [src("harvard-grid")] },
  { q: "What did you do at Ekimetrics?", keys: ["ekimetrics", "consult", "marketing", "bayesian", "esg", "spark", "databricks"],
    a: `${exp("ekimetrics").summary} ${exp("ekimetrics").result}`, sources: [src("ekimetrics")] },
  { q: "What's the Emotion Compass?", keys: ["emotion", "compass", "acme", "ucla", "lab", "experiment", "app"],
    a: "A research app I designed at UCLA's ACME Lab: people tap where a feeling sits (pleasantness × energy). You can try it on the case-study page.",
    sources: [{ label: "Try the Emotion Compass", href: "/work/acme" }] },
  { q: "What are your skills?", keys: ["skill", "stack", "tool", "language", "python", "sql", "tech", "know"],
    a: terraces.map((t) => `${t.label}: ${t.keywords.slice(0, 5).join(", ")}`).join(". ") + ".", sources: [{ label: "Skills", href: "/overview#skills" }] },
  { q: "Where did you study?", keys: ["study", "school", "education", "degree", "harvard", "ucla", "mit", "gpa"],
    a: "M.S. Data Science at Harvard (cross-registered at MIT, expected Jan 2027). B.S. Statistics & Data Science + Cognitive Science at UCLA, Magna Cum Laude.",
    sources: [{ label: "Overview", href: "/overview" }] },
  { q: "What do you do for fun?", keys: ["fun", "hobby", "hobbies", "free time", "interest", "snowboard", "climb", "boulder", "dance", "sing"],
    a: "Snowboarding (7 years), bouldering, dance team and a cappella. Outside work, you'll find me on mountains or walls.", sources: [] },
  { q: "How can I contact you?", keys: ["contact", "email", "reach", "linkedin", "chat", "talk", "message", "hire"],
    a: `Leave a note at the seabed (Let's Chat), email ${profile.email}, or connect on LinkedIn.`, sources: [{ label: "Let's Chat", href: "/#chat" }, { label: "LinkedIn", href: profile.links.linkedin }] },
  { q: "How was this site built?", keys: ["site", "website", "built", "three", "3d", "frog", "how was", "react"],
    a: "Next.js + React Three Fiber. Every object is drawn in code with neon outlines, the frog is a spring-animated rig, and scroll drives its path from land to seabed. No 3D model files are downloaded.",
    sources: [{ label: "GitHub", href: profile.links.github }] },
];

/** Best scripted answer for a question, or null. Scores keyword hits; longer keys count more. */
export function answer(question: string): Faq | null {
  const q = question.toLowerCase();
  let best: Faq | null = null, bestScore = 0;
  for (const f of faq) {
    const score = f.keys.reduce((s, k) => s + (q.includes(k) ? 1 + k.length / 10 : 0), 0);
    if (score > bestScore) { best = f; bestScore = score; }
  }
  return best;
}
