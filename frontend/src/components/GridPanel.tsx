import { useStore } from "@/state/store";
import type { SampleResult } from "@/api/types";
import { mosColor, textOn } from "@/lib/color";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

function fmt(v: number | string | null): string {
  if (v === null || v === "") return "";
  return typeof v === "number" ? String(Math.round(v * 100) / 100) : v;
}

export function GridPanel() {
  const job = useStore((s) => s.job);
  const gridIndex = useStore((s) => s.gridIndex);
  const nowPlaying = useStore((s) => s.nowPlaying);
  const setNowPlaying = useStore((s) => s.setNowPlaying);

  if (!job || job.results.length === 0) return null;

  const xValues = job.x_axis?.values ?? [""];
  const yValues = job.y_axis?.values ?? [""];
  const nx = xValues.length;

  // Index results by (xi, yi) within the current grid layer.
  const cells = new Map<string, SampleResult>();
  for (const r of job.results) {
    if (r.gi === gridIndex) cells.set(`${r.xi}:${r.yi}`, r);
  }

  const xParam = job.x_axis?.param ?? "x";
  const yParam = job.y_axis?.param ?? "y";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <div className="overflow-auto">
          <div
            className="inline-grid gap-[2px]"
            style={{ gridTemplateColumns: `auto repeat(${nx}, minmax(48px, 1fr))` }}
          >
            {/* Header row: corner + x labels */}
            <div className="flex items-end justify-end p-1 text-[10px] text-muted-foreground">
              {yParam}\{xParam}
            </div>
            {xValues.map((xv, xi) => (
              <div key={`xh-${xi}`} className="p-1 text-center text-[11px] font-medium text-muted-foreground">
                {fmt(xv)}
              </div>
            ))}

            {/* Rows, highest y on top */}
            {yValues
              .map((yv, yi) => ({ yv, yi }))
              .reverse()
              .map(({ yv, yi }) => (
                <FragmentRow
                  key={`row-${yi}`}
                  yLabel={fmt(yv)}
                  nx={nx}
                  yi={yi}
                  cells={cells}
                  nowPlayingUrl={nowPlaying?.audio_url}
                  onPlay={setNowPlaying}
                />
              ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Cell = predicted quality (UTMOS, green = better). Click to play. Rows: {yParam}; columns: {xParam}.
        </p>
      </div>
    </TooltipProvider>
  );
}

function FragmentRow({
  yLabel,
  nx,
  yi,
  cells,
  nowPlayingUrl,
  onPlay,
}: {
  yLabel: string;
  nx: number;
  yi: number;
  cells: Map<string, SampleResult>;
  nowPlayingUrl?: string;
  onPlay: (s: SampleResult) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-end p-1 text-right text-[11px] font-medium text-muted-foreground">
        {yLabel}
      </div>
      {Array.from({ length: nx }, (_, xi) => {
        const cell = cells.get(`${xi}:${yi}`);
        if (!cell) {
          return <div key={xi} className="aspect-square rounded-sm bg-muted/40 animate-pulse" />;
        }
        const playing = cell.audio_url === nowPlayingUrl;
        return (
          <Tooltip key={xi}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onPlay(cell)}
                className={`aspect-square rounded-sm text-[11px] font-semibold transition-transform hover:scale-105 ${
                  playing ? "ring-2 ring-offset-1 ring-primary" : ""
                }`}
                style={{ backgroundColor: mosColor(cell.utmos), color: textOn(cell.utmos) }}
              >
                {cell.utmos.toFixed(1)}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-0.5">
                <div>MOS {cell.utmos.toFixed(2)} · {cell.duration}s</div>
                {Object.entries(cell.params).map(([k, v]) => (
                  <div key={k} className="text-[10px] opacity-80">
                    {k}: {String(v)}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}
