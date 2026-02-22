"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type WeatherData = {
  city?: string;
};

type WeatherInfo = {
  tempF: string;
  feelsLikeF: string;
  desc: string;
  icon: string;
  humidity: string;
};

const WX_ICONS: Record<number, string> = {
  113: "☀️", 116: "⛅", 119: "☁️", 122: "☁️", 143: "🌫️",
  176: "🌦️", 179: "🌨️", 182: "🌧️", 185: "🌧️", 200: "⛈️",
  227: "🌨️", 230: "❄️", 248: "🌫️", 260: "🌫️", 263: "🌦️",
  266: "🌧️", 281: "🌧️", 284: "🌧️", 293: "🌧️", 296: "🌧️",
  299: "🌧️", 302: "🌧️", 305: "🌧️", 308: "🌧️", 311: "🌧️",
  314: "🌧️", 317: "🌧️", 320: "🌨️", 323: "🌨️", 326: "🌨️",
  329: "❄️", 332: "❄️", 335: "❄️", 338: "❄️", 350: "🌧️",
  353: "🌦️", 356: "🌧️", 359: "🌧️", 362: "🌧️", 365: "🌧️",
  368: "🌨️", 371: "🌨️", 374: "🌧️", 377: "🌧️", 386: "⛈️",
  389: "⛈️", 392: "⛈️", 395: "⛈️",
};

async function fetchWeather(city: string): Promise<WeatherInfo> {
  const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
  if (!resp.ok) throw new Error("fetch failed");
  const json = await resp.json();
  const cur = json.current_condition[0];
  const code = parseInt(cur.weatherCode);
  return {
    tempF: cur.temp_F,
    feelsLikeF: cur.FeelsLikeF,
    desc: cur.weatherDesc[0].value,
    icon: WX_ICONS[code] ?? "🌡️",
    humidity: cur.humidity,
  };
}

export function WeatherNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WeatherData;
  const [city, setCity] = useState(nodeData.city ?? "");
  const [input, setInput] = useState(nodeData.city ?? "");
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const load = useCallback(async (c: string) => {
    if (!c.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const wx = await fetchWeather(c.trim());
      setWeather(wx);
    } catch {
      setError("Could not load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  const go = useCallback(() => {
    const c = input.trim();
    setCity(c);
    nodeData.city = c;
    load(c);
  }, [input, nodeData, load]);

  const clear = useCallback(() => {
    setCity("");
    setInput("");
    setWeather(null);
    setError(null);
    nodeData.city = "";
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, [nodeData]);

  // Auto-load on mount if city set
  useEffect(() => {
    if (city) load(city);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 10 min
  useEffect(() => {
    if (!city) return;
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => load(city), 10 * 60 * 1000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [city, load]);

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={160}
        isVisible={selected}
        lineStyle={{ borderColor: "#6366f1" }}
        handleStyle={{ backgroundColor: "#6366f1", border: "none" }}
      />
      <Handle id="top" type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left" type="source" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />

      <div
        className="h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "#18181b",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 200,
          minHeight: 160,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "7px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>🌤</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", flex: 1 }}>Weather</span>
          {city && (
            <button
              onClick={clear}
              style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12, padding: "0 2px" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 14px", gap: 10 }}>
          {/* City input always visible */}
          {!city && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") go(); }}
                placeholder="City name..."
                style={{
                  flex: 1,
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 6,
                  outline: "none",
                  padding: "4px 8px",
                  fontSize: 13,
                  color: "#e4e4e7",
                }}
              />
              <button
                onClick={go}
                style={{
                  background: "#6366f1",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "4px 10px",
                }}
              >
                Go
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", color: "#71717a", fontSize: 13 }}>Loading...</div>
          )}

          {error && (
            <div style={{ textAlign: "center", color: "#f87171", fontSize: 12 }}>{error}</div>
          )}

          {weather && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, lineHeight: 1 }}>{weather.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#e4e4e7", marginTop: 4 }}>{weather.tempF}°F</div>
                <div style={{ fontSize: 11, color: "#71717a" }}>Feels like {weather.feelsLikeF}°F</div>
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#a1a1aa" }}>{weather.desc}</div>
              <div style={{ textAlign: "center", fontSize: 11, color: "#52525b" }}>
                {city} · Humidity {weather.humidity}%
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
