import { useState } from "react";
import { useStore } from "@/state/store";
import { uploadReference } from "@/api/client";
import type { VoiceMode } from "@/api/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const NONE = "__none__";

function AttributeSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  const items = useStore((s) => s.voice.instruct_items);
  const setVoice = useStore((s) => s.setVoice);
  const current = items.find((i) => options.includes(i)) ?? NONE;

  function pick(value: string) {
    const without = items.filter((i) => !options.includes(i));
    setVoice({ instruct_items: value === NONE ? without : [...without, value] });
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={current} onValueChange={pick}>
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Any</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function VoicePanel() {
  const vocab = useStore((s) => s.vocab);
  const voice = useStore((s) => s.voice);
  const setVoice = useStore((s) => s.setVoice);
  const [uploading, setUploading] = useState(false);
  const [refName, setRefName] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { ref_id } = await uploadReference(file);
      setVoice({ ref_id });
      setRefName(file.name);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Voice</Label>
      <Tabs value={voice.mode} onValueChange={(m) => setVoice({ mode: m as VoiceMode })}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto">Auto</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="clone">Clone</TabsTrigger>
        </TabsList>

        <TabsContent value="auto">
          <p className="text-sm text-muted-foreground">
            OmniVoice picks a voice automatically. The grid still varies whatever axes you configure.
          </p>
        </TabsContent>

        <TabsContent value="design" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Describe the base voice. If an axis sweeps a description attribute (e.g. pitch), leave it unset here.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <AttributeSelect label="Gender" options={vocab?.genders ?? []} />
            <AttributeSelect label="Age" options={vocab?.age_levels ?? []} />
            <AttributeSelect label="Accent" options={vocab?.accents ?? []} />
          </div>
        </TabsContent>

        <TabsContent value="clone" className="space-y-2">
          <p className="text-sm text-muted-foreground">Upload a short reference clip and its transcript to clone a voice.</p>
          <div className="space-y-1">
            <Label className="text-xs">Reference audio (wav)</Label>
            <Input type="file" accept="audio/*" onChange={onFile} />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {refName && !uploading && <p className="text-xs text-muted-foreground">Loaded: {refName}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reference transcript</Label>
            <Textarea
              value={voice.ref_text ?? ""}
              onChange={(e) => setVoice({ ref_text: e.target.value })}
              placeholder="Exact words spoken in the reference clip"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
