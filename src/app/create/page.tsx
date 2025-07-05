import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-neutral-100">
        Confess Your Startup&apos;s Death
      </h1>
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-100">🚧 Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-400">
            The obituary creation form will be here.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            This is where you&apos;ll write your startup&apos;s obituary with title, causes of death, and story.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 