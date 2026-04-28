import { completeMagicLinkSignIn } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  try {
    // Complete the magic link sign-in
    const user = await completeMagicLinkSignIn(email || undefined)

    // Redirect to the splash screen after successful authentication
    // The session will be maintained via Firebase Auth
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("[v0] Magic link verification error:", error)

    // Redirect back to login with error
    const errorMessage = encodeURIComponent(
      error instanceof Error ? error.message : "Magic link verification failed"
    )
    return NextResponse.redirect(new URL(`/?error=${errorMessage}`, request.url))
  }
}
