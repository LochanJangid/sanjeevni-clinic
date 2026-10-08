import asyncio
import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from starlette.requests import Request

from routers import assistant


def make_request(client_host: str) -> Request:
    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/assistant/chat",
            "raw_path": b"/assistant/chat",
            "query_string": b"",
            "headers": [],
            "client": (client_host, 1234),
            "server": ("test", 8000),
        }
    )


class AssistantTests(unittest.TestCase):
    def test_chat_requires_a_final_user_message(self):
        with self.assertRaises(ValueError):
            assistant.ChatRequest(
                messages=[assistant.ChatMessage(role="assistant", content="Hello")]
            )

    def test_chat_rejects_blank_or_oversized_messages(self):
        with self.assertRaises(ValueError):
            assistant.ChatMessage(role="user", content="   ")
        with self.assertRaises(ValueError):
            assistant.ChatMessage(role="user", content="x" * 1201)

    def test_missing_groq_key_returns_clear_service_unavailable(self):
        host = "missing-key-test-client"
        payload = assistant.ChatRequest(
            messages=[assistant.ChatMessage(role="user", content="How do I book?")]
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
            result = asyncio.run(assistant.chat(make_request(host), payload))

        self.assertIn("reply", result)
        self.assertIn("Find care", result["reply"])

    def test_groq_response_is_returned_without_persisting_conversation(self):
        payload = assistant.ChatRequest(
            messages=[assistant.ChatMessage(role="user", content="How do I book a visit?")]
        )
        captured = {}

        class Response:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": "Open Find care to begin."}}]}

        class Client:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *_):
                return None

            async def post(self, url, *, headers, json):
                captured.update(url=url, headers=headers, body=json)
                return Response()

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            with patch.object(assistant.httpx, "AsyncClient", return_value=Client()):
                result = asyncio.run(
                    assistant.chat(make_request("groq-response-test-client"), payload)
                )

        self.assertEqual(result, {"reply": "Open Find care to begin."})
        self.assertEqual(captured["url"], assistant.GROQ_API_URL)
        self.assertEqual(captured["body"]["messages"][-1]["content"], "How do I book a visit?")
        self.assertTrue(captured["headers"]["Authorization"].startswith("Bearer "))

    def test_assistant_limits_requests_per_client(self):
        client = "rate-limit-test-client"
        for _ in range(assistant.RATE_LIMIT_REQUESTS):
            assistant.check_rate_limit(client)

        with self.assertRaises(HTTPException) as context:
            assistant.check_rate_limit(client)

        self.assertEqual(context.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
