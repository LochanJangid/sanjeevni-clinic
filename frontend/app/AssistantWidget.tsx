"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SUGGESTIONS = [
  "How do I book a visit?",
  "How can I reschedule?",
  "Can you give me a diagnosis?",
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I’m the Sanjeevni assistant. I can help you find your way around the site or answer general questions. What can I help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, open]);

  async function sendMessage(content: string) {
    const question = content.trim();
    if (!question || sending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The assistant is temporarily unavailable.");
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The assistant sent an empty response. Please try again.");
      }
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (problem) {
      setError(
        problem instanceof TypeError
          ? "I couldn’t reach the assistant. Check your connection and try again, or contact the clinic directly."
          : problem instanceof Error && !(problem instanceof SyntaxError)
            ? problem.message
            : "The assistant couldn’t complete that request. Please try again, or contact the clinic directly.",
      );
    } finally {
      setSending(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="assistant-widget">
      {open && (
        <section className="assistant-panel" aria-label="Sanjeevni website assistant">
          <div className="assistant-panel-header">
            <span className="assistant-brand-mark" aria-hidden="true">+</span>
            <span className="assistant-heading">
              <strong>Sanjeevni Assistant</strong>
              <small>Clinical AI triage & guidance</small>
            </span>
            <Link
              href="/chat"
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline mr-2 shrink-0"
              title="Open full AI chat application"
            >
              Full App ↗
            </Link>
            <button
              type="button"
              className="assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {sending && <div className="assistant-message assistant typing-indicator" role="status">Thinking…</div>}
            {error && (
              <div className="assistant-error" role="alert">
                {error}
                <button type="button" onClick={() => void sendMessage(messages[messages.length - 1]?.content || "")}>
                  Try again
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !sending && (
            <div className="assistant-suggestions" aria-label="Suggested questions">
              {SUGGESTIONS.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form className="assistant-compose" onSubmit={submitMessage}>
            <label className="sr-only" htmlFor="assistant-question">Ask a question</label>
            <textarea
              id="assistant-question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question…"
              maxLength={1200}
              rows={2}
              disabled={sending}
            />
            <button type="submit" aria-label="Send message" disabled={sending || !input.trim()}>
              {sending ? "…" : "↑"}
            </button>
          </form>
          <p className="assistant-disclaimer">
            Don’t share private medical details. This assistant cannot diagnose or replace a clinician. For an emergency, contact local emergency services.
          </p>
        </section>
      )}

      <button
        type="button"
        className={open ? "assistant-launcher open" : "assistant-launcher"}
        aria-expanded={open}
        aria-label={open ? "Close Sanjeevni assistant" : "Ask the Sanjeevni assistant"}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{open ? "×" : "✳"}</span>
        <span>{open ? "Close" : "Ask us"}</span>
      </button>
    </div>
  );
}
