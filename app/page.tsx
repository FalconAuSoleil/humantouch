import Link from "next/link";
import { ArrowRight, Briefcase, FileText, Mic, Sparkles, UserRound, Users } from "lucide-react";

function Path({ href, side, icon: Icon, title, steps, cta }: {
  href: string; side: "cand" | "emp"; icon: typeof UserRound; title: string; steps: { icon: typeof Mic; text: string }[]; cta: string;
}) {
  const c = side === "cand" ? { bar: "bg-cand", soft: "bg-cand-soft text-cand", btn: "bg-cand", hover: "hover:border-cand" } : { bar: "bg-emp", soft: "bg-emp-soft text-emp", btn: "bg-emp", hover: "hover:border-emp" };
  return (
    <Link href={href} className={`group relative overflow-hidden rounded-3xl border border-line bg-white p-8 transition hover:-translate-y-1 ${c.hover}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${c.bar}`} />
      <div className={`mb-6 flex size-16 items-center justify-center rounded-2xl ${c.soft}`}><Icon className="size-8" /></div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <ul className="mt-5 space-y-3">
        {steps.map(({ icon: S, text }) => (
          <li key={text} className="flex items-center gap-3 text-body">
            <span className={`flex size-8 items-center justify-center rounded-full ${c.soft}`}><S className="size-4" /></span>
            {text}
          </li>
        ))}
      </ul>
      <span className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white ${c.btn}`}>
        {cta} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-6">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          AI asks. <span className="text-cand">You sound like you.</span>
        </h1>
        <p className="mt-4 text-lg text-muted">Our AI asks you the right questions, out loud, so your own story comes through.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Path href="/candidate" side="cand" icon={UserRound} title="I'm looking for a job" cta="Start"
          steps={[{ icon: FileText, text: "Add your CV" }, { icon: Mic, text: "Talk with the AI" }, { icon: Sparkles, text: "Get your Skills Passport" }]} />
        <Path href="/employer" side="emp" icon={Briefcase} title="I'm hiring" cta="Post a job"
          steps={[{ icon: FileText, text: "Write a rough draft" }, { icon: Mic, text: "Talk with the AI" }, { icon: Users, text: "Publish, meet people" }]} />
      </section>
    </div>
  );
}
