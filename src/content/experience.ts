export type ClientAnimal = "octopus" | "turtle" | "flyingFish" | "starfish" | "crab" | "jellyfish";

export type Experience = {
  id: string;
  org: string;
  role: string;
  dates: string;
  location: string;
  animal: ClientAnimal;
  problem: string; // the client's question (left bubble)
  result: string; // the simple solution (frog's "ta-da" bubble)
  summary: string; // one short sentence on the card
  link?: { label: string; href: string };
  /** Photos for the card's window (several = slow crossfade). Drop files in public/work/ and list them here.
   *  `focus` is the CSS object-position, e.g. "50% 25%" keeps a face in frame. */
  photos?: { src: string; alt: string; focus?: string }[];
  /** Small logo badge in the window's corner. */
  badge?: { src: string; alt: string };
};

// Kept short and public-safe on purpose: no internal metrics, client names or confidential details.
// Dive order: newest at the surface, oldest at the bottom.
export const experience: Experience[] = [
  {
    id: "bam",
    org: "Balyasny Asset Management",
    role: "Summer Associate, Data Scientist",
    dates: "Summer 2026",
    location: "New York City",
    animal: "octopus",
    problem: "Can we trust our forecasts, faster?",
    result: "AI agents that test and explain models in minutes.",
    summary: "Built AI forecasting tools and agents for an investment firm.",
    link: { label: "Watch on LinkedIn", href: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7490130801372794880/" },
    photos: [
      { src: "/work/bam-interview.jpg", alt: "Janys in an interview, captioned Commodities Data Science Intern", focus: "50% 22%" },
    ],
  },
  {
    id: "harvard-grid",
    org: "Harvard Grid",
    role: "Applied AI Incubator Facilitator",
    dates: "2025 – Present",
    location: "Boston",
    animal: "turtle",
    problem: "How do student AI ideas become real startups?",
    result: "A hands-on incubator, from first idea to Demo Day.",
    summary: "Designed and ran an applied-AI incubator for student founders.",
    link: { label: "About the incubator", href: "https://grid.harvard.edu/ai-incubator" },
    photos: [{ src: "/work/grid-demo-day.jpg", alt: "A student founder pitching at the Applied AI Incubator Demo Day", focus: "50% 40%" }],
    badge: { src: "/work/grid-logo.png", alt: "Harvard Grid logo" },
  },
  {
    id: "cathay",
    org: "Cathay Pacific",
    role: "Data Science Intern",
    dates: "Summer 2025",
    location: "Hong Kong",
    animal: "flyingFish",
    problem: "How can shopping with us feel effortless?",
    result: "A one-click browser helper and an AI analytics assistant.",
    summary: "Turned customer pain points into self-serve tools and AI automation.",
  },
  {
    id: "isf",
    org: "Develop for Good × ISF Cambodia",
    role: "Product Manager",
    dates: "Summer 2025",
    location: "Remote",
    animal: "starfish",
    problem: "Our data lives everywhere. How do we see the big picture?",
    result: "One simple system, with progress visible in real time.",
    summary: "Led a volunteer team to build a data product for an education nonprofit.",
    link: { label: "Read the case study", href: "/work/isf" },
    photos: [{ src: "/work/isf-product.jpg", alt: "Students at ISF Cambodia next to the data product's sign-in screen" }],
  },
  {
    id: "ekimetrics",
    org: "Ekimetrics",
    role: "Data Science Consultant Intern",
    dates: "2024",
    location: "Hong Kong",
    animal: "crab",
    problem: "Can we stop digging through reports by hand?",
    result: "An AI reader that pulls out the numbers that matter.",
    summary: "Built an AI document reader and data-driven insights for clients.",
  },
  {
    id: "acme",
    org: "ACME Lab @ UCLA Psychology",
    role: "Research Assistant",
    dates: "2022 – 2024",
    location: "Los Angeles",
    animal: "jellyfish",
    problem: "How do feelings change, moment to moment?",
    result: "A tap-to-rate app that captures emotions as they move.",
    summary: "Designed a research app and study on how emotions shift.",
    link: { label: "Try the Emotion Compass", href: "/work/acme" },
    photos: [{ src: "/work/emotion-compass.jpg", alt: "Three phone screens of the Emotion Compass app" }],
  },
];
