export type ClientAnimal = "octopus" | "turtle" | "flyingFish" | "starfish" | "crab" | "jellyfish";

export type Experience = {
  id: string;
  org: string;
  role: string;
  dates: string;
  location: string;
  animal: ClientAnimal;
  problem: string; // the client animal's bubble
  result: string; // the frog's "ta-da" bubble
  bullets: string[];
  tags: string[];
  link?: { label: string; href: string };
};

// Dive order: newest at the surface, oldest at the bottom.
export const experience: Experience[] = [
  {
    id: "bam",
    org: "Balyasny Asset Management",
    role: "Summer Associate, Data Scientist",
    dates: "Jun – Aug 2026",
    location: "New York City",
    animal: "octopus",
    problem: "Can we trust our forecasts, faster?",
    result: "AI agents that test and explain models in minutes.",
    bullets: [
      "Built AI forecasting tools and agents for an investment firm.",
      "Built AI agents that test and explain models.",
      "Presented the work to technical and non-technical partners.",
    ],
    tags: ["Agentic AI", "Forecasting", "Model Evaluation", "Stakeholders"],
    link: { label: "Watch on LinkedIn", href: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7490130801372794880/" },
  },
  {
    id: "harvard-grid",
    org: "Harvard Grid",
    role: "Applied AI Incubator Facilitator",
    dates: "Sep 2025 – Present",
    location: "Boston",
    animal: "turtle",
    problem: "10 student teams have AI ideas. How do they become startups?",
    result: "A 0→1 incubator: 10 teams, 20 mentors, and a Demo Day with 100+ attendees.",
    bullets: [
      "Built and ran a 3-month applied-AI incubator for 10 student startup teams; designed the curriculum and led 10 sessions",
      "Recruited 20 technical and industry mentors; hosted a 100+ attendee Demo Day with 30+ investors and mentors",
    ],
    tags: ["0→1", "Program Design", "Go-to-Market", "Facilitation"],
  },
  {
    id: "cathay",
    org: "Cathay Pacific",
    role: "Data Science Intern",
    dates: "Jul – Aug 2025",
    location: "Hong Kong",
    animal: "flyingFish",
    problem: "Members give up before their discount even activates.",
    result: "Discount activation 90s → 25s, and analytics 3.5 hrs → 10 min.",
    bullets: [
      "Researched shopping-journey pain points, pitched requirements to 10 stakeholders across 3 departments, and built a self-service Chrome extension (72% faster activation)",
      "Built a multi-modal AI agent workflow (OpenAI, Zapier) that turns product listings into structured insights (95% faster)",
      "Researched pain points across 10+ departments; presented at 3 workshops to 200+ attendees",
    ],
    tags: ["Customer Research", "Chrome Extension", "Agentic AI", "Workshops"],
  },
  {
    id: "isf",
    org: "Develop for Good × ISF Cambodia",
    role: "Product Manager",
    dates: "May – Aug 2025",
    location: "Remote · Hong Kong",
    animal: "starfish",
    problem: "Scattered data causes inconsistencies, delays, and errors. (ISF team)",
    result: "2-week reporting turned into real-time monitoring for 100+ staff supporting 4,000+ children.",
    bullets: [
      "Led an 11-member cross-functional team to launch a 0→1 data management product for attendance and program outcomes",
      "Interviewed 10+ stakeholders across 4 user groups → requirements, roadmap and PRD; shipped with design and engineering using Agile",
      "Ran 10 usability tests → 20+ UX improvements → 2× task-completion confidence",
    ],
    tags: ["0→1", "User Research", "PRD", "Usability Testing"],
    link: { label: "See how we found the 3 biggest usability problems", href: "/portfolio/indochina-starfish" },
  },
  {
    id: "ekimetrics",
    org: "Ekimetrics",
    role: "Data Science Consultant Intern",
    dates: "Jun – Dec 2024",
    location: "Hong Kong",
    animal: "crab",
    problem: "Analysts spend 20 minutes digging numbers out of every report.",
    result: "A document-extraction platform: 20 → 7 minutes per document, with 210% more throughput.",
    bullets: [
      "Engineered a retrieval + LLM document-extraction platform (Azure, LangChain, ChromaDB): 65% less manual effort; 210% throughput via Spark/Databricks",
      "Presented marketing investment recommendations to 10 Fortune 500 client leaders, backed by 10+ Bayesian regressions",
    ],
    tags: ["RAG", "LangChain", "Spark", "Bayesian Modeling"],
  },
  {
    id: "acme",
    org: "ACME Lab @ UCLA Psychology",
    role: "Research Assistant",
    dates: "Mar 2022 – Sep 2024",
    location: "Los Angeles",
    animal: "jellyfish",
    problem: "How do emotions shift from moment to moment, and how do we capture that?",
    result: "Designed the Emotion Compass app; usability fixes raised user confidence 24%.",
    // Methods only until the lab confirms the findings can be public.
    bullets: [
      "Designed and programmed a 300-person experiment recording emotional fluctuations for cognitive analytics research",
      "Designed a mobile app (Emotion Compass) and ran usability tests with 10+ users → 20+ improvements → +24% user confidence",
    ],
    tags: ["Experiment Design", "Usability Testing", "Mobile App", "Cognitive Science"],
  },
];
