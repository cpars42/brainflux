"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#09090b",
    }}>
      <div style={{
        width: 360, background: "#18181b", border: "1px solid #27272a",
        borderRadius: 16, padding: "36px 32px",
      }}>
        <h1 style={{ color: "#f4f4f5", fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
          BrainFlux
        </h1>
        <p style={{ color: "#52525b", fontSize: 14, textAlign: "center", marginBottom: 28 }}>
          Sign in to your canvas
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password" required placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ color: "#52525b", fontSize: 13, textAlign: "center", marginTop: 20 }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#6366f1", textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#09090b", border: "1px solid #27272a", borderRadius: 8,
  color: "#f4f4f5", fontSize: 14, padding: "10px 14px", outline: "none", width: "100%",
};

const btnStyle: React.CSSProperties = {
  background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
  fontSize: 14, fontWeight: 600, padding: "11px", cursor: "pointer", marginTop: 4,
};
