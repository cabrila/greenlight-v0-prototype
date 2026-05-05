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

    const prompt = `Analyze this screenplay/script document and extract all characters. For each character, provide:
- name: The character's full name as it appears in the script
- age: Estimated age or age range (e.g., "30s", "mid-40s", "25") - use "Unknown" if not specified
- gender: The character's gender based on context - use "Unknown" if unclear
- ethnicity: The character's ethnicity if mentioned or implied - use "Not specified" if not mentioned
- scenes: Estimated number of scenes the character appears in
- castingNotes: Brief notes about the character's role, personality, or important traits for casting purposes

Return ONLY a valid JSON array of character objects. Do not include any markdown formatting, code blocks, or explanatory text. Example format:
[{"name":"John Smith","age":"30s","gender":"Male","ethnicity":"Not specified","scenes":15,"castingNotes":"Lead protagonist, determined and resourceful"}]

If no characters are found, return an empty array: []`

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

    const characters = JSON.parse(cleanedContent)

    // Add unique IDs to each character
    const charactersWithIds = characters.map((char: Record<string, unknown>) => ({
      ...char,
      id: crypto.randomUUID(),
    }))

    return NextResponse.json({ characters: charactersWithIds })
  } catch (error) {
    console.error("Error analyzing characters:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${errorMessage}` }, { status: 500 })
  }
}
