import { NextRequest, NextResponse } from "next/server"
import { VertexAI } from "@google-cloud/vertexai"

// Initialize Vertex AI with credentials from environment
function getVertexAI() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (!credentialsJson) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set")
  }

  const credentials = JSON.parse(credentialsJson)
  
  return new VertexAI({
    project: credentials.project_id,
    location: "us-central1",
    googleAuthOptions: {
      credentials: credentials,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64 for Vertex AI
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Content = buffer.toString("base64")
    
    // Determine mime type
    const mimeType = file.type || "application/pdf"

    const vertexAI = getVertexAI()
    const generativeModel = vertexAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    })

    const prompt = `Analyze this screenplay/script document and extract all locations/settings. For each location, provide:
- name: The location name as it appears in scene headings (e.g., "COFFEE SHOP", "JOHN'S APARTMENT")
- type: Either "INT" (interior) or "EXT" (exterior) based on the scene heading
- timeOfDay: One of "DAY", "NIGHT", "DAWN", or "DUSK" based on the scene heading - use "DAY" as default if not specified
- description: A brief description of the location based on action lines and context in the script
- scoutingNotes: Suggestions for location scouting, including key visual elements, mood, or practical requirements

Return ONLY a valid JSON array of location objects. Do not include any markdown formatting, code blocks, or explanatory text. Example format:
[{"name":"COFFEE SHOP","type":"INT","timeOfDay":"DAY","description":"A cozy neighborhood cafe with exposed brick walls","scoutingNotes":"Need a location with natural lighting, space for 4-5 tables"}]

If no locations are found, return an empty array: []`

    const request_content = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Content,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    }

    const response = await generativeModel.generateContent(request_content)
    const result = response.response
    
    if (!result.candidates || result.candidates.length === 0) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 })
    }

    const textContent = result.candidates[0].content?.parts?.[0]?.text
    if (!textContent) {
      return NextResponse.json({ error: "Empty response from AI model" }, { status: 500 })
    }

    // Parse the JSON response - clean up any markdown formatting
    let cleanedContent = textContent.trim()
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7)
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    cleanedContent = cleanedContent.trim()

    const locations = JSON.parse(cleanedContent)

    // Add unique IDs to each location
    const locationsWithIds = locations.map((loc: Record<string, unknown>) => ({
      ...loc,
      id: crypto.randomUUID(),
    }))

    return NextResponse.json({ locations: locationsWithIds })
  } catch (error) {
    console.error("Error analyzing locations:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${errorMessage}` }, { status: 500 })
  }
}
