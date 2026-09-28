export type Terrace = { id: string; label: string; keywords: string[] };

// One terrace per skill group, in hop order (left → right).
export const terraces: Terrace[] = [
  {
    id: "ai",
    label: "AI & ML",
    keywords: ["Agentic AI", "LLM Agents", "RAG", "Generative AI", "Model Evaluation", "NLP", "Prompt Engineering", "Automation"],
  },
  {
    id: "product",
    label: "Product",
    keywords: ["0→1 Product", "Product Strategy", "Roadmapping", "Journey Mapping", "User Research", "A/B Testing"],
  },
  {
    id: "data",
    label: "Prog & Data",
    keywords: ["Python", "SQL", "JavaScript", "LangChain", "GCP", "AWS", "Azure", "Databricks", "Spark"],
  },
];

export const languages = ["English", "Mandarin"];
