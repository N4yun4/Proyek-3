import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSensor } from "../context/SensorContext";
import { sendChatMessage } from "../api/chat";
import type { ChatMessage } from "../api/chat";

const QUICK_PROMPTS = [
  "Kondisi ruangan sekarang?",
  "Apakah suhu normal untuk Samarinda?",
  "Rekomendasikan pengaturan AC",
  "Ada potensi masalah hari ini?",
];

export function ChatPage() {
  const { sensorData } = useSensor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 5 + 20;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [input]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage({
        messages: nextMessages,
        sensorContext: sensorData
          ? { suhu: sensorData.suhu, kelembapan: sensorData.kelembapan, orang_hari_ini: sensorData.orang_hari_ini }
          : undefined,
      });
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Chat gagal");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-7">
      <div
        className="sh-card"
        style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 172px)" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <div>
              <p className="sh-label mb-0.5" style={{ fontSize: "0.6rem" }}>Asisten Ruangan</p>
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                AI Chat
              </h2>
            </div>
            <button
              onClick={() => { setMessages([]); setError(null); setInput(""); }}
              className="sh-btn sh-btn-ghost"
              style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
            >
              Percakapan Baru
            </button>
          </div>

          {/* Sensor bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-body)",
              color: "var(--text-2)",
            }}
          >
            {sensorData ? (
              <>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--green, #22c55e)",
                      display: "inline-block",
                      boxShadow: "0 0 0 2px color-mix(in srgb, var(--green, #22c55e) 25%, transparent)",
                    }}
                  />
                  Live
                </span>
                <span>Suhu: <strong style={{ color: "var(--text)" }}>{sensorData.suhu}°C</strong></span>
                <span>Kelembapan: <strong style={{ color: "var(--text)" }}>{sensorData.kelembapan}%</strong></span>
                <span>Pengunjung: <strong style={{ color: "var(--text)" }}>{sensorData.orang_hari_ini} orang</strong></span>
              </>
            ) : (
              <span style={{ opacity: 0.5 }}>Data sensor tidak tersedia</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Welcome + quick prompts */}
          {messages.length === 0 && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    maxWidth: "75%",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.6,
                  }}
                >
                  Halo! Saya siap membantu menganalisis kondisi ruangan di Samarinda. Tanyakan apa saja, atau pilih pertanyaan cepat di bawah.
                </div>
              </div>

              {/* Quick prompt chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", paddingLeft: "0.25rem" }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void handleSend(prompt)}
                    disabled={loading}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "var(--accent)",
                      background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                      borderRadius: "999px",
                      padding: "0.35rem 0.85rem",
                      cursor: "pointer",
                      transition: "background 0.15s ease, border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 18%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)";
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bubble messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                  color: msg.role === "user" ? "#fff" : "var(--text)",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "0.75rem 1rem",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.6,
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                <span className="bounce-dot" />
                <span className="bounce-dot" />
                <span className="bounce-dot" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.78rem",
                color: "var(--red)",
                fontFamily: "var(--font-body)",
              }}
            >
              {error}{" "}
              <button
                onClick={() => void handleSend()}
                style={{
                  color: "var(--accent)",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                }}
              >
                Coba lagi
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "1rem 1.5rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ketik pesan… (Enter untuk kirim, Shift+Enter baris baru)"
            rows={1}
            style={{
              flex: 1,
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--text)",
              background: "var(--surface-2)",
              border: "1px solid var(--border-hi)",
              borderRadius: "12px",
              padding: "0.65rem 0.9rem",
              resize: "none",
              outline: "none",
              lineHeight: "24px",
              transition: "border-color 0.15s ease",
              overflow: "hidden",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-hi)"; }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            className={`sh-btn ${loading || !input.trim() ? "sh-btn-disabled" : "sh-btn-primary"}`}
            style={{ padding: "0.65rem 1.1rem", fontSize: "0.8rem", borderRadius: "12px", flexShrink: 0 }}
          >
            Kirim
          </button>
        </div>
      </div>
    </main>
  );
}
