import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    console.log("[v0] API: Loading demo data from file system...")

    const filePath = join(process.cwd(), "lib", "demo-data.json")
    const fileContents = await readFile(filePath, "utf8")
    const demoData = JSON.parse(fileContents)

    console.log("[v0] API: Demo data loaded successfully, project count:", demoData?.project?.projects?.length || 0)
    return NextResponse.json(demoData)
  } catch (error) {
    console.error("[v0] API: Error loading demo data:", error)
    return NextResponse.json(
      {
        error: "Failed to load demo data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
