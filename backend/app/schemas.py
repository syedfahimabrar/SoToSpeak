"""Request/response models for the So-to-Speak API."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Voice
# ---------------------------------------------------------------------------


class VoiceSpec(BaseModel):
    """How to voice the utterance.

    - auto:   let OmniVoice choose a voice
    - design: fixed instruct tokens (base for a design/instruct axis)
    - clone:  reference audio (uploaded -> ref_id) + its transcript
    """

    mode: Literal["auto", "design", "clone"] = "auto"
    # design
    instruct_items: list[str] = Field(default_factory=list)
    # clone
    ref_id: Optional[str] = None
    ref_text: Optional[str] = None


# ---------------------------------------------------------------------------
# Axes
# ---------------------------------------------------------------------------


class NumericAxis(BaseModel):
    """A numeric sweep of a sampler/speed parameter."""

    kind: Literal["numeric"] = "numeric"
    param: str  # speed | guidance_scale | position_temperature | class_temperature | num_step | t_shift
    min: float
    max: float
    steps: int = Field(ge=1, le=15)


class InstructAxis(BaseModel):
    """A categorical sweep over instruct-vocabulary levels (e.g. pitch)."""

    kind: Literal["instruct"] = "instruct"
    param: Literal["instruct_variant"] = "instruct_variant"
    levels: list[str]  # each is a valid instruct token, e.g. "low pitch"


Axis = NumericAxis | InstructAxis


class JobRequest(BaseModel):
    text: str
    language: Optional[str] = None
    voice: VoiceSpec = Field(default_factory=VoiceSpec)
    x_axis: Axis
    y_axis: Optional[Axis] = None
    grid_axis: Optional[Axis] = None  # optional 3rd axis -> slider between grids
    # Fixed sampler overrides applied to every sample (axes take precedence).
    # Values are numeric except booleans like `denoise`.
    sampler: dict[str, float | bool] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------


class SampleResult(BaseModel):
    index: int
    xi: int
    yi: int
    gi: int
    x_value: float | str
    y_value: float | str | None
    grid_value: float | str | None
    params: dict[str, float | str]
    duration: float
    utmos: float
    audio_url: str


class AxisMeta(BaseModel):
    kind: str
    param: str
    values: list[float | str]


class JobStatus(BaseModel):
    id: str
    state: Literal["pending", "running", "done", "error"]
    total: int
    generated: int
    scored: int
    message: str = ""
    x_axis: Optional[AxisMeta] = None
    y_axis: Optional[AxisMeta] = None
    grid_axis: Optional[AxisMeta] = None
    results: list[SampleResult] = Field(default_factory=list)
