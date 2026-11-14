import { read } from "@/lib/db";
import { handle } from "@/lib/http";

// No AI ranking: people who applied first, then every shared passport. The employer decides.
// Anonymous until the candidate applies or accepts an invitation.
export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]/people">) {
  const { id } = await ctx.params;
  return handle(() =>
    read((db) => {
      const rows = db.candidates
        .filter((c) => c.visible && c.passport)
        .map((c) => {
          const application = db.applications.find((a) => a.jobId === id && a.candidateId === c.id) ?? null;
          const revealed = !!application && (application.status === "applied" || application.status === "accepted");
          const p = c.passport!;
          return {
            application,
            candidate: {
              id: c.id,
              label: revealed ? c.firstName : `Talent #${c.id.slice(0, 3).toUpperCase()}`,
              revealed,
              headline: p.headline,
              summary: p.summary,
              topSkills: p.topSkills,
              tools: p.tools,
              ownWords: p.ownWords ?? [],
              languages: p.languages,
              experiences: p.experiences.slice(0, 3).map((e) => ({ title: e.title, sector: e.sector, results: e.results })),
              availability: p.preferences.availability,
            },
          };
        });
      const rank = (r: (typeof rows)[number]) => (r.application?.initiatedBy === "candidate" ? 0 : r.application ? 1 : 2);
      return rows.sort((a, b) => rank(a) - rank(b));
    }),
  );
}
