"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  Clock,
  HeartHandshake,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";

interface ChatMessage {
  id?: number | string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function SanjeevniChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Initialize Session ID & Load History from PostgreSQL
  useEffect(() => {
    let sid = sessionStorage.getItem("sanjeevni_chat_session");
    if (!sid) {
      sid = `sess_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      sessionStorage.setItem("sanjeevni_chat_session", sid);
    }
    setSessionId(sid);

    async function loadHistory() {
      setFetchingHistory(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/assistant/history?session_id=${sid}`, {
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // Initial Welcome Message
            setMessages([
              {
                id: "init",
                role: "assistant",
                content:
                  "Hello! I am **Sanjeevni AI Health Assistant**.\n\nI can help you explore specialist doctors, consultation hours, book appointments, check emergency services, or understand digital prescriptions and lab reports.\n\nHow can I help you today?",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      } finally {
        setFetchingHistory(false);
      }
    }

    loadHistory();
  }, [API_URL]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    setInput("");
    const optimisticUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/assistant/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: messageContent,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: data.message_id || `bot_${Date.now()}`,
        role: "assistant",
        content: data.reply || "I am currently unable to process your request. Please try again shortly.",
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "⚠️ Unable to connect to the Sanjeevni clinical assistant server. Please check your connection or contact our front desk at **+91 9999-108-108**.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your conversation history?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_URL}/assistant/history?session_id=${sessionId}`, {
        method: "DELETE",
        headers,
      });

      setMessages([
        {
          id: "fresh_start",
          role: "assistant",
          content: "Conversation history cleared. How may I assist you now?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const quickPrompts = [
    "❤️ Recommend a Cardiologist",
    "⏰ What are Sanjeevni OPD hours?",
    "💊 How do I access my prescription?",
    "🔬 Pathology lab blood tests",
    "🛏️ Check hospital bed & ICU census",
    "🚨 Emergency trauma ambulance hotline",
  ];

  return (
    <main className="min-h-screen bg-white text-[#4B5563] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-black shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-[#1E3A8A]">Sanjeevni AI Health Assistant</h1>
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
                <span className="text-[10px] font-mono text-[#0D9488] uppercase font-bold hidden sm:inline">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                Clinical Guidance &amp; Doctor Routing · High-Throughput Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#4B5563] transition text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            <Link
              href="/doctors"
              className="px-3.5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Doctor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Emergency Notice Strip */}
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-[11px] text-red-800">
        <span className="font-bold">Medical Disclaimer:</span> For sudden chest pain, severe trauma, or acute breathing difficulty, call the 24x7 Ambulance hotline{" "}
        <a href="tel:+919999108108" className="font-bold underline text-red-900">
          +91 9999-108-108
        </a>{" "}
        or visit Emergency Trauma Bay immediately.
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="space-y-4 pb-6 flex-1">
          {fetchingHistory ? (
            <div className="py-20 text-center text-xs text-gray-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0D9488]" />
              <p>Loading your clinical conversation history from secure database...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1E3A8A] text-white rounded-br-none shadow-sm"
                      : "bg-slate-50 border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                  {msg.timestamp && (
                    <div
                      className={`text-[10px] mt-2 font-mono ${
                        msg.role === "user" ? "text-blue-200 text-right" : "text-gray-400 text-left"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-gray-200 text-[#4B5563] rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.4s]" />
                <span>Evaluating clinical guidelines...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Chips Container */}
        <div className="pt-2 sticky bottom-2 bg-white/95 backdrop-blur-md space-y-3">
          {/* Quick Prompts Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {quickPrompts.map((prompt, pidx) => (
              <button
                key={pidx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#1E3A8A] border border-gray-300 font-medium transition shrink-0 shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white border border-gray-300 focus-within:border-[#0D9488] focus-within:ring-2 focus-within:ring-[#0D9488]/20 rounded-2xl p-2 shadow-sm transition"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, doctors, OPD timings, or clinic services..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold transition disabled:opacity-40 shrink-0 cursor-pointer shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-400">
            Conversations are securely persisted in Sanjeevni Hospital EHR.
          </p>
        </div>
      </div>
    </main>
  );
}
