import { z } from "zod";

// ---------- Candidate side ----------

export const ProfileSchema = z.object({
  headline: z.string().describe("Title shown at the top of the CV or LinkedIn, as written"),
  location: z.string().nullable(),
  experiences: z
    .array(
      z.object({
        ref: z.string().describe("exp1, exp2... most recent first"),
        title: z.string(),
        organization: z.string(),
        client: z.string().nullable().describe("Client where the mission happened, only if written"),
        start: z.string().nullable().describe("YYYY-MM or YYYY"),
        end: z.string().nullable().describe("YYYY-MM, YYYY or null when current"),
        kind: z.enum(["job", "internship", "freelance", "volunteer", "project", "career-break"]),
        description: z.string().describe("Original description, condensed, no added meaning"),
        tools: z.array(z.string()).describe("Tools named in THIS experience only"),
      }),
    )
    .describe("Most recent first"),
  education: z.array(z.object({ degree: z.string(), school: z.string(), years: z.string().nullable() })),
  languages: z.array(z.object({ name: z.string(), level: z.string().nullable() })),
  certifications: z.array(z.string()),
  skills: z.array(z.string()).describe("Skills listed in a summary or skills section"),
  projects: z.array(z.object({ name: z.string(), description: z.string() })).describe("Side projects, hackathons, awards not tied to an experience"),
  inconsistencies: z.array(z.string()).describe("Places where CV and LinkedIn disagree, both versions quoted"),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const TOPICS = ["result", "team", "contribution", "scale", "context", "stakeholders", "tools", "field", "transferable", "preferences", "confirm"] as const;

export const BriefSchema = z.object({
  positioning: z.string().describe("Apparent positioning in one sentence, with the exact words of the sources"),
  field: z.string().nullable().describe("Name of the 'What each field must show' section of the guide that fits best"),
  alreadyKnown: z.array(z.string()).describe("Facts with numbers already written that the candidate only has to confirm"),
  questions: z
    .array(
      z.object({
        expRef: z.string().nullable().describe("ref of the experience, null for general questions"),
        topic: z.enum(TOPICS),
        priority: z.enum(["must", "high", "medium"]),
        question: z.string().describe("Spoken question, max 20 words, one question, no list of examples"),
      }),
    )
    .describe("8 to 14 questions, ordered as the interview will go"),
});
export type Brief = z.infer<typeof BriefSchema>;
export type BriefQuestion = { id: string; expRef: string | null; topic: string; priority: "must" | "high" | "medium"; question: string };
export type InterviewState = { turns: Turn[]; facts: Fact[]; covered: string[]; done: boolean };

export const FactSchema = z.object({
  text: z.string().describe("Short sentence with the candidate's exact words and numbers"),
  point: z.enum(["number", "team", "contribution", "other"]),
  expRef: z.string().nullable(),
});
export type Fact = z.infer<typeof FactSchema>;

export const InterviewTurnSchema = z.object({
  facts: z.array(FactSchema).describe("New facts from the candidate's LAST answer only"),
  coveredQuestionIds: z.array(z.string()).describe("Ids of prepared questions now answered (or that the candidate could not answer after a follow-up)"),
  nextQuestion: z.string().nullable().describe("Next thing to say: one short question. null when the interview is complete"),
  nextQuestionId: z.string().nullable().describe("Id of the prepared question you are asking, or null for a follow-up"),
  done: z.boolean(),
});

export const PassportSchema = z.object({
  headline: z.string().describe("Target job title in market words, e.g. 'Data Engineer'"),
  summary: z.string().describe("Two sentences a recruiter reads in 10 seconds"),
  topSkills: z.array(z.string()).describe("Exactly 3 master skills, 2 to 4 words each"),
  technicalSkills: z.array(z.string()),
  functionalSkills: z.array(z.string()),
  tools: z.array(z.string()),
  transferableSkills: z.array(z.object({ skill: z.string(), proof: z.string() })).describe("Skills proven in one context that transfer to another"),
  experiences: z.array(
    z.object({
      title: z.string(),
      organization: z.string(),
      sector: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      kind: z.enum(["job", "internship", "freelance", "volunteer", "project", "career-break"]),
      context: z.string().describe("Who, what stake, scale, role in the team: 30 to 60 words"),
      achievements: z.array(z.string()).describe("Action-first bullets, 8 to 20 words"),
      results: z.array(z.string()).describe("Measured or named outcomes"),
      tools: z.array(z.string()),
      source: z.enum(["documents", "interview", "both"]),
    }),
  ),
  education: z.array(z.object({ degree: z.string(), school: z.string(), years: z.string().nullable() })),
  languages: z.array(z.object({ name: z.string(), level: z.string() })),
  certifications: z.array(z.string()),
  projects: z.array(z.string()).describe("'Title: description' bullets for projects and awards"),
  preferences: z.object({
    targetRoles: z.array(z.string()),
    location: z.string().nullable(),
    remote: z.string().nullable(),
    availability: z.string().nullable(),
  }),
  toVerify: z.array(z.string()).describe("Unknowns that matter, phrased as actions for the candidate"),
  ownWords: z.array(z.string()).describe("1 to 3 sentences copied WORD FOR WORD from the candidate's interview answers that show who they are"),
});
export type Passport = z.infer<typeof PassportSchema>;

export type Turn = { role: "agent" | "candidate"; text: string; at: string };

export type QualityCheck = { id: string; label: string; ok: boolean; detail?: string };
export type QualityReport = { score: number; checks: QualityCheck[]; ungroundedNumbers: string[] };

export type Candidate = {
  id: string;
  firstName: string;
  createdAt: string;
  status: "new" | "extracted" | "interview" | "passport";
  sources: { kind: "cv" | "linkedin"; name: string; text: string }[];
  profile?: Profile;
  brief?: { positioning: string; field: string | null; alreadyKnown: string[]; questions: BriefQuestion[] };
  interview: InterviewState;
  passport?: Passport;
  quality?: QualityReport;
  visible: boolean;
  seed?: boolean;
};

// ---------- Employer side ----------

export const JOB_SECTIONS = ["role", "essentials", "day", "team", "practical"] as const;

export const JobBriefSchema = z.object({
  listedSkills: z.array(z.string()).describe("Every skill, tool or requirement the draft asks for, as written"),
  questions: z
    .array(
      z.object({
        expRef: z.enum(JOB_SECTIONS).describe("Section of the interview the question belongs to"),
        topic: z.string().describe("Golden rule id, e.g. R4"),
        priority: z.enum(["must", "high", "medium"]),
        question: z.string().describe("Spoken question to the hiring manager, max 20 words, informal 'you'"),
      }),
    )
    .describe("8 to 11 questions in interview order"),
  biasFlags: z.array(
    z.object({ phrase: z.string().describe("Exact phrase from the draft"), why: z.string(), suggestion: z.string() }),
  ),
});
export type JobBrief = z.infer<typeof JobBriefSchema>;

export const PostingSchema = z.object({
  title: z.string().describe("Market-standard title, no 'ninja', no internal grade"),
  level: z.string().describe("Junior, Mid-level, Senior, Lead..."),
  summary: z.string().describe("Why the role exists and the problem to solve: 2 to 3 sentences"),
  outcomes: z.array(z.string()).describe("What success looks like in the first 6 to 12 months, 3 to 5 bullets"),
  mustHave: z
    .array(z.object({ skill: z.string(), evidence: z.string().describe("What a convincing proof looks like") }))
    .describe("At most 5 true requirements"),
  niceToHave: z.array(z.object({ skill: z.string() })),
  team: z.string(),
  tools: z.array(z.string()),
  location: z.string(),
  remote: z.string(),
  salary: z.string().nullable().describe("Range as given by the employer, null if they refused"),
  workingLanguage: z.string(),
  finnishRequired: z.boolean(),
  languageNote: z.string(),
  relocationSupport: z.string().nullable(),
  process: z.array(z.string()).describe("Hiring steps with timing"),
  inclusionStatement: z.string(),
  aDay: z.array(z.string()).describe("2 to 4 concrete moments of a normal day or week"),
  challenges: z.array(z.string()).describe("1 or 2 honest hard parts of the job, said by the manager"),
  growth: z.string().nullable().describe("What the person will learn and how they are supported"),
  managerWords: z.array(z.string()).describe("1 to 3 sentences copied WORD FOR WORD from the hiring manager's interview answers"),
});
export type Posting = z.infer<typeof PostingSchema>;

export type Job = {
  id: string;
  company: string;
  createdAt: string;
  status: "draft" | "published";
  draft: { title: string; text: string };
  brief?: { listedSkills: string[]; biasFlags: JobBrief["biasFlags"]; questions: BriefQuestion[] };
  interview: InterviewState;
  answers: { question: string; answer: string }[];
  posting?: Posting;
  quality?: QualityReport;
  seed?: boolean;
};

// ---------- Human choices ----------

export const FitCheckSchema = z.object({
  requirements: z.array(
    z.object({
      skill: z.string(),
      kind: z.enum(["must", "nice"]),
      status: z.enum(["met", "partial", "missing"]),
      evidence: z.string().describe("Exact quote copied from the passport, empty if missing"),
    }),
  ),
});
export type ReqCheck = z.infer<typeof FitCheckSchema>["requirements"][number] & { grounded?: boolean };
export type LogEntry = { at: string; actor: "ai" | "recruiter" | "candidate"; action: string; detail?: string };

export type Application = {
  id: string;
  candidateId: string;
  jobId: string;
  status: "applied" | "invited" | "accepted" | "declined";
  initiatedBy: "candidate" | "employer";
  note: string;
  slot?: string;
  createdAt: string;
  /** AI suggestion, only when the recruiter asks for it. Never decides. */
  aiCheck?: ReqCheck[];
  /** The recruiter's own assessment; the score comes from it. */
  checks?: ReqCheck[];
  score?: number | null;
  decision?: "shortlist" | "invite" | "not_now" | null;
  reason?: string;
  reply?: string;
  log?: LogEntry[];
};

export type AiCall = { at: string; task: string; ms: number; attempts: number; ok: boolean; vision?: boolean; error?: string; provider?: string };
