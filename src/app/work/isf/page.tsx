import type { Metadata } from "next";
import { CaseLayout, Chips, Figure, ProblemFix, Quote, Section, StatRow } from "@/components/case-study/blocks";

export const metadata: Metadata = {
  title: "ISF Cambodia case study · Janys (Jiayang) Li",
  description: "Product management case study: a 0→1 data collection product for the Indochina Starfish Foundation, built with Develop for Good.",
};

export default function IsfCaseStudy() {
  return (
    <CaseLayout
      kicker="Case study · Develop for Good × ISF Cambodia"
      title="One place for an NGO’s data"
      role="Product Manager · team of 11 (managers, designers, engineers)"
      meta="May – Aug 2025 · remote from Hong Kong"
      result="A form-building product on a central database: 2-week reporting became real-time monitoring for 100+ staff supporting 4,000+ children."
      back="/#isf"
    >
      <Section n="01" title="The challenge">
        <p>
          ISF Cambodia is a grassroots NGO in Phnom Penh providing education, sport and community support. Over 17 years it has
          reached 700+ students and 3,000+ community members and started 2 schools. Its data lived in scattered spreadsheets and
          forms, so every report meant days of copying and checking.
        </p>
        <Quote who="ISF team (client)">Scattered data causes inconsistencies, delays, and errors.</Quote>
      </Section>

      <Section n="02" title="Research: who touches the data?">
        <StatRow stats={[["11+", "user interviews"], ["7", "roles at ISF"], ["2", "user groups"], ["3", "tools compared"]]} />
        <p>
          Interviews asked one question in many forms: <em>how do you interact with data here?</em> Two user groups came out:
          <strong> admins</strong>, who define forms and the database structure, and <strong>staff</strong>, who collect student
          data in the field and fix incorrect entries.
        </p>
        <p>
          Existing tools each missed something: Google Forms had no central database, Airtable couldn’t pull database records
          into forms, and KoboToolbox couldn’t batch-enter student information.
        </p>
      </Section>

      <Section n="03" title="Ideation & design">
        <p>
          The key question became: <em>how might we help ISF staff easily centralize data collection and monitor student
          progress?</em> The answer was a form-building website on a central Airtable database, with records pulled into forms
          automatically and batch entry for whole classes.
        </p>
        <Figure src="/work/isf-product.jpg" alt="Screens from the ISF data collection product" caption="The form builder and data views shipped for ISF." />
      </Section>

      <Section n="04" title="Usability testing">
        <StatRow stats={[["10", "testing sessions"], ["15", "friction points found"], ["20+", "UX improvements shipped"], ["2×", "task-completion confidence"]]} />
        <ProblemFix items={[
          { problem: "It’s hard to imagine how forms look.", fix: "Live form preview during creation, with a preview-first mode for new admins." },
          { problem: "The terminology is confusing.", fix: "Plain-language tooltips on every technical term." },
          { problem: "I don’t understand the field-mapping step.", fix: "Redesigned the page to show how data flows between tables." },
        ]} />
        <p>In the final round, 6 of 8 users felt more efficient and 7 of 8 felt more confident in the result.</p>
      </Section>

      <Section n="05" title="Build">
        <p>Shipped with Agile sprints alongside the design and engineering leads; I owned the requirements, roadmap and PRD.</p>
        <Chips items={["React", "TypeScript", "Tailwind", "shadcn/ui", "Node / Express", "Airtable API", "Supabase", "Google OAuth"]} />
      </Section>

      <Section n="06" title="What’s next">
        <p>Dynamic, multi-table forms; a monitoring dashboard wired into the site; and edge-case testing before wider rollout.</p>
        <p>
          <a href="/Indochina Starfish Foundation Portfolio.pdf" className="font-mono text-[14px] text-frog underline" target="_blank" rel="noreferrer">
            Full presentation deck (PDF, 28 MB) ↗
          </a>
        </p>
      </Section>
    </CaseLayout>
  );
}
