import { create } from "zustand";
import type { Axis, JobRequest, JobStatus, SampleResult, SamplerValue, VoiceSpec, Vocab } from "@/api/types";
import { createJob, getVocab, subscribeJob } from "@/api/client";

/** Numeric params that vary across the grid (so they're fixed per-cell, not global). */
function axisNumericParams(axes: (Axis | null)[]): Set<string> {
  const set = new Set<string>();
  for (const a of axes) if (a && a.kind === "numeric") set.add(a.param);
  return set;
}

const DEFAULT_PITCH_LEVELS = ["very low pitch", "low pitch", "moderate pitch", "high pitch", "very high pitch"];

function defaultXAxis(): Axis {
  return { kind: "numeric", param: "speed", min: 0.8, max: 1.2, steps: 5 };
}
function defaultYAxis(): Axis {
  return { kind: "instruct", param: "instruct_variant", levels: DEFAULT_PITCH_LEVELS };
}

interface AppState {
  vocab: Vocab | null;
  text: string;
  language: string;
  voice: VoiceSpec;
  xAxis: Axis;
  yAxis: Axis | null;
  gridAxis: Axis | null;
  sampler: Record<string, SamplerValue>;

  job: JobStatus | null;
  submitting: boolean;
  error: string | null;
  gridIndex: number;
  nowPlaying: SampleResult | null;

  loadVocab: () => Promise<void>;
  setText: (t: string) => void;
  setLanguage: (l: string) => void;
  setVoice: (v: Partial<VoiceSpec>) => void;
  setXAxis: (a: Axis) => void;
  setYAxis: (a: Axis | null) => void;
  setGridAxis: (a: Axis | null) => void;
  setSampler: (key: string, value: SamplerValue | undefined) => void;
  setGridIndex: (i: number) => void;
  setNowPlaying: (s: SampleResult | null) => void;
  resetSampler: () => void;
  submit: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  vocab: null,
  text: "The weather is really lovely today, isn't it?",
  language: "",
  voice: { mode: "auto", instruct_items: [] },
  xAxis: defaultXAxis(),
  yAxis: defaultYAxis(),
  gridAxis: null,
  sampler: {},

  job: null,
  submitting: false,
  error: null,
  gridIndex: 0,
  nowPlaying: null,

  loadVocab: async () => {
    try {
      const vocab = await getVocab();
      // Seed every parameter at its default so the panel reflects real values.
      const sampler: Record<string, SamplerValue> = {};
      for (const p of vocab.params) sampler[p.param] = p.default;
      set({ vocab, sampler });
    } catch (e) {
      set({ error: `Could not reach backend: ${(e as Error).message}` });
    }
  },

  setText: (text) => set({ text }),
  setLanguage: (language) => set({ language }),
  setVoice: (v) => set((s) => ({ voice: { ...s.voice, ...v } })),
  setXAxis: (xAxis) => set({ xAxis }),
  setYAxis: (yAxis) => set({ yAxis }),
  setGridAxis: (gridAxis) => set({ gridAxis, gridIndex: 0 }),
  setSampler: (key, value) =>
    set((s) => {
      const next = { ...s.sampler };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return { sampler: next };
    }),
  setGridIndex: (gridIndex) => set({ gridIndex }),
  setNowPlaying: (nowPlaying) => set({ nowPlaying }),
  resetSampler: () =>
    set((s) => {
      const sampler: Record<string, SamplerValue> = {};
      for (const p of s.vocab?.params ?? []) sampler[p.param] = p.default;
      return { sampler };
    }),

  submit: async () => {
    const s = get();
    if (!s.text.trim() || s.submitting) return;
    set({ submitting: true, error: null, job: null, nowPlaying: null, gridIndex: 0 });

    // Params that vary on an axis are set per-cell, so drop them from the fixed set.
    const onAxis = axisNumericParams([s.xAxis, s.yAxis, s.gridAxis]);
    const sampler: Record<string, SamplerValue> = {};
    for (const [k, v] of Object.entries(s.sampler)) if (!onAxis.has(k)) sampler[k] = v;

    const req: JobRequest = {
      text: s.text,
      language: s.language || null,
      voice: s.voice,
      x_axis: s.xAxis,
      y_axis: s.yAxis,
      grid_axis: s.gridAxis,
      sampler,
    };

    try {
      const { job_id } = await createJob(req);
      subscribeJob(
        job_id,
        (status) => set({ job: status }),
        (status) => set({ job: status, submitting: false })
      );
    } catch (e) {
      set({ submitting: false, error: (e as Error).message });
    }
  },
}));
