"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export type BackgroundSetting = "stars" | "matrix" | "none";

type Props = {
  onAdd: (type: string) => void;
  onVoiceNote: (transcript: string) => void;
  background: BackgroundSetting;
  onBackgroundChange: (bg: BackgroundSetting) => void;
};

const TOOLS = [
  { type: "note", icon: "📝", label: "Note" },
  { type: "sticky", icon: "🟡", label: "Sticky" },
  { type: "clock", icon: "🕐", label: "Clock" },
  { type: "timer", icon: "⏱", label: "Timer" },
  { type: "stopwatch", icon: "⏱️", label: "Stopwatch" },
  { type: "hourglass", icon: "⌛", label: "Hourglass" },
  { type: "image", icon: "🖼️", label: "Image" },
  { type: "checklist", icon: "✅", label: "Checklist" },
  { type: "code", icon: "💻", label: "Code" },
  { type: "embed", icon: "🌐", label: "Embed" },
  { type: "markdown", icon: "📄", label: "Markdown" },
  { type: "drawing", icon: "✏️", label: "Drawing" },
  { type: "counter", icon: "🔢", label: "Counter" },
  { type: "weather", icon: "🌤", label: "Weather" },
  { type: "calendar", icon: "📅", label: "Calendar" },
];

export function Toolbar({ onAdd, onVoiceNote, background, onBackgroundChange }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SR);
    }
  }, []);

  // Close settings panel on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as HTMLElement) &&
      settingsBtnRef.current && !settingsBtnRef.current.contains(e.target as HTMLElement)
    ) {
      setSettingsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [settingsOpen, handleClickOutside]);

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

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: "#27272a", margin: "0 2px" }} />

      {/* Settings */}
      <div style={{ position: "relative" }}>
        <button
          ref={settingsBtnRef}
          onClick={() => setSettingsOpen((o) => !o)}
          title="Settings"
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
          <span style={{ fontSize: 20 }}>{"⚙️"}</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Settings</span>
        </button>

        {settingsOpen && (
          <div
            ref={settingsPanelRef}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 14,
              padding: "12px 14px",
              boxShadow: "0 8px 32px #00000088",
              zIndex: 20,
              minWidth: 180,
            }}
          >
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8, fontWeight: 600 }}>Background</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["stars", "matrix", "none"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => onBackgroundChange(opt)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    background: background === opt ? "#6366f1" : "#27272a",
                    color: background === opt ? "#fff" : "#a1a1aa",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {opt === "stars" ? "Stars" : opt === "matrix" ? "Matrix" : "None"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
