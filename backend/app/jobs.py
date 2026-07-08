"""Job orchestration: expand axes into a grid of samples, synthesize, score.

A job runs in the background. Each sample is generated on a worker thread (the
model call is blocking) and immediately scored with UTMOS, so the frontend can
stream progress and fill the grid as cells complete.
"""
from __future__ import annotations

import asyncio
import uuid
from typing import Any, Optional

import numpy as np
import soundfile as sf

from . import config, engine, scoring, vocab
from .schemas import (
    Axis,
    AxisMeta,
    InstructAxis,
    JobRequest,
    JobStatus,
    NumericAxis,
    SampleResult,
)

# Sampler params that must be integers when handed to OmniVoice.
_INT_PARAMS = {"num_step"}


def _axis_values(axis: Optional[Axis]) -> list[float | str]:
    if axis is None:
        return [None]  # single implicit level
    if isinstance(axis, NumericAxis):
        if axis.steps == 1:
            return [round(float(axis.min), 4)]
        step = (axis.max - axis.min) / (axis.steps - 1)
        return [round(axis.min + i * step, 4) for i in range(axis.steps)]
    if isinstance(axis, InstructAxis):
        return list(axis.levels)
    raise ValueError(f"unknown axis: {axis!r}")


def _axis_meta(axis: Optional[Axis]) -> Optional[AxisMeta]:
    if axis is None:
        return None
    return AxisMeta(kind=axis.kind, param=axis.param, values=_axis_values(axis))


class Job:
    def __init__(self, req: JobRequest):
        self.id = uuid.uuid4().hex[:12]
        self.req = req
        x_vals = _axis_values(req.x_axis)
        y_vals = _axis_values(req.y_axis)
        g_vals = _axis_values(req.grid_axis)
        self.x_vals, self.y_vals, self.g_vals = x_vals, y_vals, g_vals
        self.status = JobStatus(
            id=self.id,
            state="pending",
            total=len(x_vals) * len(y_vals) * len(g_vals),
            generated=0,
            scored=0,
            x_axis=_axis_meta(req.x_axis),
            y_axis=_axis_meta(req.y_axis),
            grid_axis=_axis_meta(req.grid_axis),
        )
        self.updated = asyncio.Event()

    def _bump(self) -> None:
        self.updated.set()
        self.updated.clear()

    def _build_call(
        self, x_val: Any, y_val: Any, g_val: Any
    ) -> tuple[dict[str, Any], dict[str, float | str]]:
        """Turn the three axis values into synth kwargs + a display param dict."""
        sampler: dict[str, Any] = dict(self.req.sampler)
        instruct_items = list(self.req.voice.instruct_items)
        speed: Optional[float] = self.req.sampler.get("speed")  # allow fixed speed
        sampler.pop("speed", None)
        display: dict[str, float | str] = {}

        def apply(axis: Optional[Axis], val: Any) -> None:
            nonlocal speed
            if axis is None or val is None:
                return
            if isinstance(axis, NumericAxis):
                if axis.param == "speed":
                    speed = float(val)
                elif axis.param in _INT_PARAMS:
                    sampler[axis.param] = int(round(float(val)))
                else:
                    sampler[axis.param] = float(val)
                display[axis.param] = val
            else:  # InstructAxis
                instruct_items.append(str(val))
                display[axis.param] = str(val)

        apply(self.req.x_axis, x_val)
        apply(self.req.y_axis, y_val)
        apply(self.req.grid_axis, g_val)

        kwargs: dict[str, Any] = {"sampler": sampler}
        if self.req.language:
            kwargs["language"] = self.req.language
        if speed is not None:
            kwargs["speed"] = speed
            display.setdefault("speed", round(speed, 3))

        voice = self.req.voice
        if voice.mode == "clone" and voice.ref_id:
            ref_path = config.REF_DIR / f"{voice.ref_id}.wav"
            kwargs["ref_audio"] = str(ref_path)
            if voice.ref_text:
                kwargs["ref_text"] = voice.ref_text
        elif instruct_items:
            kwargs["instruct"] = vocab.build_instruct(instruct_items)
            display.setdefault("instruct", kwargs["instruct"])

        return kwargs, display

    async def run(self) -> None:
        self.status.state = "running"
        self._bump()
        job_dir = config.AUDIO_DIR / self.id
        job_dir.mkdir(parents=True, exist_ok=True)

        index = 0
        try:
            for gi, g_val in enumerate(self.g_vals):
                for yi, y_val in enumerate(self.y_vals):
                    for xi, x_val in enumerate(self.x_vals):
                        kwargs, display = self._build_call(x_val, y_val, g_val)
                        audio = await asyncio.to_thread(
                            engine.synthesize, self.req.text, **kwargs
                        )
                        self.status.generated += 1
                        self._bump()

                        wav_path = job_dir / f"{index:04d}.wav"
                        await asyncio.to_thread(
                            sf.write, str(wav_path), audio, config.SAMPLE_RATE
                        )
                        mos = await asyncio.to_thread(scoring.score, audio)
                        self.status.scored += 1

                        self.status.results.append(
                            SampleResult(
                                index=index,
                                xi=xi,
                                yi=yi,
                                gi=gi,
                                x_value=x_val if x_val is not None else "",
                                y_value=y_val,
                                grid_value=g_val,
                                params=display,
                                duration=round(len(audio) / config.SAMPLE_RATE, 3),
                                utmos=round(float(mos), 3),
                                audio_url=f"/api/audio/{self.id}/{index:04d}.wav",
                            )
                        )
                        self._bump()
                        index += 1
            self.status.state = "done"
            self.status.message = "complete"
        except Exception as exc:  # surface failure to the client
            self.status.state = "error"
            self.status.message = f"{type(exc).__name__}: {exc}"
        finally:
            self._bump()


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def create(self, req: JobRequest) -> Job:
        job = Job(req)
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)


store = JobStore()
