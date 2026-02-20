import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPersonalCanvas, getUserById } from "@/lib/db";
import { LifeCanvas } from "@/components/LifeCanvas";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, canvas] = await Promise.all([
    getUserById(session.userId),
    getPersonalCanvas(session.userId),
  ]);

  if (!canvas) redirect("/login");

  return <LifeCanvas canvasId={canvas.id} userName={user?.name ?? "You"} />;
}
