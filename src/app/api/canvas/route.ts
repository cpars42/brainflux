import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getPersonalCanvas, getCanvasData, saveCanvasData, canAccessCanvas } from "@/lib/db";

async function resolveCanvas(req: NextRequest, canvasId?: string) {
  const session = await getSessionFromRequest(req);
  if (!session) return { error: "Unauthorized", status: 401 };

  let cid: string | undefined = canvasId;
  if (!cid) {
    const personal = await getPersonalCanvas(session.userId);
    cid = personal?.id ?? undefined;
  }
  if (!cid) return { error: "No canvas found", status: 404 };

  const hasAccess = await canAccessCanvas(session.userId, cid);
  if (!hasAccess) return { error: "Forbidden", status: 403 };

  return { canvasId: cid, userId: session.userId };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const canvasId = url.searchParams.get("canvas") ?? undefined;

  const result = await resolveCanvas(req, canvasId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { nodes, edges, viewport } = await getCanvasData(result.canvasId);
  return NextResponse.json({
    canvasId: result.canvasId,
    viewport: viewport ?? null,
    nodes: nodes.map((n) => ({
      id: n.id, type: n.type,
      position: { x: n.position_x, y: n.position_y },
      width: n.width, height: n.height,
      data: JSON.parse(n.data),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      sourceHandle: e.source_handle ?? null,
      targetHandle: e.target_handle ?? null,
      type: "default",
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nodes = [], edges = [], viewport = null, canvasId: bodyCanvasId } = body;

  const result = await resolveCanvas(req, bodyCanvasId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await saveCanvasData(
    result.canvasId,
    nodes.map((n: { id: string; type: string; position: { x: number; y: number }; width?: number | null; height?: number | null; data?: Record<string, unknown> }) => ({
      id: n.id, type: n.type,
      position_x: n.position?.x ?? 0,
      position_y: n.position?.y ?? 0,
      width: n.width ?? null,
      height: n.height ?? null,
      data: n.data ?? {},
    })),
    edges.map((e: { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => ({
      id: e.id,
      source_id: e.source,
      target_id: e.target,
      source_handle: e.sourceHandle ?? null,
      target_handle: e.targetHandle ?? null,
    })),
    viewport
  );

  return NextResponse.json({ ok: true });
}
