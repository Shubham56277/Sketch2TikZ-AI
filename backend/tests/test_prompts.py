"""Regression checks for the visual layout contract sent to Granite."""

from app.agents.prompts import TIKZ_SYSTEM_PROMPT


def test_generation_prompt_has_strict_non_overlap_layout_contract() -> None:
    assert "empty edge-to-edge gaps" in TIKZ_SYSTEM_PROMPT
    assert "must occupy a third centered row" in TIKZ_SYSTEM_PROMPT
    assert "must never sit directly on the primary vertical connector" in TIKZ_SYSTEM_PROMPT
    assert "Do not place an End node over a result node" in TIKZ_SYSTEM_PROMPT


def test_generation_prompt_has_professional_visual_system() -> None:
    assert "consistent professional component system" in TIKZ_SYSTEM_PROMPT
    assert "editorial palette on white" in TIKZ_SYSTEM_PROMPT
    assert "0.65--1.6 width/height" in TIKZ_SYSTEM_PROMPT
