import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TextPanel } from "@/components/TextPanel";
import { VoicePanel } from "@/components/VoicePanel";
import { AxisConfig } from "@/components/AxisConfig";
import { GenerationSettings } from "@/components/GenerationSettings";
import { ProgressCard } from "@/components/ProgressCard";
import { GridPanel } from "@/components/GridPanel";
import { GridSelector } from "@/components/GridSelector";
import { PlayerBar } from "@/components/PlayerBar";

export default function App() {
  const loadVocab = useStore((s) => s.loadVocab);
  const vocab = useStore((s) => s.vocab);
  const error = useStore((s) => s.error);
  const submitting = useStore((s) => s.submitting);
  const submit = useStore((s) => s.submit);
  const xAxis = useStore((s) => s.xAxis);
  const yAxis = useStore((s) => s.yAxis);
  const gridAxis = useStore((s) => s.gridAxis);
  const setXAxis = useStore((s) => s.setXAxis);
  const setYAxis = useStore((s) => s.setYAxis);
  const setGridAxis = useStore((s) => s.setGridAxis);
  const job = useStore((s) => s.job);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    loadVocab();
  }, [loadVocab]);

  const gridSize =
    (xAxis?.kind === "instruct" ? xAxis.levels.length : xAxis?.steps ?? 1) *
    (yAxis == null ? 1 : yAxis.kind === "instruct" ? yAxis.levels.length : yAxis.steps) *
    (gridAxis == null ? 1 : gridAxis.kind === "instruct" ? gridAxis.levels.length : gridAxis.steps);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-semibold">So-to-Speak</h1>
            <p className="text-sm text-muted-foreground">
              Explore OmniVoice's control space — a grid of samples, scored and playable.
            </p>
          </div>
        </div>
      </header>

      <main className="container grid gap-6 py-6 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextPanel />
              <VoicePanel />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grid axes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AxisConfig label="X axis (columns)" axis={xAxis} onChange={(a) => a && setXAxis(a)} />
              <AxisConfig label="Y axis (rows)" axis={yAxis} onChange={setYAxis} allowNone />
              <AxisConfig label="Grid slider (optional)" axis={gridAxis} onChange={setGridAxis} allowNone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setShowSettings((v) => !v)}
                aria-expanded={showSettings}
              >
                <CardTitle className="text-base">Generation settings</CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${showSettings ? "rotate-180" : ""}`}
                />
              </button>
            </CardHeader>
            {showSettings && (
              <CardContent>
                <GenerationSettings />
              </CardContent>
            )}
          </Card>

          <Button className="w-full" disabled={submitting || !vocab} onClick={submit}>
            {submitting ? "Generating…" : `Generate ${gridSize} sample${gridSize === 1 ? "" : "s"}`}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Output */}
        <div className="space-y-4">
          <ProgressCard />
          <GridSelector />
          <PlayerBar />
          {job && job.results.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <GridPanel />
              </CardContent>
            </Card>
          ) : (
            !submitting && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Configure axes and generate to see the grid.
              </div>
            )
          )}
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}
