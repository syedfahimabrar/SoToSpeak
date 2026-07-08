import { useStore } from "@/state/store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TextPanel() {
  const text = useStore((s) => s.text);
  const setText = useStore((s) => s.setText);

  return (
    <div className="space-y-2">
      <Label htmlFor="sentence">Text to synthesize</Label>
      <Textarea
        id="sentence"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter a sentence…"
        className="min-h-[80px]"
      />
    </div>
  );
}
