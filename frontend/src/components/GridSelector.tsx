import { useStore } from "@/state/store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

function fmt(v: number | string): string {
  return typeof v === "number" ? String(Math.round(v * 100) / 100) : v;
}

export function GridSelector() {
  const job = useStore((s) => s.job);
  const gridIndex = useStore((s) => s.gridIndex);
  const setGridIndex = useStore((s) => s.setGridIndex);

  const values = job?.grid_axis?.values;
  if (!job || !values || values.length <= 1) return null;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {job.grid_axis?.param}
        </Label>
        <span className="text-sm font-medium">{fmt(values[gridIndex])}</span>
      </div>
      <Slider
        min={0}
        max={values.length - 1}
        step={1}
        value={[gridIndex]}
        onValueChange={([v]) => setGridIndex(v)}
      />
    </div>
  );
}
