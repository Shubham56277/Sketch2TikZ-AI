"""
IBM watsonx.ai integration.

This module is the ONLY place ibm_watsonx_ai is imported. Services call the
functions below and never touch the SDK directly.

The watsonx.ai SDK's ModelInference.generate_text is a blocking (synchronous)
call. To avoid stalling FastAPI's asyncio event loop, every call is offloaded
to a worker thread via `anyio.to_thread.run_sync` (FastAPI's own dependency,
so no extra package is needed).
"""

import base64
import logging
from typing import Optional

import anyio
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

from app.config import get_settings

logger = logging.getLogger("sketch2tikz.watsonx")

_text_model: Optional[ModelInference] = None
_vision_model: Optional[ModelInference] = None

_GENERATE_PARAMS = {
    "decoding_method": "greedy",
    "max_new_tokens": 1500,
    "min_new_tokens": 0,
    "repetition_penalty": 1.05,
}


def is_configured() -> bool:
    return get_settings().is_watsonx_configured


def _get_credentials() -> Credentials:
    settings = get_settings()
    return Credentials(url=settings.watsonx_url, api_key=settings.watsonx_api_key)


def _get_text_model() -> ModelInference:
    global _text_model
    if _text_model is None:
        settings = get_settings()
        _text_model = ModelInference(
            model_id=settings.watsonx_text_model_id,
            credentials=_get_credentials(),
            project_id=settings.watsonx_project_id,
        )
    return _text_model


def _get_vision_model() -> ModelInference:
    global _vision_model
    if _vision_model is None:
        settings = get_settings()
        _vision_model = ModelInference(
            model_id=settings.watsonx_vision_model_id,
            credentials=_get_credentials(),
            project_id=settings.watsonx_project_id,
        )
    return _vision_model


def _generate_text_sync(system_prompt: str, user_prompt: str) -> str:
    model = _get_text_model()
    # Granite instruct models use a chat-style prompt; we compose it manually
    # here to keep this module's public surface framework-agnostic.
    prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"
    response = model.generate_text(prompt=prompt, params=_GENERATE_PARAMS)
    return response


def _generate_vision_sync(system_prompt: str, user_text: str, image_bytes: bytes, mime_type: str) -> str:
    model = _get_vision_model()
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"{system_prompt}\n\n{user_text}"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{b64_image}"},
                },
            ],
        }
    ]
    response = model.chat(messages=messages)
    return response["choices"][0]["message"]["content"]


async def generate_text(system_prompt: str, user_prompt: str) -> str:
    """Runs a text-only Granite completion off the event loop thread."""
    if not is_configured():
        raise RuntimeError("watsonx.ai is not configured (missing WATSONX_API_KEY/WATSONX_PROJECT_ID)")
    logger.info("Calling watsonx text model")
    return await anyio.to_thread.run_sync(_generate_text_sync, system_prompt, user_prompt)


async def generate_from_image(system_prompt: str, user_text: str, image_bytes: bytes, mime_type: str) -> str:
    """Runs a vision-capable Granite completion off the event loop thread."""
    if not is_configured():
        raise RuntimeError("watsonx.ai is not configured (missing WATSONX_API_KEY/WATSONX_PROJECT_ID)")
    logger.info("Calling watsonx vision model")
    return await anyio.to_thread.run_sync(
        _generate_vision_sync, system_prompt, user_text, image_bytes, mime_type
    )
