"use client"

import { useState } from "react"
import { Mail, Loader2, CheckCircle } from "lucide-react"

type LoginState = "idle" | "loading" | "success" | "error"

interface LoginScreenProps {
  onDemoAccess?: () => void
}

export default function LoginScreen({ onDemoAccess }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [loginState, setLoginState] = useState<LoginState>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address")
      setLoginState("error")
      return
    }

    setLoginState("loading")
    setErrorMessage("")

    // Simulate magic link sending (replace with actual Supabase auth)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setLoginState("success")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Demo Access Button — upper right */}
      {onDemoAccess && (
        <button
          onClick={onDemoAccess}
          aria-label="Enter demo as John Doe"
          className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 transition-all duration-200 text-white/60 hover:text-white/90 text-xs font-sans"
        >
          Demo
        </button>
      )}

      {/* Logo */}
      <div className="mb-12">
        <img
          src="/gogreenlight-logo.png"
          alt="GoGreenlight"
          className="h-16 w-auto"
        />
      </div>

      {/* Welcome Text */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-sans">
          Welcome!
        </h1>
        <p className="text-white/70 text-base md:text-lg font-sans">
          Your project begins here
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        {loginState === "success" ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-[#b8e986]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 font-sans">
              Check your email
            </h2>
            <p className="text-white/70 text-sm leading-relaxed font-sans">
              We&apos;ve sent a magic link to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <button
              onClick={() => {
                setLoginState("idle")
                setEmail("")
              }}
              className="mt-6 text-[#b8e986] hover:text-[#c8f096] text-sm underline underline-offset-2 transition-colors font-sans"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (loginState === "error") {
                    setLoginState("idle")
                    setErrorMessage("")
                  }
                }}
                placeholder="Enter your email"
                className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                disabled={loginState === "loading"}
                autoComplete="email"
                autoFocus
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Error Message */}
            {loginState === "error" && errorMessage && (
              <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginState === "loading" || !email.trim()}
              className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
            >
              {loginState === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-[11px] text-white/30 text-center font-sans">
        GoGreenlight -- All your creative assets, one dashboard, zero silos.
      </p>
    </div>
  )
}
