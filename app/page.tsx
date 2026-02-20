import Link from "next/link";

const tools = [
  {
    name: "Curl Builder",
    desc: "Generate complex curl commands from parameters instantly.",
    href: "/curl-builder/",
  },
  {
    name: "Calorie Tracker",
    desc: "Snap a photo of your food — AI estimates calories and macros. Track daily intake.",
    href: "/calorie-tracker",
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6">
      <nav className="flex items-center justify-between py-8 border-b border-stone-200">
        <a href="https://osmanfatihkilic.dev" className="text-sm font-medium text-stone-900 hover:text-stone-500 transition-colors">
          Osman Fatih Kilic
        </a>
        <a href="https://osmanfatihkilic.dev" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
          ← Back to CV
        </a>
      </nav>
      <header className="pt-20 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Tools</h1>
        <p className="text-stone-500 text-lg font-light">Small utilities I&apos;ve built.</p>
      </header>
      <div className="border-t border-stone-100">
        {tools.map((t) => (
          <Link
            key={t.name}
            href={t.href}
            className="flex items-start justify-between gap-6 py-6 border-b border-stone-100 group"
          >
            <div>
              <div className="text-sm font-medium text-stone-800 group-hover:text-stone-500 transition-colors">
                {t.name}
              </div>
              <div className="text-sm text-stone-400 mt-1">{t.desc}</div>
            </div>
            <span className="text-stone-300 group-hover:text-stone-500 transition-colors shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
