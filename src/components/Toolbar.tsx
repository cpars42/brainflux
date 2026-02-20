"use client";

type Props = {
  onAdd: (type: string) => void;
};

const TOOLS = [
  { type: "note", icon: "📝", label: "Note" },
  { type: "sticky", icon: "🟡", label: "Sticky" },
  { type: "clock", icon: "🕐", label: "Clock" },
  { type: "timer", icon: "⏱", label: "Timer" },
  { type: "hourglass", icon: "⌛", label: "Hourglass" },
];

export function Toolbar({ onAdd }: Props) {
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
          style={{
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
          }}
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
    </div>
  );
}
