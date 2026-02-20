import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    client = createClient({ url: "file:./data/life-os.db" });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS canvas_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        position_x REAL NOT NULL DEFAULT 0,
        position_y REAL NOT NULL DEFAULT 0,
        width REAL,
        height REAL,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS canvas_edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
  ]);
}

export type DbNode = {
  id: string;
  type: string;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
  data: string;
  created_at: string;
  updated_at: string;
};

export type DbEdge = {
  id: string;
  source_id: string;
  target_id: string;
  created_at: string;
};

export async function getCanvas() {
  const db = getDb();
  await initDb();
  const [nodesResult, edgesResult] = await Promise.all([
    db.execute({ sql: "SELECT * FROM canvas_nodes ORDER BY created_at ASC", args: [] }),
    db.execute({ sql: "SELECT * FROM canvas_edges ORDER BY created_at ASC", args: [] }),
  ]);
  return {
    nodes: nodesResult.rows as unknown as DbNode[],
    edges: edgesResult.rows as unknown as DbEdge[],
  };
}

export async function upsertNode(node: {
  id: string;
  type: string;
  position_x: number;
  position_y: number;
  width?: number | null;
  height?: number | null;
  data?: object;
}) {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO canvas_nodes (id, type, position_x, position_y, width, height, data, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            position_x = excluded.position_x,
            position_y = excluded.position_y,
            width = excluded.width,
            height = excluded.height,
            data = excluded.data,
            updated_at = datetime('now')`,
    args: [
      node.id,
      node.type,
      node.position_x,
      node.position_y,
      node.width ?? null,
      node.height ?? null,
      JSON.stringify(node.data ?? {}),
    ],
  });
}

export async function deleteNode(id: string) {
  const db = getDb();
  await db.batch([
    { sql: "DELETE FROM canvas_nodes WHERE id = ?", args: [id] },
    { sql: "DELETE FROM canvas_edges WHERE source_id = ? OR target_id = ?", args: [id, id] },
  ]);
}

export async function upsertEdge(edge: { id: string; source_id: string; target_id: string }) {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO canvas_edges (id, source_id, target_id) VALUES (?, ?, ?)`,
    args: [edge.id, edge.source_id, edge.target_id],
  });
}

export async function deleteEdge(id: string) {
  const db = getDb();
  await db.execute({ sql: "DELETE FROM canvas_edges WHERE id = ?", args: [id] });
}

export async function saveCanvas(nodes: {
  id: string; type: string; position_x: number; position_y: number;
  width?: number | null; height?: number | null; data?: object;
}[], edges: { id: string; source_id: string; target_id: string }[]) {
  const db = getDb();
  await initDb();

  // Replace all
  await db.batch([
    { sql: "DELETE FROM canvas_edges", args: [] },
    { sql: "DELETE FROM canvas_nodes", args: [] },
  ]);

  if (nodes.length > 0) {
    for (const n of nodes) {
      await upsertNode(n);
    }
  }
  if (edges.length > 0) {
    for (const e of edges) {
      await upsertEdge(e);
    }
  }
}
