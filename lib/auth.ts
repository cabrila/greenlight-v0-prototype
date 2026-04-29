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
  const settings = {
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    handleCodeInApp: true,
  }
  
  console.log("[v0] sendMagicLink called with email:", email)
  console.log("[v0] actionCodeSettings.url:", settings.url)
  
  try {
    await sendSignInLinkToEmail(auth, email, settings)
    console.log("[v0] sendSignInLinkToEmail succeeded")
    // Store email in localStorage for verification later
    if (typeof window !== "undefined") {
      window.localStorage.setItem("emailForSignIn", email)
      console.log("[v0] Stored email in localStorage")
    }
  } catch (error: unknown) {
    console.error("[v0] Error sending magic link:", error)
    if (error && typeof error === "object" && "code" in error) {
      console.error("[v0] Firebase error code:", (error as { code: string }).code)
    }
    if (error && typeof error === "object" && "message" in error) {
      console.error("[v0] Firebase error message:", (error as { message: string }).message)
    }
    throw error
  }
}

/**
 * Check if the current URL is a magic link callback
 */
export function isMagicLinkCallback(): boolean {
  if (typeof window === "undefined") return false
  const isEmailLink = isSignInWithEmailLink(auth, window.location.href)
  console.log("[v0] isMagicLinkCallback check:", isEmailLink, "URL:", window.location.href)
  return isEmailLink
}

/**
 * Complete the magic link sign-in process
 */
export async function completeMagicLinkSignIn(email?: string): Promise<User> {
  console.log("[v0] completeMagicLinkSignIn called")
  console.log("[v0] Provided email:", email)
  
  try {
    const storedEmail = typeof window !== "undefined" ? window.localStorage.getItem("emailForSignIn") : null
    console.log("[v0] Stored email from localStorage:", storedEmail)
    
    const emailToUse = email || storedEmail

    if (!emailToUse) {
      console.error("[v0] No email found for sign-in")
      throw new Error("No email found for sign-in. Please enter your email again.")
    }

    console.log("[v0] Attempting signInWithEmailLink with email:", emailToUse)
    console.log("[v0] Current URL:", window.location.href)
    
    const result = await signInWithEmailLink(auth, emailToUse, window.location.href)
    console.log("[v0] signInWithEmailLink succeeded, user:", result.user.email)

    // Clean up localStorage
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("emailForSignIn")
      console.log("[v0] Removed email from localStorage")
    }

    return result.user
  } catch (error: unknown) {
    console.error("[v0] Error completing magic link sign-in:", error)
    if (error && typeof error === "object" && "code" in error) {
      console.error("[v0] Firebase error code:", (error as { code: string }).code)
    }
    if (error && typeof error === "object" && "message" in error) {
      console.error("[v0] Firebase error message:", (error as { message: string }).message)
    }
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
  // Guard against SSR - auth is a placeholder object on server
  if (typeof window === "undefined") {
    // Return a no-op unsubscribe function for SSR
    return () => {}
  }
  
  // Check if auth is properly initialized (has onAuthStateChanged)
  if (!auth || typeof auth.onIdTokenChanged !== "function") {
    // Firebase not properly initialized, call callback with null immediately
    setTimeout(() => callback(null), 0)
    return () => {}
  }
  
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
