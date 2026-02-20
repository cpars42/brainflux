"use client";

import { useEffect, useState, useRef } from "react";

type Props = {
  onAdd: (type: string) => void;
  onVoiceNote: (transcript: string) => void;
};

const TOOLS = [
  { type: "note", icon: "📝", label: "Note" },
  { type: "sticky", icon: "🟡", label: "Sticky" },
  { type: "clock", icon: "🕐", label: "Clock" },
  { type: "timer", icon: "⏱", label: "Timer" },
  { type: "hourglass", icon: "⌛", label: "Hourglass" },
];

export function Toolbar({ onAdd, onVoiceNote }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SR);
    }
  }, []);

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onVoiceNote(transcript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    setIsListening(true);
    recognition.start();
  };

  const btnBase: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "none",
    border: "1px solid transparent",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    color: "#a1a1aa",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "0 8px 32px #00000088",
        zIndex: 10,
      }}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onAdd(tool.type)}
          title={tool.label}
          style={btnBase}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#27272a";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#3f3f46";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }}
        >
          <span style={{ fontSize: 20 }}>{tool.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>{tool.label}</span>
        </button>
      ))}

      {speechSupported && (
        <>
          {/* Divider */}
          <div style={{ width: 1, height: 32, background: "#27272a", margin: "0 2px" }} />

          <button
            onClick={handleMic}
            title={isListening ? "Stop recording" : "Voice note"}
            style={{
              ...btnBase,
              color: isListening ? "#f87171" : "#a1a1aa",
              border: isListening ? "1px solid #f8717144" : "1px solid transparent",
              background: isListening ? "#2d151522" : "none",
              animation: isListening ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isListening) {
                (e.currentTarget as HTMLButtonElement).style.background = "#27272a";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#3f3f46";
              }
            }}
            onMouseLeave={(e) => {
              if (!isListening) {
                (e.currentTarget as HTMLButtonElement).style.background = "none";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 20 }}>{isListening ? "🔴" : "🎙️"}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{isListening ? "Stop" : "Voice"}</span>
          </button>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
