import { RotateCcw } from "lucide-react";
import { useStore } from "@/state/store";
import type { Axis, ParamMeta } from "@/api/types";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HelpTip } from "@/components/HelpTip";

/** Which axis (if any) a numeric param is currently swept on. */
function axisLabelFor(param: string, axes: [string, Axis | null][]): string | null {
  for (const [name, a] of axes) if (a && a.kind === "numeric" && a.param === param) return name;
  return null;
}

function ParamRow({ meta, axisName }: { meta: ParamMeta; axisName: string | null }) {
  const value = useStore((s) => s.sampler[meta.param]);
  const setSampler = useStore((s) => s.setSampler);

  const header = (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm">{meta.label}</Label>
      <HelpTip text={meta.description} />
    </div>
  );

  // Boolean parameter -> switch.
  if (meta.type === "bool") {
    return (
      <div className="flex items-center justify-between py-1">
        {header}
        <Switch checked={Boolean(value ?? meta.default)} onCheckedChange={(v) => setSampler(meta.param, v)} />
      </div>
    );
  }

  // Numeric parameter currently varied on an axis -> read-only note.
  if (axisName) {
    return (
      <div className="flex items-center justify-between py-1">
        {header}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          varies on {axisName}
        </span>
      </div>
    );
  }

  const num = typeof value === "number" ? value : (meta.default as number);
  const isDefault = num === meta.default;

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between">
        {header}
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button
              type="button"
              onClick={() => setSampler(meta.param, meta.default)}
              className="text-muted-foreground/70 transition-colors hover:text-foreground"
              aria-label={`Reset ${meta.label} to default`}
              title={`Reset to ${meta.default}`}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums">
            {meta.type === "int" ? num : num.toFixed(2)}
          </span>
        </div>
      </div>
      <Slider
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={[num]}
        onValueChange={([v]) => setSampler(meta.param, v)}
      />
    </div>
  );
}

export function GenerationSettings() {
  const vocab = useStore((s) => s.vocab);
  const xAxis = useStore((s) => s.xAxis);
  const yAxis = useStore((s) => s.yAxis);
  const gridAxis = useStore((s) => s.gridAxis);
  const resetSampler = useStore((s) => s.resetSampler);
  if (!vocab) return null;

  const axes: [string, Axis | null][] = [
    ["X axis", xAxis],
    ["Y axis", yAxis],
    ["grid slider", gridAxis],
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Applied to every sample. Parameters on an axis vary per cell instead.
        </p>
        <button
          type="button"
          onClick={resetSampler}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset all
        </button>
      </div>
      <div className="divide-y">
        {vocab.params.map((meta) => (
          <ParamRow key={meta.param} meta={meta} axisName={axisLabelFor(meta.param, axes)} />
        ))}
      </div>
    </div>
  );
}
