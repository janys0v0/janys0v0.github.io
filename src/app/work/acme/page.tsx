import type { Metadata } from "next";
import { CaseLayout, Chips, Figure, Section, StatRow } from "@/components/case-study/blocks";
import { EmotionCompass } from "@/components/EmotionCompass";

export const metadata: Metadata = {
  title: "Emotion Compass case study · Janys (Jiayang) Li",
  description: "Research and product case study: designing the Emotion Compass app and a 300-person experiment at UCLA's ACME Lab.",
};

// Methods only: research findings stay off the page until the lab confirms they can be public.
export default function AcmeCaseStudy() {
  return (
    <CaseLayout
      kicker="Case study · ACME Lab @ UCLA Psychology"
      title="Emotion Compass: measuring feelings as they move"
      role="Research Assistant · Adaptive Cognition, Memory & Emotion Lab"
      meta="Mar 2022 – Sep 2024 · Los Angeles"
      result="Designed the Emotion Compass app for a 300-person study; usability fixes raised user confidence 24%."
      back="/#acme"
    >
      <Section n="01" title="Try it first">
        <p>Tap where a feeling sits. Left to right is how pleasant it is; bottom to top is how much energy it has.</p>
        <EmotionCompass />
      </Section>

      <Section n="02" title="The question">
        <p>
          Emotions aren’t fixed states. The lab wanted to capture how they shift from moment to moment, and whether people
          differ in how easily they move between them. That needs many quick, precise ratings without tiring participants.
        </p>
      </Section>

      <Section n="03" title="Designing the app">
        <p>
          A compass lets people answer two questions (how pleasant, how energetic) with a single tap, instead of filling in
          scales. Anchoring emojis at the corners gave first-time users an instant sense of the space.
        </p>
        <Figure src="/work/emotion-compass.jpg" alt="Three phone screens of the Emotion Compass app" caption="Emotion Compass: instructions, the rating circle, and confirmation." />
      </Section>

      <Section n="04" title="Testing with participants">
        <StatRow stats={[["300", "participant study"], ["10+", "usability sessions"], ["20+", "improvements"], ["+24%", "user confidence"]]} />
        <p>
          In-person interviews and usability tests surfaced 20+ improvements, from clearer instructions to feedback after
          each tap, raising participants’ confidence in their answers by 24%.
        </p>
      </Section>

      <Section n="05" title="Methods">
        <p>
          I designed and programmed the 300-person experiment recording emotional fluctuations, and analysed the data with
          clustering and state-switching models to study how readily emotions change.
        </p>
        <Chips items={["Experiment design", "Usability testing", "Mobile UX", "Python", "Clustering", "Hidden Markov Models"]} />
      </Section>
    </CaseLayout>
  );
}
