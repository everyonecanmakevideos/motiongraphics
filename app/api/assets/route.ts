import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const download = req.nextUrl.searchParams.get("download") === "1";
  const filename = req.nextUrl.searchParams.get("filename") ?? undefined;
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    const url = await getPresignedUrl(key, 3600, { download, filename });
    return NextResponse.redirect(url, { status: 307 });
  } catch (err) {
    console.error("[GET /api/assets]", err);
    return NextResponse.json({ error: "Failed to get asset" }, { status: 500 });
  }
}
