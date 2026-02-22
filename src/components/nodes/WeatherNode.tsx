"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type WeatherData = {
  city?: string;
  lat?: number;
  lon?: number;
};

type WeatherInfo = {
  tempF: string;
  feelsLikeF: string;
  desc: string;
  icon: string;
  humidity: string;
};

type GeoResult = {
  id: number;
  name: string;
  admin1?: string;    // state/province
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
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

function formatGeoLabel(r: GeoResult): string {
  const parts = [r.name];
  if (r.admin1) parts.push(r.admin1);
  if (r.country_code && r.country_code !== "US") parts.push(r.country ?? r.country_code);
  else if (r.country_code === "US") {
    // Already have state from admin1, add "US" only if no admin1
    if (!r.admin1) parts.push("US");
  }
  return parts.join(", ");
}

async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const resp = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`
  );
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.results ?? [];
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const resp = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
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
  const [lat, setLat] = useState(nodeData.lat ?? null as number | null);
  const [lon, setLon] = useState(nodeData.lon ?? null as number | null);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCityProp = useRef(nodeData.city ?? "");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const load = useCallback(async (la: number, lo: number) => {
    setLoading(true);
    setError(null);
    try {
      const wx = await fetchWeather(la, lo);
      setWeather(wx);
    } catch {
      setError("Could not load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCity = useCallback((result: GeoResult) => {
    const label = formatGeoLabel(result);
    setCity(label);
    setLat(result.latitude);
    setLon(result.longitude);
    nodeData.city = label;
    nodeData.lat = result.latitude;
    nodeData.lon = result.longitude;
    setInput("");
    setResults([]);
    setDropdownOpen(false);
    load(result.latitude, result.longitude);
  }, [nodeData, load]);

  const clear = useCallback(() => {
    setCity("");
    setLat(null);
    setLon(null);
    setInput("");
    setWeather(null);
    setError(null);
    setResults([]);
    setDropdownOpen(false);
    nodeData.city = "";
    nodeData.lat = undefined;
    nodeData.lon = undefined;
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, [nodeData]);

  // Debounced city search
  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    setDropdownOpen(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchCities(val);
      setResults(r);
      setSearching(false);
      setDropdownOpen(r.length > 0);
    }, 350);
  }, []);

  // Auto-load on mount if city + coords set
  useEffect(() => {
    if (city && lat !== null && lon !== null) load(lat, lon);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 10 min
  useEffect(() => {
    if (!city || lat === null || lon === null) return;
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => load(lat, lon), 10 * 60 * 1000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [city, lat, lon, load]);

  // Sync external city reset (e.g., "Change City" from right-click context menu)
  useEffect(() => {
    const newProp = nodeData.city ?? "";
    const oldProp = prevCityProp.current;
    prevCityProp.current = newProp;
    if (newProp === "" && oldProp !== "") {
      setCity("");
      setLat(null);
      setLon(null);
      setInput("");
      setWeather(null);
      setError(null);
      setResults([]);
      setDropdownOpen(false);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    }
  }, [nodeData.city]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <NodeResizer
        minWidth={220}
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
          minWidth: 220,
          minHeight: 160,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "7px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>🌤</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {city || "Weather"}
          </span>
          {city && (
            <button
              onClick={clear}
              style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12, padding: "0 2px", flexShrink: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 14px", gap: 10, position: "relative" }}>
          {/* City search input */}
          {!city && (
            <div style={{ position: "relative" }}>
              <input
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setDropdownOpen(false); setInput(""); } }}
                placeholder="Search city..."
                style={{
                  width: "100%",
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: dropdownOpen && results.length > 0 ? "6px 6px 0 0" : 6,
                  outline: "none",
                  padding: "5px 8px",
                  fontSize: 13,
                  color: "#e4e4e7",
                  boxSizing: "border-box",
                }}
              />
              {/* Dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  zIndex: 999,
                  maxHeight: 180,
                  overflowY: "auto",
                }}>
                  {searching && (
                    <div style={{ padding: "6px 10px", color: "#71717a", fontSize: 12 }}>Searching...</div>
                  )}
                  {!searching && results.length === 0 && input.trim() && (
                    <div style={{ padding: "6px 10px", color: "#71717a", fontSize: 12 }}>No results</div>
                  )}
                  {!searching && results.map((r) => (
                    <div
                      key={r.id}
                      onMouseDown={() => selectCity(r)}
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        color: "#e4e4e7",
                        cursor: "pointer",
                        borderBottom: "1px solid #3f3f4633",
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#3f3f46"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
                    >
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      {r.admin1 && <span style={{ color: "#a1a1aa" }}>, {r.admin1}</span>}
                      {r.country && r.country_code !== "US" && <span style={{ color: "#71717a" }}>, {r.country}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", color: "#71717a", fontSize: 13 }}>Loading...</div>
          )}

          {error && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{error}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                {lat !== null && lon !== null && (
                  <button
                    onClick={() => load(lat, lon)}
                    style={{ background: "#27272a", border: "1px solid #3f3f46", borderRadius: 6, color: "#e4e4e7", cursor: "pointer", fontSize: 12, padding: "4px 10px" }}
                  >
                    ↻ Retry
                  </button>
                )}
                <button
                  onClick={clear}
                  style={{ background: "none", border: "1px solid #3f3f46", borderRadius: 6, color: "#71717a", cursor: "pointer", fontSize: 12, padding: "4px 10px" }}
                >
                  Change city
                </button>
              </div>
            </div>
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
