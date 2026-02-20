import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    client = createClient({ url: "file:./data/brainflux.db" });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS canvases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'My Canvas',
        owner_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'personal' CHECK(type IN ('personal', 'shared')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS canvas_members (
        canvas_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'member')),
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (canvas_id, user_id),
        FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS canvas_nodes (
        id TEXT PRIMARY KEY,
        canvas_id TEXT NOT NULL,
        type TEXT NOT NULL,
        position_x REAL NOT NULL DEFAULT 0,
        position_y REAL NOT NULL DEFAULT 0,
        width REAL,
        height REAL,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS canvas_edges (
        id TEXT PRIMARY KEY,
        canvas_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        source_handle TEXT,
        target_handle TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
      )`,
      args: [],
    },
  ]);
  // Migrate existing DBs — add handle columns if missing (ALTER TABLE ignores IF NOT EXISTS, so catch)
  try { await db.execute({ sql: "ALTER TABLE canvas_edges ADD COLUMN source_handle TEXT", args: [] }); } catch { /* already exists */ }
  try { await db.execute({ sql: "ALTER TABLE canvas_edges ADD COLUMN target_handle TEXT", args: [] }); } catch { /* already exists */ }
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

export async function createUser(data: { id: string; email: string; name: string; password_hash: string }): Promise<User> {
  const db = getDb();
  await initDb();
  await db.execute({
    sql: "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
    args: [data.id, data.email, data.name, data.password_hash],
  });
  // Auto-create personal canvas
  const canvasId = `canvas_${data.id}`;
  await db.execute({
    sql: "INSERT INTO canvases (id, name, owner_id, type) VALUES (?, ?, ?, 'personal')",
    args: [canvasId, "My Canvas", data.id],
  });
  await db.execute({
    sql: "INSERT INTO canvas_members (canvas_id, user_id, role) VALUES (?, ?, 'owner')",
    args: [canvasId, data.id],
  });
  const row = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [data.id] });
  return row.rows[0] as unknown as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  await initDb();
  const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  return result.rows[0] as unknown as User ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  await initDb();
  const result = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
  return result.rows[0] as unknown as User ?? null;
}

// ─── CANVASES ─────────────────────────────────────────────────────────────────

export type Canvas = {
  id: string;
  name: string;
  owner_id: string;
  type: "personal" | "shared";
  created_at: string;
};

export async function getPersonalCanvas(userId: string): Promise<Canvas | null> {
  const db = getDb();
  await initDb();
  const result = await db.execute({
    sql: "SELECT * FROM canvases WHERE owner_id = ? AND type = 'personal' LIMIT 1",
    args: [userId],
  });
  return result.rows[0] as unknown as Canvas ?? null;
}

export async function getUserCanvases(userId: string): Promise<Canvas[]> {
  const db = getDb();
  await initDb();
  const result = await db.execute({
    sql: `SELECT c.* FROM canvases c
          JOIN canvas_members cm ON cm.canvas_id = c.id
          WHERE cm.user_id = ?
          ORDER BY c.created_at ASC`,
    args: [userId],
  });
  return result.rows as unknown as Canvas[];
}

export async function canAccessCanvas(userId: string, canvasId: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM canvas_members WHERE canvas_id = ? AND user_id = ? LIMIT 1",
    args: [canvasId, userId],
  });
  return result.rows.length > 0;
}

export async function createSharedCanvas(data: { id: string; name: string; owner_id: string }): Promise<Canvas> {
  const db = getDb();
  await initDb();
  await db.execute({
    sql: "INSERT INTO canvases (id, name, owner_id, type) VALUES (?, ?, ?, 'shared')",
    args: [data.id, data.name, data.owner_id],
  });
  await db.execute({
    sql: "INSERT INTO canvas_members (canvas_id, user_id, role) VALUES (?, ?, 'owner')",
    args: [data.id, data.owner_id],
  });
  const row = await db.execute({ sql: "SELECT * FROM canvases WHERE id = ?", args: [data.id] });
  return row.rows[0] as unknown as Canvas;
}

export async function addCanvasMember(canvasId: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO canvas_members (canvas_id, user_id, role) VALUES (?, ?, 'member')",
    args: [canvasId, userId],
  });
}

// ─── CANVAS NODES/EDGES ───────────────────────────────────────────────────────

export type DbNode = {
  id: string; canvas_id: string; type: string;
  position_x: number; position_y: number;
  width: number | null; height: number | null;
  data: string; created_at: string; updated_at: string;
};

export type DbEdge = {
  id: string; canvas_id: string; source_id: string; target_id: string;
  source_handle: string | null; target_handle: string | null;
  created_at: string;
};

export async function getCanvasData(canvasId: string) {
  const db = getDb();
  await initDb();
  const [nodesResult, edgesResult] = await Promise.all([
    db.execute({ sql: "SELECT * FROM canvas_nodes WHERE canvas_id = ? ORDER BY created_at ASC", args: [canvasId] }),
    db.execute({ sql: "SELECT * FROM canvas_edges WHERE canvas_id = ? ORDER BY created_at ASC", args: [canvasId] }),
  ]);
  return {
    nodes: nodesResult.rows as unknown as DbNode[],
    edges: edgesResult.rows as unknown as DbEdge[],
  };
}

export async function saveCanvasData(
  canvasId: string,
  nodes: { id: string; type: string; position_x: number; position_y: number; width?: number | null; height?: number | null; data?: Record<string, unknown> }[],
  edges: { id: string; source_id: string; target_id: string; source_handle?: string | null; target_handle?: string | null }[]
) {
  const db = getDb();
  await initDb();
  await db.batch([
    { sql: "DELETE FROM canvas_edges WHERE canvas_id = ?", args: [canvasId] },
    { sql: "DELETE FROM canvas_nodes WHERE canvas_id = ?", args: [canvasId] },
  ]);
  for (const n of nodes) {
    await db.execute({
      sql: `INSERT INTO canvas_nodes (id, canvas_id, type, position_x, position_y, width, height, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [n.id, canvasId, n.type, n.position_x, n.position_y, n.width ?? null, n.height ?? null, JSON.stringify(n.data ?? {})],
    });
  }
  for (const e of edges) {
    await db.execute({
      sql: "INSERT INTO canvas_edges (id, canvas_id, source_id, target_id, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?)",
      args: [e.id, canvasId, e.source_id, e.target_id, e.source_handle ?? null, e.target_handle ?? null],
    });
  }
}
