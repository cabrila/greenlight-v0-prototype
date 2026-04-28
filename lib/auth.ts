import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth"
import { auth } from "./firebase"

// Store the confirmation result for phone auth verification
let confirmationResult: ConfirmationResult | null = null

// Store the reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null

const actionCodeSettings = {
  url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`,
  handleCodeInApp: true,
}

/**
 * Send a magic link to the user's email
 */
export async function sendMagicLink(email: string): Promise<void> {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    // Store email in localStorage for verification later
    if (typeof window !== "undefined") {
      window.localStorage.setItem("emailForSignIn", email)
    }
  } catch (error) {
    console.error("[v0] Error sending magic link:", error)
    throw error
  }
}

/**
 * Check if the current URL is a magic link callback
 */
export function isMagicLinkCallback(): boolean {
  if (typeof window === "undefined") return false
  return isSignInWithEmailLink(auth, window.location.href)
}

/**
 * Complete the magic link sign-in process
 */
export async function completeMagicLinkSignIn(email?: string): Promise<User> {
  try {
    const emailToUse =
      email || (typeof window !== "undefined" ? window.localStorage.getItem("emailForSignIn") : null)

    if (!emailToUse) {
      throw new Error("No email found for sign-in. Please try again.")
    }

    const result = await signInWithEmailLink(auth, emailToUse, window.location.href)

    // Clean up localStorage
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("emailForSignIn")
    }

    return result.user
  } catch (error) {
    console.error("[v0] Error completing magic link sign-in:", error)
    throw error
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("[v0] Error signing out:", error)
    throw error
  }
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeToAuthStateChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Initialize the invisible reCAPTCHA verifier for phone auth
 * Must be called before sendPhoneVerificationCode
 */
export function initRecaptchaVerifier(buttonId: string): RecaptchaVerifier {
  // Clean up existing verifier if present
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved - allow sign-in
    },
    "expired-callback": () => {
      // reCAPTCHA expired - reset
      console.warn("[v0] reCAPTCHA expired, please try again")
    },
  })

  return recaptchaVerifier
}

/**
 * Send a verification code to the user's phone number
 */
export async function sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
  console.log("[v0] sendPhoneVerificationCode called with:", phoneNumber)
  console.log("[v0] recaptchaVerifier exists:", !!recaptchaVerifier)
  console.log("[v0] auth object exists:", !!auth)
  
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA verifier not initialized. Call initRecaptchaVerifier first.")
  }

  try {
    console.log("[v0] Calling signInWithPhoneNumber...")
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    console.log("[v0] signInWithPhoneNumber succeeded, confirmationResult:", !!confirmationResult)
  } catch (error: unknown) {
    console.error("[v0] Error sending phone verification code:", error)
    // Log specific Firebase error details
    if (error && typeof error === "object" && "code" in error) {
      console.error("[v0] Firebase error code:", (error as { code: string }).code)
    }
    if (error && typeof error === "object" && "message" in error) {
      console.error("[v0] Firebase error message:", (error as { message: string }).message)
    }
    // Reset reCAPTCHA on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
      recaptchaVerifier = null
    }
    throw error
  }
}

/**
 * Verify the phone verification code and complete sign-in
 */
export async function verifyPhoneCode(code: string): Promise<User> {
  if (!confirmationResult) {
    throw new Error("No verification in progress. Please request a new code.")
  }

  try {
    const result = await confirmationResult.confirm(code)
    confirmationResult = null
    return result.user
  } catch (error) {
    console.error("[v0] Error verifying phone code:", error)
    throw error
  }
}

/**
 * Clear the phone auth state (useful for starting over)
 */
export function clearPhoneAuthState(): void {
  confirmationResult = null
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
}
