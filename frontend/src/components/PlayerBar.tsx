import { useStore } from "@/state/store";
import { audioUrl } from "@/api/client";

export function PlayerBar() {
  const nowPlaying = useStore((s) => s.nowPlaying);
  if (!nowPlaying) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-3">
      <audio key={nowPlaying.audio_url} controls autoPlay src={audioUrl(nowPlaying.audio_url)} className="h-9" />
      <div className="text-sm">
        <div className="font-medium">MOS {nowPlaying.utmos.toFixed(2)} · {nowPlaying.duration}s</div>
        <div className="text-xs text-muted-foreground">
          {Object.entries(nowPlaying.params)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}
        </div>
      </div>
    </div>
  );
}
