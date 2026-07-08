"""OmniVoice instruct vocabulary (voice design).

OmniVoice's ``instruct`` argument is NOT free text: it accepts a fixed set of
English attribute tokens, comma+space separated (e.g. "female, british accent,
low pitch"). This module mirrors that vocabulary so the frontend can offer
valid choices and the axis system can build legal instruct strings.

Source of truth: the ValueError raised by omnivoice when an unknown token is
passed (see omnivoice.models.omnivoice._resolve_instruct).
"""
from __future__ import annotations

# Grouped for a nicer UI; the model itself only cares about the flat set.
PITCH_LEVELS = [
    "very low pitch",
    "low pitch",
    "moderate pitch",
    "high pitch",
    "very high pitch",
]

AGE_LEVELS = ["child", "teenager", "young adult", "middle-aged", "elderly"]

GENDERS = ["female", "male"]

ACCENTS = [
    "american accent",
    "australian accent",
    "british accent",
    "canadian accent",
    "chinese accent",
    "indian accent",
    "japanese accent",
    "korean accent",
    "portuguese accent",
    "russian accent",
]

STYLES = ["whisper"]

# Flat set of every legal English token, for validation.
VALID_INSTRUCT_ITEMS: set[str] = set(
    PITCH_LEVELS + AGE_LEVELS + GENDERS + ACCENTS + STYLES
)

# Presets the frontend uses to seed a categorical ("instruct level") axis.
INSTRUCT_AXIS_PRESETS: dict[str, list[str]] = {
    "pitch": PITCH_LEVELS,
    "age": AGE_LEVELS,
}


# Single source of truth for every generation parameter the UI can control.
# `default` is the value the app initializes to and resets to; `axis_min/axis_max`
# seed a sensible sweep when the parameter is placed on a grid axis.
PARAM_META: list[dict] = [
    {
        "param": "speed",
        "label": "Speed",
        "description": "Speaking rate. Above 1.0 is faster and shorter; below 1.0 is slower and longer.",
        "type": "float",
        "min": 0.5,
        "max": 1.5,
        "step": 0.05,
        "default": 1.0,
        "axis_min": 0.8,
        "axis_max": 1.2,
    },
    {
        "param": "guidance_scale",
        "label": "Guidance",
        "description": "How closely the voice follows your prompt. Higher is more faithful; too high can sound tense.",
        "type": "float",
        "min": 1.0,
        "max": 5.0,
        "step": 0.1,
        "default": 2.0,
        "axis_min": 1.5,
        "axis_max": 3.5,
    },
    {
        "param": "num_step",
        "label": "Diffusion steps",
        "description": "Refinement passes the model runs. More steps sound cleaner but take longer (model default is 32).",
        "type": "int",
        "min": 8,
        "max": 48,
        "step": 1,
        "default": 16,
        "axis_min": 16,
        "axis_max": 32,
    },
    {
        "param": "class_temperature",
        "label": "Token randomness",
        "description": "Variety in each sound the model picks. 0 is stable and safe; higher is more varied and expressive.",
        "type": "float",
        "min": 0.0,
        "max": 2.0,
        "step": 0.05,
        "default": 0.0,
        "axis_min": 0.0,
        "axis_max": 1.0,
    },
    {
        "param": "position_temperature",
        "label": "Order randomness",
        "description": "Variety in the order the model fills in sounds. 0 is deterministic; higher changes phrasing.",
        "type": "float",
        "min": 0.0,
        "max": 10.0,
        "step": 0.5,
        "default": 5.0,
        "axis_min": 0.0,
        "axis_max": 8.0,
    },
    {
        "param": "t_shift",
        "label": "Schedule shift",
        "description": "Where the model concentrates effort across its passes. Smaller values emphasize the earliest passes.",
        "type": "float",
        "min": 0.0,
        "max": 1.0,
        "step": 0.05,
        "default": 0.1,
        "axis_min": 0.05,
        "axis_max": 0.3,
    },
    {
        "param": "layer_penalty_factor",
        "label": "Coarse-detail bias",
        "description": "How strongly the model settles broad audio detail before fine detail.",
        "type": "float",
        "min": 0.0,
        "max": 10.0,
        "step": 0.5,
        "default": 5.0,
        "axis_min": 2.0,
        "axis_max": 8.0,
    },
    {
        "param": "denoise",
        "label": "Denoise",
        "description": "Add a cleanup pass for slightly clearer audio.",
        "type": "bool",
        "default": True,
    },
]


def build_instruct(items: list[str]) -> str:
    """Join instruct tokens the way OmniVoice expects (comma + space)."""
    return ", ".join(i for i in items if i)
