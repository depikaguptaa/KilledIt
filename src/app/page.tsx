export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-neutral-100">
          The Startup Graveyard
        </h1>
        <p className="text-neutral-400">
          Where failed dreams come to rest. Post your startup&apos;s obituary and find catharsis in the chaos.
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Placeholder tombstone cards */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-2 text-xl font-bold text-neutral-100">
            RIP SnackSendr 💀
          </h2>
          <p className="mb-3 text-sm text-neutral-400">
            A snack delivery app that died from founder burnout and bad UI. Gone too soon.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>👍 42 upvotes</span>
            <span>🔥 15 roasts</span>
            <span>💬 8 comments</span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-2 text-xl font-bold text-neutral-100">
            RIP PetTech AI 🤖
          </h2>
          <p className="mb-3 text-sm text-neutral-400">
            AI-powered pet care that couldn&apos;t even take care of itself. Lasted 3 months.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>👍 67 upvotes</span>
            <span>🔥 23 roasts</span>
            <span>💬 12 comments</span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-2 text-xl font-bold text-neutral-100">
            RIP CryptoLaundry 🧺
          </h2>
          <p className="mb-3 text-sm text-neutral-400">
            Blockchain-based laundry service. The only thing that got washed was our money.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>👍 134 upvotes</span>
            <span>🔥 89 roasts</span>
            <span>💬 45 comments</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-neutral-500">
            🚧 Real obituaries coming soon... This is just mock data.
          </p>
        </div>
      </div>
    </div>
  );
}
