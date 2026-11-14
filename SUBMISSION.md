# Submission texts

## NVIDIA · Best Use of Nemotron

**Model:** NVIDIA Nemotron 3.5 Super VL (`nvidia/nemotron-3.5-super-vl-120b-a12b`).

**What it does:** Nemotron is the brain of two voice agents, one for job seekers and one for hiring managers. It reads the input (a CV and a LinkedIn PDF, or a rough job draft or a screenshot of an old post, as text and images). It prepares questions from domain golden rules and runs the live conversation turn by turn: it notes facts in the person's own words, tracks coverage, asks targeted follow-ups and then writes a Skills Passport or a job post. ElevenLabs gives it a voice.

**Why it matters:** recruitment juries told us the problem with AI hiring is the lack of human touch. We use Nemotron not to generate more generic text, but to ask the questions that bring out what only the person can say: the real numbers and their own contribution, the 3 to 5 skills a manager truly needs instead of 12, the honest hard parts of a job, and quotes in people's own words. No AI matchmaking: people choose people.

**How we improved its outputs:**
- Prompts built on researched golden rules (12 for skills profiles, with field-specific checklists; 15 for job posts, backed by research on requirement lists, realistic job previews, pay transparency and post length).
- Schema-validated JSON with a self-repair loop.
- Grounding enforced by code: numbers not found in the sources or transcript are flagged; quotes are kept only if they appear word for word in what the person said.
- Code guarantees that mandatory questions (such as the "superhero triage") are never skipped.
- Thinking off for interview latency, retries with backoff, text-only fallback if images are refused, and a live call log on the "How it works" page.

## City of Espoo · Rethinking Recruitment
Companies describe their needs late and vaguely, job seekers struggle to show their strengths, and both sides now talk through AI-generated text. HumanTouch puts a voice agent in front of each side before the event. In 5 minutes, it turns a vague need into a clear post with 3 to 5 true essentials, a salary range and an honest Finnish requirement. In 10 minutes, it turns a CV into a passport with real numbers and the person's own words. Then people connect: candidates apply, recruiters review. On request, the AI pre-checks the evidence line by line with exact quotes. The recruiter confirms each line and owns the score. There is no automatic rejection ("not now" needs a reason the candidate sees), candidates can respond, every step is logged, profiles stay anonymous until the candidate applies, and the data is minimal and synthetic. This follows the EU AI Act rules for high-risk recruitment uses: human oversight, transparency, explanation and record-keeping.

## ElevenLabs · Best Use of ElevenLabs
Both agents are spoken: ElevenLabs Flash v2.5 asks every question and Scribe transcribes every answer. People who find it hard to write about themselves, including non-native writers, simply talk. Job posts also have a "Listen" button.
