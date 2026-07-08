import type { Axis, ParamMeta } from "@/api/types";
import { useStore } from "@/state/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTip } from "@/components/HelpTip";

const NONE = "__none__";

function paramKey(axis: Axis | null): string {
  if (!axis) return NONE;
  if (axis.kind === "instruct") return "instruct";
  return axis.param;
}

/** Preview the actual values a numeric axis will sweep. */
function numericPreview(min: number, max: number, steps: number, isInt: boolean): string {
  if (steps <= 1) return String(isInt ? Math.round(min) : min);
  const out: string[] = [];
  const stepSize = (max - min) / (steps - 1);
  for (let i = 0; i < steps; i++) {
    const v = min + i * stepSize;
    out.push(isInt ? String(Math.round(v)) : String(Math.round(v * 100) / 100));
  }
  return out.join(" · ");
}

export function AxisConfig({
  label,
  axis,
  onChange,
  allowNone,
}: {
  label: string;
  axis: Axis | null;
  onChange: (a: Axis | null) => void;
  allowNone?: boolean;
}) {
  const vocab = useStore((s) => s.vocab);
  const presets = vocab?.instruct_axis_presets ?? {};
  const params: ParamMeta[] = (vocab?.params ?? []).filter((p) => p.type !== "bool");
  const activeMeta = axis?.kind === "numeric" ? params.find((p) => p.param === axis.param) : undefined;

  function selectParam(key: string) {
    if (key === NONE) return onChange(null);
    if (key === "instruct") {
      const firstPreset = Object.keys(presets)[0] ?? "pitch";
      return onChange({ kind: "instruct", param: "instruct_variant", levels: presets[firstPreset] ?? [] });
    }
    const meta = params.find((p) => p.param === key);
    onChange({
      kind: "numeric",
      param: key,
      min: meta?.axis_min ?? meta?.min ?? 0,
      max: meta?.axis_max ?? meta?.max ?? 1,
      steps: 5,
    });
  }

  function updateNumeric(patch: Partial<Extract<Axis, { kind: "numeric" }>>) {
    if (axis?.kind === "numeric") onChange({ ...axis, ...patch });
  }

  const currentPresetName =
    axis?.kind === "instruct"
      ? Object.entries(presets).find(([, lv]) => lv.join("|") === axis.levels.join("|"))?.[0]
      : undefined;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
        {axis && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {axis.kind === "instruct" ? axis.levels.length : axis.steps} cells
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Select value={paramKey(axis)} onValueChange={selectParam}>
          <SelectTrigger>
            <SelectValue placeholder="Choose parameter" />
          </SelectTrigger>
          <SelectContent>
            {allowNone && <SelectItem value={NONE}>None</SelectItem>}
            {params.map((p) => (
              <SelectItem key={p.param} value={p.param}>
                {p.label}
              </SelectItem>
            ))}
            {Object.keys(presets).length > 0 && <SelectItem value="instruct">Voice description</SelectItem>}
          </SelectContent>
        </Select>
        {activeMeta && <HelpTip text={activeMeta.description} />}
      </div>

      {axis?.kind === "numeric" && activeMeta && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="number"
                step={activeMeta.step}
                min={activeMeta.min}
                max={activeMeta.max}
                value={axis.min}
                onChange={(e) => updateNumeric({ min: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="number"
                step={activeMeta.step}
                min={activeMeta.min}
                max={activeMeta.max}
                value={axis.max}
                onChange={(e) => updateNumeric({ max: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Cells</Label>
                <HelpTip text="How many samples to generate along this axis (its resolution)." />
              </div>
              <Select value={String(axis.steps)} onValueChange={(v) => updateNumeric({ steps: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {numericPreview(axis.min, axis.max, axis.steps, activeMeta.type === "int")}
          </p>
        </div>
      )}

      {axis?.kind === "instruct" && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Attribute</Label>
          <Select
            value={currentPresetName ?? Object.keys(presets)[0]}
            onValueChange={(name) => onChange({ kind: "instruct", param: "instruct_variant", levels: presets[name] ?? [] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(presets).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{axis.levels.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
