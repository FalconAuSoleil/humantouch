# HumanTouch

**AI that asks you questions, so you sound like you.**

Made for Junction 2026 · Challenges: **Rethinking Recruitment (City of Espoo)**, **Best Use of Nemotron (NVIDIA)**, **Best Use of ElevenLabs**.

## The problem

Today, people use AI to write their CV. Companies use AI to write their job offers. Everything sounds the same. Recruiters can't see the real person, and job seekers can't see the real job.

**AI took away the human touch.**

## Our idea

We use AI the other way round. Instead of writing *for* you, the AI **talks with you** and asks the right questions. Your own story comes out, in your own words.

> [!IMPORTANT]
> **Two AIs, each doing what it does best**
> - 🟩 **NVIDIA Nemotron reads the documents and thinks fast.** It reads your CV or the job draft, even a photo or a PDF. It sees what is missing, prepares the right questions, and writes the final profile or job offer. It thinks a bit longer when writing, and answers almost instantly between questions.
> - 🔊 **ElevenLabs runs the conversation.** You just talk, like on a phone call. The AI waits until you finish, never cuts you off, and writes down what you say. No typing, no buttons.

## How it works

### For job seekers
1. Upload your CV.
2. Talk with the AI for about 10 minutes. It only asks what your CV does not say: real numbers, what *you* did yourself, a moment you are proud of.
3. Get a **Skills Passport**: a clear profile with your own words, quoted exactly.

### For employers
1. Paste a rough job description (or an old one).
2. Talk with the AI for about 5 minutes. It fixes the **"superhero" problem**: a list of 10+ skills nobody has. It helps you keep the 3 to 5 that really matter. It also asks about a real day at work, the hard parts, and what the person will learn.
3. Get a **clear, honest job offer** that people want to read.

### Then people meet
- Job seekers apply to jobs they like.
- If the recruiter asks, the AI checks each requirement and shows the exact proof from the candidate's profile.
- **The recruiter decides, not the AI.** They confirm every line, and the score comes from their choices.
- If the answer is "not now", the recruiter must give a reason. The candidate sees it and can reply.
- Everything is saved, so every decision can be explained.

This follows the **EU AI Act**: hiring is a "high-risk" use of AI, so a human must stay in control.

## Why these rules for job offers
- **Shorter lists bring more people.** Women often apply only if they match 100% of the list, men at about 60% (LinkedIn).
- **Honest offers keep people longer.** Saying the hard parts upfront means fewer people quit early.
- **Showing the salary brings about 50% more applicants.** It will also be required in the EU (Pay Transparency Directive).
- **Short offers work best**: 200 to 400 words, with a title of 4 to 6 words.

## No made-up facts
The AI is not allowed to invent anything. Our code checks it:
- Every number must come from the CV or from what the person said.
- Every quote must match the person's words exactly, or it is removed.
- Important questions can't be skipped.

## Try it locally
```bash
npm install
npm run dev          # open http://localhost:3000
npm run sync:agent   # sets up the ElevenLabs voice agent
```

Put your keys in `.env.local`:
- `NVIDIA_API_KEY`, `NEMOTRON_MODEL` (default `nvidia/nemotron-3.5-super-vl-120b-a12b`)
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`

All the people and jobs in the demo are made up.

## Where to look in the code
- `lib/nemotron.ts`: talks to NVIDIA Nemotron
- `lib/prompts/`: the golden rules and the AI's instructions
- `lib/voice-agent.ts`: the ElevenLabs voice agent
- `components/RealtimeInterview.tsx`: the voice conversation screen
- `lib/quality.ts`: the checks against made-up facts
- `lib/review.ts`, `components/ReviewPanel.tsx`: the recruiter's review
