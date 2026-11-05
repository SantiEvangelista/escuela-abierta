import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return Response.json({ status: "ok", database: "available" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ status: "unavailable", database: "unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
