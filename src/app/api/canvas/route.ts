import { NextRequest } from "next/server";
import { getCanvas, saveCanvas } from "@/lib/db";

export async function GET() {
  const { nodes, edges } = await getCanvas();
  return Response.json({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: n.position_x, y: n.position_y },
      width: n.width,
      height: n.height,
      data: JSON.parse(n.data),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      type: "default",
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nodes = [], edges = [] } = body;

  await saveCanvas(
    nodes.map((n: { id: string; type: string; position: { x: number; y: number }; width?: number | null; height?: number | null; data?: object }) => ({
      id: n.id,
      type: n.type,
      position_x: n.position?.x ?? 0,
      position_y: n.position?.y ?? 0,
      width: n.width ?? null,
      height: n.height ?? null,
      data: n.data ?? {},
    })),
    edges.map((e: { id: string; source: string; target: string }) => ({
      id: e.id,
      source_id: e.source,
      target_id: e.target,
    }))
  );

  return Response.json({ ok: true });
}
