// Mirror of backend/app/schemas.py

export type VoiceMode = "auto" | "design" | "clone";

export interface VoiceSpec {
  mode: VoiceMode;
  instruct_items: string[];
  ref_id?: string | null;
  ref_text?: string | null;
}

export interface NumericAxis {
  kind: "numeric";
  param: string;
  min: number;
  max: number;
  steps: number;
}

export interface InstructAxis {
  kind: "instruct";
  param: "instruct_variant";
  levels: string[];
}

export type Axis = NumericAxis | InstructAxis;

export type SamplerValue = number | boolean;

export interface JobRequest {
  text: string;
  language?: string | null;
  voice: VoiceSpec;
  x_axis: Axis;
  y_axis?: Axis | null;
  grid_axis?: Axis | null;
  sampler: Record<string, SamplerValue>;
}

export interface SampleResult {
  index: number;
  xi: number;
  yi: number;
  gi: number;
  x_value: number | string;
  y_value: number | string | null;
  grid_value: number | string | null;
  params: Record<string, number | string>;
  duration: number;
  utmos: number;
  audio_url: string;
}

export interface AxisMeta {
  kind: string;
  param: string;
  values: (number | string)[];
}

export type JobState = "pending" | "running" | "done" | "error";

export interface JobStatus {
  id: string;
  state: JobState;
  total: number;
  generated: number;
  scored: number;
  message: string;
  x_axis?: AxisMeta | null;
  y_axis?: AxisMeta | null;
  grid_axis?: AxisMeta | null;
  results: SampleResult[];
}

export type ParamType = "float" | "int" | "bool";

export interface ParamMeta {
  param: string;
  label: string;
  description: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean;
  axis_min?: number;
  axis_max?: number;
}

export interface Vocab {
  genders: string[];
  pitch_levels: string[];
  age_levels: string[];
  accents: string[];
  styles: string[];
  instruct_axis_presets: Record<string, string[]>;
  params: ParamMeta[];
}
