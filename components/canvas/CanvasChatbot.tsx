"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ImagePlus, Loader2 } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
}

const GREETING =
  "Hi there! I'm your Creative Go-Pilot.\nShare an idea, and I'll help you visualize it and explore where it could go."

function generateResponse(userMessage: string): string {
  const m = userMessage.toLowerCase()
  if (m.includes("scene") || m.includes("location") || m.includes("set")) {
    return "Great starting point. Picture the space, time of day, and mood — I can suggest set dressing, lighting, and which cast and props from your board would bring this scene to life."
  }
  if (m.includes("character") || m.includes("cast") || m.includes("actor")) {
    return "Let's develop this character. Think about their look, wardrobe, and presence. I can help map costume and makeup options and pair them with the right actors on your canvas."
  }
  if (m.includes("costume") || m.includes("wardrobe") || m.includes("makeup") || m.includes("look")) {
    return "Nice direction. Describe the era, texture, and palette you're after, and I'll outline costume and makeup looks you can drop onto the board to compare."
  }
  if (m.includes("prop")) {
    return "Props add so much character. Tell me the story beat, and I'll suggest hero props and set pieces that fit the tone and can sit alongside your cast on the canvas."
  }
  return "Love it. Let's build on that — describe the visual you have in mind and I'll help you shape the moment and pull the right cast, props, costume, and locations together."
}

/**
 * Body-only Creative Go-Pilot chat. Positioning, accent, header and collapse are
 * owned by the parent dock (CanvasDock) so the chat can live inside a tab.
 */
export default function CanvasChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const isComposingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)
    setTimeout(
      () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-assistant`,
            type: "assistant",
            content: generateResponse(userMessage.content),
            timestamp: Date.now(),
          },
        ])
        setIsProcessing(false)
      },
      900 + Math.random() * 700,
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Respect IME composition (CJK input) and Safari's unreliable final event
    if (e.nativeEvent.isComposing || isComposingRef.current || (e as unknown as { keyCode: number }).keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="max-h-72 overflow-y-auto px-4 pt-3 pb-2 space-y-3">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl bg-slate-100 px-4 py-3">
            <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">{GREETING}</p>
          </div>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                message.type === "user" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          className="shrink-0 w-11 h-11 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center"
          title="Add an image"
          aria-label="Add an image"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => (isComposingRef.current = true)}
          onCompositionEnd={() => (isComposingRef.current = false)}
          placeholder="Describe a scene, character, or moment..."
          className="flex-1 px-4 py-3 rounded-full border-2 border-emerald-300 text-[15px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isProcessing}
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            !inputValue.trim() || isProcessing
              ? "bg-emerald-200 text-white cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
