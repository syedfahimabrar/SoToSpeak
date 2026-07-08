import type { JobRequest, JobStatus, Vocab } from "./types";

// Same-origin in dev thanks to the Vite proxy; override for a remote backend.
const BASE = import.meta.env.VITE_API_BASE ?? "";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function getVocab(): Promise<Vocab> {
  return json(await fetch(`${BASE}/api/vocab`));
}

export async function createJob(req: JobRequest): Promise<{ job_id: string }> {
  return json(
    await fetch(`${BASE}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
  );
}

export async function getJob(id: string): Promise<JobStatus> {
  return json(await fetch(`${BASE}/api/jobs/${id}`));
}

export async function uploadReference(file: File): Promise<{ ref_id: string }> {
  const form = new FormData();
  form.append("file", file);
  return json(await fetch(`${BASE}/api/reference-audio`, { method: "POST", body: form }));
}

export function audioUrl(url: string): string {
  return `${BASE}${url}`;
}

/** Subscribe to a job's SSE progress stream. Returns an unsubscribe fn. */
export function subscribeJob(
  id: string,
  onStatus: (s: JobStatus) => void,
  onDone?: (s: JobStatus) => void
): () => void {
  const es = new EventSource(`${BASE}/api/jobs/${id}/events`);
  es.addEventListener("status", (ev) => {
    const status = JSON.parse((ev as MessageEvent).data) as JobStatus;
    onStatus(status);
    if (status.state === "done" || status.state === "error") {
      es.close();
      onDone?.(status);
    }
  });
  es.onerror = () => es.close();
  return () => es.close();
}
