import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-100">
              RIP SnackSendr 💀
            </CardTitle>
            <p className="text-sm text-neutral-400">
              A snack delivery app that died from founder burnout and bad UI. Gone too soon.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">founder-burnout</Badge>
              <Badge variant="secondary">bad-ui</Badge>
              <Badge variant="secondary">market-saturation</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                👍 <span className="text-neutral-300">42</span> upvotes
              </span>
              <span className="flex items-center gap-1">
                🔥 <span className="text-orange-400">15</span> roasts
              </span>
              <span className="flex items-center gap-1">
                💬 <span className="text-neutral-300">8</span> comments
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-100">
              RIP PetTech AI 🤖
            </CardTitle>
            <p className="text-sm text-neutral-400">
              AI-powered pet care that couldn&apos;t even take care of itself. Lasted 3 months.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">over-engineering</Badge>
              <Badge variant="secondary">no-market-need</Badge>
              <Badge variant="secondary">ai-hype</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                👍 <span className="text-neutral-300">67</span> upvotes
              </span>
              <span className="flex items-center gap-1">
                🔥 <span className="text-orange-400">23</span> roasts
              </span>
              <span className="flex items-center gap-1">
                💬 <span className="text-neutral-300">12</span> comments
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-100">
              RIP CryptoLaundry 🧺
            </CardTitle>
            <p className="text-sm text-neutral-400">
              Blockchain-based laundry service. The only thing that got washed was our money.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">crypto-winter</Badge>
              <Badge variant="secondary">regulatory-issues</Badge>
              <Badge variant="destructive">terrible-idea</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                👍 <span className="text-neutral-300">134</span> upvotes
              </span>
              <span className="flex items-center gap-1">
                🔥 <span className="text-orange-400">89</span> roasts
              </span>
              <span className="flex items-center gap-1">
                💬 <span className="text-neutral-300">45</span> comments
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-neutral-500">
            🚧 Real obituaries coming soon... This is just mock data.
          </p>
        </div>
      </div>
    </div>
  );
}
