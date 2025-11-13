import { NextResponse } from "next/server"
import demoData from "@/lib/demo-data.json"

export async function GET() {
  try {
    console.log("[v0] API: Loading demo data from local file...")

    console.log("[v0] API: Demo data loaded successfully from local file")
    return NextResponse.json(demoData)
  } catch (error) {
    console.error("[v0] API: Error loading demo data:", error)
    return NextResponse.json(
      { error: "Failed to load demo data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
