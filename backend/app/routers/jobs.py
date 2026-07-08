"""Job endpoints: create a grid job, poll status, stream progress via SSE."""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..jobs import store
from ..schemas import JobRequest, JobStatus

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("")
async def create_job(req: JobRequest) -> dict[str, str]:
    job = store.create(req)
    # Fire-and-forget background task; progress is observed via GET/SSE.
    asyncio.create_task(job.run())
    return {"job_id": job.id}


@router.get("/{job_id}", response_model=JobStatus)
async def get_job(job_id: str) -> JobStatus:
    job = store.get(job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    return job.status


@router.get("/{job_id}/events")
async def job_events(job_id: str) -> EventSourceResponse:
    job = store.get(job_id)
    if job is None:
        raise HTTPException(404, "job not found")

    async def gen():
        # Emit the current state immediately, then on every change.
        while True:
            yield {"event": "status", "data": job.status.model_dump_json()}
            if job.status.state in ("done", "error"):
                break
            try:
                await asyncio.wait_for(job.updated.wait(), timeout=15.0)
            except asyncio.TimeoutError:
                pass  # heartbeat: re-emit current status

    return EventSourceResponse(gen())
