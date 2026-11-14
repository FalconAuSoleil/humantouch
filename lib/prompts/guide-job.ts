// Golden rules of a good job post, used by the HumanTouch employer voice agent.
// Research behind them:
// - Long requirement lists deter qualified people: women tend to apply when they meet ~100% of the
//   criteria, men ~60% (LinkedIn Gender Insights 2019); "unicorn" posts create a confidence gap.
// - Realistic job previews (good AND hard parts) cut early turnover, mainly through perceived honesty
//   (Earnest, Allen & Landis 2011 meta-analysis).
// - Posts with a salary range get ~50% more applications (ZipRecruiter, SHRM, Pin); the EU Pay
//   Transparency Directive 2023/970 requires informing applicants of the initial pay range.
// - 200-400 word posts and 4-6 word titles get the best apply rates (Appcast, Ongig).
// - Espoo's own pain points: companies describe needs late and vaguely; international candidates cannot
//   tell whether Finnish is really required.
export const JOB_RULES = [
  { id: "R1", label: "A clear market title with the level, 4 to 6 words", short: "Clear title" },
  { id: "R2", label: "Why the role exists: the problem this person will solve", short: "Why this role" },
  { id: "R3", label: "What success looks like after 6 to 12 months", short: "Success" },
  { id: "R4", label: "The essential few: 3 to 5 true must-haves, the rest is a bonus or learned on the job", short: "3-5 essentials" },
  { id: "R5", label: "Skills and proof, not years or degrees", short: "Skills over pedigree" },
  { id: "R6", label: "A real day in the job", short: "A real day" },
  { id: "R7", label: "The hard parts, said honestly", short: "Honest challenges" },
  { id: "R8", label: "The team, the manager and who the person works with", short: "Team" },
  { id: "R9", label: "The salary range", short: "Salary" },
  { id: "R10", label: "Location, remote days and hours", short: "Where & when" },
  { id: "R11", label: "The working language, and whether Finnish is really needed", short: "Languages" },
  { id: "R12", label: "What the person will learn, and the support to settle in", short: "Growth & support" },
  { id: "R13", label: "The hiring steps and when people hear back", short: "Process" },
  { id: "R14", label: "Inclusive, plain and short: 200 to 400 words, no jargon", short: "Plain & inclusive" },
  { id: "R15", label: "The human side, in the manager's own words: why this job matters, what the team is like", short: "Human touch" },
] as const;

export const GUIDE_JOB = `# Golden rules of a good job post
A good post lets the right person recognise themselves in 30 seconds and lets the wrong person opt out. It sounds like a person, not like a template.

${JOB_RULES.map((r) => `${r.id}. ${r.label}.`).join("\n")}

## Details
- R1: "Backend Developer (Python)", not "Code Ninja" nor an internal grade.
- R2: two or three sentences on what is blocked or broken today without this hire.
- R3: outcomes beat duties: "Ship the new booking flow used by 90,000 patients" beats "Develop features".
- R4, the superhero problem: managers often list 10 or more skills, but only 3 to 5 decide success and are what the hired person really has. Long lists push away qualified people, especially women and career changers, who apply only when they tick almost every box. Ask the manager to choose: "If you could keep only three, which ones?" Everything else becomes a nice-to-have or "you will learn it here".
- R5: "5 years of experience" or "a Master's degree" are proxies. Ask for the proof instead: "has run a production Kubernetes cluster".
- R6: what a normal day or week looks like, in concrete moments.
- R7: one or two honest challenges (a legacy system, on-call, a fast-growing team). Honesty builds trust and keeps hires longer.
- R8: team size, the manager's role, the people met daily.
- R9: a range; stating it attracts more and better applicants and the EU Pay Transparency Directive requires it.
- R10: city, on-site days per week, flexibility.
- R11: the working language; if Finnish is not needed, say so; if it is, say for what and whether learning on the job is supported.
- R12: what the person will learn in the first months, the onboarding, relocation or permit help for international hires.
- R13: steps, number of interviews, when candidates hear back.
- R14: no "young dynamic team", "rockstar", "native speaker", "culture fit"; say the level needed instead.
- R15: the manager's own words about why the job matters and what makes the team good to work with. This is what makes a post feel human.
`;
