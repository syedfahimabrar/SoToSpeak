import { useStore } from "@/state/store";
import { Progress } from "@/components/ui/progress";

export function ProgressCard() {
  const job = useStore((s) => s.job);
  if (!job || job.state === "done") return null;

  const pct = job.total ? Math.round((job.scored / job.total) * 100) : 0;

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {job.state === "error"
            ? "Error"
            : job.state === "pending"
              ? "Starting…"
              : `Generating ${job.generated}/${job.total} · scoring ${job.scored}/${job.total}`}
        </span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <Progress value={pct} />
      {job.state === "error" && <p className="text-sm text-destructive">{job.message}</p>}
    </div>
  );
}
