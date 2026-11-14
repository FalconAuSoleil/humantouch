# HumanTouch

Junction 2026 · Tracks: **Rethinking Recruitment (City of Espoo)**, **Best Use of Nemotron (NVIDIA)**, **Best Use of ElevenLabs (MLH)**.

**The problem the juries named: AI in recruitment removes the human touch.** CVs are AI-written, job posts are AI-written, and everyone sounds the same.

**HumanTouch uses AI the other way round: a voice agent that asks you the right questions, so your own story comes through.**

- **Job seekers** drop a CV, then talk with the agent. It knows the golden rules of a great skills profile and the specifics of their field. It asks only what the CV does not say: the real numbers, what they did themselves, a moment they are proud of, what colleagues come to them for. The result is a Skills Passport with **their own words, quoted exactly**.
- **Employers** paste a rough draft (or an old post), then talk with the agent for about 5 minutes. It knows the 15 golden rules of a good job post. It solves the **superhero problem**: the draft lists 10+ skills, the agent makes the manager keep the 3 to 5 that really matter. It also gets a real day, the honest hard parts, what the person will learn and the manager's own words about the team.
- **Human-in-the-loop matching (EU AI Act, recruitment = high risk).** Candidates apply; employers browse anonymous passports and invite. On request, the AI pre-checks each requirement against the passport with an exact, code-verified quote. The recruiter confirms or corrects every line, and **the score comes from the recruiter's choices**. There is no automatic rejection: "not now" needs a reason the candidate sees, candidates can add context, and every AI suggestion and human decision is logged.

## Why these job post rules
- Long requirement lists deter qualified people: women tend to apply when they meet ~100% of the criteria, men ~60% (LinkedIn Gender Insights). Hence 3 to 5 essentials.
- Realistic job previews (good and hard parts) reduce early turnover through perceived honesty (Earnest, Allen & Landis meta-analysis).
- Posts with a salary range get ~50% more applications (ZipRecruiter, SHRM, Pin); the EU Pay Transparency Directive requires it.
- 200 to 400 word posts and 4 to 6 word titles get the best apply rates (Appcast, Ongig).

> [!IMPORTANT]
> **Two AI engines, each doing what it is best at**
> - 🟩 **NVIDIA Nemotron reads the documents and reasons fast.** It reads the CV, the LinkedIn PDF or the job draft (text *and* page images), finds what is missing, prepares the right questions from the golden rules, then writes the Skills Passport or the job post. Reasoning is tuned per task: deeper when writing, almost instant between questions.
> - 🔊 **ElevenLabs runs the conversation.** A real-time voice agent streams audio both ways, waits for the person to finish speaking (no interruptions), and transcribes every answer. Nobody has to type or click: just talk.

## Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run sync:agent   # creates or updates the ElevenLabs voice agent
```
`.env.local`: `NVIDIA_API_KEY`, `NVIDIA_BASE_URL` (default `https://integrate.api.nvidia.com/v1`), `NEMOTRON_MODEL` (default `nvidia/nemotron-3.5-super-vl-120b-a12b`), `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`. Data: `.data/db.json` locally, Upstash Redis on Vercel when its variables exist. Synthetic data only.

## Where Nemotron does the work
Model: **NVIDIA Nemotron 3.5 Super VL**, called through the OpenAI-compatible NVIDIA API (`lib/nemotron.ts`).

| Step | Grounding by code |
| --- | --- |
| Reads the CV / LinkedIn (text + page images) or the job draft (text or screenshot) | Contacts stripped before any call |
| Prepares the voice questions from the golden rules and the person's field | Never asks what the document already says |
| Writes the Skills Passport / the job post from the conversation | Every number must exist in the sources or the transcript; every quote must appear word for word in what the person said, or it is dropped |
| Pre-checks a candidate's evidence for the recruiter, on request | Each suggestion must quote the passport exactly; the recruiter confirms every line |

Speed: schema-validated JSON with a self-repair loop, retries with backoff, and reasoning effort set per task (low for writing, off between questions).

## Where ElevenLabs does the work
- **Conversational agent** (real time): streaming audio, patient turn-taking, backchannels like "yeah" or "ok" never cut it off. It updates the screen through silent tools (`note_fact`, `mark_covered`, `end_interview`); code refuses to end while a key question is still open.
- **Flash v2.5** voice and **Scribe** transcription for the hands-free fallback and the "Listen" button on job posts.

## Code map
- `lib/prompts/`: golden rules (passport, job post) and agent prompts
- `lib/interview.ts`: one interview engine for both agents
- `lib/candidate.ts`, `lib/job.ts`: pipelines
- `lib/quality.ts`: golden-rule checks, number grounding, verified quotes
- `lib/nemotron.ts`: NVIDIA Nemotron client (JSON, repair loop, retries)
- `lib/voice-agent.ts`, `scripts/sync-agent.ts`: ElevenLabs agent config
- `components/RealtimeInterview.tsx`: the real-time voice screen (fallback: `VoiceInterview.tsx`)
- `lib/review.ts`, `components/ReviewPanel.tsx`: human-in-the-loop review
