import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] API: Fetching demo data from external URL...")

    const response = await fetch(
      "https://storage.googleapis.com/gl-assets-public/demodata/Jurassic_Park_-_Remake_complete_export.json",
      {
        cache: "no-store", // Don't cache the response
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API: Demo data fetched successfully")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API: Error fetching demo data:", error)
    return NextResponse.json(
      { error: "Failed to fetch demo data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
