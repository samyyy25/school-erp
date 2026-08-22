"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

// ─── Quick-action chips by role ────────────────────────────────────────────
const QUICK_ACTIONS = {
  student: [
    "What are my recent marks?",
    "How is my attendance?",
    "Do I have any pending fees?",
    "When is my next exam?",
  ],
  staff: [
    "What subjects do I teach?",
    "Show my timetable",
    "How is my attendance?",
    "What classes do I have today?",
  ],
  admin: [
    "How many students are enrolled?",
    "Show pending fees overview",
    "What are the latest notices?",
    "How many staff members are there?",
  ],
};

// ─── Simple markdown renderer (bold, bullet points) ──────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul style='margin: 6px 0 6px 16px; padding: 0; list-style: disc;'>$1</ul>")
    .replace(/\n/g, "<br/>");
}

// ─── Single message bubble ─────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        animation: "fadeSlideIn 0.25s ease",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            flexShrink: 0,
            fontSize: 14,
          }}
        >
          ✨
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, #667eea, #764ba2)"
            : "rgba(255,255,255,0.08)",
          color: isUser ? "#fff" : "rgba(255,255,255,0.92)",
          fontSize: 13.5,
          lineHeight: 1.55,
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
      />
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        ✨
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderRadius: "18px 18px 18px 4px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
              animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Chat Widget ──────────────────────────────────────────────────────
export default function AIChatWidget() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = session?.user?.role?.toLowerCase() || "student";
  const userName = session?.user?.name?.split(" ")[0] || "there";
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.student;

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && !historyLoaded && status === "authenticated") {
      fetch("/api/ai-chat/history")
        .then((r) => r.json())
        .then(({ messages: rows }) => {
          if (rows?.length) {
            setMessages(rows.map((r) => ({ role: r.role, content: r.content })));
          }
          setHistoryLoaded(true);
        })
        .catch(() => setHistoryLoaded(true));
    }
  }, [isOpen, historyLoaded, status]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Don"t render if not authenticated
  if (status !== "authenticated") return null;

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msgText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, something went wrong.";
      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    setClearing(true);
    try {
      await fetch("/api/ai-chat/history", { method: "DELETE" });
      setMessages([]);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.7; }
          70%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes widgetOpen {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        #ai-chat-input:focus { outline: none; }
        #ai-chat-input::placeholder { color: rgba(255,255,255,0.35); }
        #ai-messages::-webkit-scrollbar { width: 4px; }
        #ai-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>

      {/* ── Floating Button ── */}
      {!isOpen && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
          {/* Pulse ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              animation: "pulseRing 2s ease-out infinite",
            }}
          />
          <button
            id="ai-chat-open-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant"
            title="AI School Assistant"
            style={{
              position: "relative",
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "0 8px 32px rgba(102,126,234,0.5)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(102,126,234,0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(102,126,234,0.5)";
            }}
          >
            ✨
          </button>
        </div>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          id="ai-chat-panel"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 380,
            maxWidth: "calc(100vw - 40px)",
            height: 580,
            maxHeight: "calc(100vh - 60px)",
            zIndex: 9999,
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background:
              "linear-gradient(160deg, rgba(20,10,50,0.97) 0%, rgba(12,10,40,0.98) 100%)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(102,126,234,0.3)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
            animation: "widgetOpen 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(102,126,234,0.4)",
              }}
            >
              ✨
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>
                Scholarly AI
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
                Your school assistant · {role}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  disabled={clearing}
                  title="Clear chat history"
                  aria-label="Clear chat history"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  🗑️
                </button>
              )}
              <button
                id="ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            id="ai-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 16px 8px",
            }}
          >
            {/* Welcome message when no history */}
            {messages.length === 0 && historyLoaded && (
              <div style={{ textAlign: "center", padding: "20px 8px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>
                  Hi {userName}!
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>
                  I can answer questions about your school data, marks, attendance, and more.
                </p>

                {/* Quick action chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      style={{
                        padding: "7px 13px",
                        borderRadius: 20,
                        background: "rgba(102,126,234,0.18)",
                        border: "1px solid rgba(102,126,234,0.35)",
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        lineHeight: 1.4,
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(102,126,234,0.35)";
                        e.currentTarget.style.borderColor = "rgba(102,126,234,0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(102,126,234,0.18)";
                        e.currentTarget.style.borderColor = "rgba(102,126,234,0.35)";
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading history indicator */}
            {!historyLoaded && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, padding: 20 }}>
                Loading history...
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Typing indicator */}
            {loading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "4px 6px 4px 16px",
                transition: "border-color 0.2s",
              }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(102,126,234,0.5)")}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              <input
                id="ai-chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  padding: "8px 0",
                }}
              />
              <button
                id="ai-chat-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background:
                    loading || !input.trim()
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, #667eea, #764ba2)",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {loading ? (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>...</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "8px 0 0" }}>
              Powered by Gemini AI · Scholarly
            </p>
          </div>
        </div>
      )}
    </>
  );
}
