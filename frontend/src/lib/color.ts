// Green->red heatmap for MOS scores, mirroring the original So-to-Speak grid.
// Low score -> orange-red (#FF4500), high score -> green-yellow (#9ACD32).

const LOW: [number, number, number] = [255, 69, 0]; // orangered
const HIGH: [number, number, number] = [154, 205, 50]; // yellowgreen

/** Map a MOS value in [min,max] to a CSS rgb() color. */
export function mosColor(value: number, min = 1, max = 5): string {
  if (Number.isNaN(value)) return "rgb(250, 250, 210)";
  const p = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round((1 - p) * LOW[0] + p * HIGH[0]);
  const g = Math.round((1 - p) * LOW[1] + p * HIGH[1]);
  const b = Math.round((1 - p) * LOW[2] + p * HIGH[2]);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Readable text color (black/white) for a given cell background luminance. */
export function textOn(value: number, min = 1, max = 5): string {
  const p = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Both endpoint colors are fairly light, so dark text reads best throughout.
  return p >= 0 ? "#1a1a1a" : "#1a1a1a";
}
