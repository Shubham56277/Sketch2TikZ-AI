from unittest.mock import Mock, patch

import pytest

from app.agents import watsonx_client


def test_text_generation_uses_chat_messages_and_extracts_content():
    model = Mock()
    model.chat.return_value = {
        "choices": [{"message": {"content": "<TIKZ>ok</TIKZ>"}}]
    }

    with patch.object(watsonx_client, "_get_text_model", return_value=model):
        result = watsonx_client._generate_text_sync("system rules", "draw a flowchart")

    assert result == "<TIKZ>ok</TIKZ>"
    model.chat.assert_called_once_with(
        messages=[
            {"role": "system", "content": "system rules"},
            {"role": "user", "content": "draw a flowchart"},
        ],
        params={"temperature": 0, "max_tokens": 3000},
    )


def test_text_generation_rejects_invalid_chat_response():
    model = Mock()
    model.chat.return_value = {"choices": []}
    with patch.object(watsonx_client, "_get_text_model", return_value=model):
        with pytest.raises(RuntimeError, match="invalid text response"):
            watsonx_client._generate_text_sync("system", "user")
