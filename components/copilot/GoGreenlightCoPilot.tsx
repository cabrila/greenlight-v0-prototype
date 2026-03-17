"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Loader2, Mic, MicOff, Sparkles, MessageCircle, Lightbulb, Zap, ChevronDown } from "lucide-react"
import { Z_INDEX } from "@/utils/zIndex"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
}

const SUGGESTED_PROMPTS = [
  "What characters need casting?",
  "Show me actors tagged as 'Lead Potential'",
  "How many actors are in the current project?",
  "Add a new character called 'Detective'",
  "What's the status of auditions?",
]

export default function GoGreenlightCoPilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Project/character queries
    if (lowerMessage.includes("character") && (lowerMessage.includes("need") || lowerMessage.includes("casting"))) {
      return "Based on the current project, there are 5 characters that still need casting:\n\n1. **Detective Sarah** - Lead role, requires strong dramatic presence\n2. **Dr. Marcus** - Supporting, medical professional\n3. **Young Tommy** - Child actor, ages 8-12\n4. **Mayor Chen** - Recurring, authority figure\n5. **Mysterious Stranger** - Guest role, Episode 3\n\nWould you like me to show actors that match any of these roles?"
    }

    if (lowerMessage.includes("actor") && (lowerMessage.includes("how many") || lowerMessage.includes("count"))) {
      return "The current project has **47 actors** in the database:\n\n- 12 actors marked as 'Lead Potential'\n- 18 actors in the 'Under Consideration' list\n- 8 actors with confirmed audition slots\n- 9 actors in the general pool\n\nWould you like me to filter or organize these actors in a specific way?"
    }

    if (lowerMessage.includes("tagged") || lowerMessage.includes("lead potential")) {
      return "I found **12 actors** tagged as 'Lead Potential':\n\n1. Emma Richardson - Drama specialist\n2. Marcus Chen - Action/Drama\n3. Sofia Alvarez - Comedy/Drama\n4. James Wright - Character actor\n...and 8 more.\n\nI can open the filtered view to show all of them. Would you like me to do that?"
    }

    if (lowerMessage.includes("add") && lowerMessage.includes("character")) {
      const characterMatch = userMessage.match(/['"]([^'"]+)['"]/) || userMessage.match(/called\s+(\w+)/i)
      const characterName = characterMatch ? characterMatch[1] : "New Character"
      return `I'll add a new character called **"${characterName}"** to the project.\n\n✅ Character created successfully!\n\nThe character has been added to your Characters panel. Would you like to:\n- Set character attributes (age range, type, etc.)\n- Start searching for matching actors\n- Add character notes or description`
    }

    if (lowerMessage.includes("audition") && lowerMessage.includes("status")) {
      return "Here's the current audition status:\n\n**Scheduled:** 8 auditions\n- 3 for today (2:00 PM, 3:30 PM, 5:00 PM)\n- 5 for this week\n\n**Completed:** 23 auditions\n- 15 with callback recommendations\n- 8 passed\n\n**Pending Review:** 4 tape submissions\n\nWould you like me to show the full audition schedule?"
    }

    // Canvas/visualization queries
    if (lowerMessage.includes("compare") || lowerMessage.includes("side by side")) {
      return "I can help you compare actors side by side. To do this:\n\n1. Select the actors you want to compare in the grid view\n2. Open the Canvas/Mix view\n3. I'll arrange them for easy comparison\n\nAlternatively, tell me which specific actors you'd like to compare and I'll set it up for you."
    }

    // Help/capabilities
    if (lowerMessage.includes("help") || lowerMessage.includes("what can you do") || lowerMessage.includes("capabilities")) {
      return "I'm your GoGreenlight CoPilot! Here's what I can help with:\n\n**Project Management**\n- View and manage characters\n- Track casting progress\n- Check audition schedules\n\n**Actor Search**\n- Find actors by attributes\n- Filter by tags, status, or notes\n- Show comparison views\n\n**Quick Actions**\n- Add new characters\n- Update actor statuses\n- Generate casting reports\n\nJust ask me anything about your casting project!"
    }

    // Default helpful response
    return "I understand you're asking about: \"" + userMessage + "\"\n\nAs your CoPilot, I can help you with:\n- Finding and filtering actors\n- Managing characters and roles\n- Checking project status\n- Navigating the casting workflow\n\nCould you provide more details about what you'd like to accomplish?"
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isProcessing) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: text,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)
    setShowSuggestions(false)

    // Simulate AI processing delay
    setTimeout(
      () => {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          type: "assistant",
          content: generateMockResponse(text),
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsProcessing(false)
      },
      800 + Math.random() * 800,
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Simulate voice input
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        setInputValue("Show me actors for the lead role")
      }, 2000)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setShowSuggestions(true)
  }

  return (
    <>
      {/* Floating CoPilot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group ${
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-110 hover:shadow-xl"
        }`}
        style={{ zIndex: Z_INDEX.COPILOT }}
        title={isOpen ? "Close CoPilot" : "Open GoGreenlight CoPilot"}
        aria-label={isOpen ? "Close CoPilot" : "Open GoGreenlight CoPilot"}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            {/* Pulse animation ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* CoPilot Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ zIndex: Z_INDEX.COPILOT }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">GoGreenlight CoPilot</h3>
                <p className="text-xs text-primary-foreground/70">AI-powered casting assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-muted/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">How can I help you today?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about your casting project, actors, or characters.
                </p>
                
                {showSuggestions && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                      <Lightbulb className="w-3 h-3" />
                      Try asking:
                    </p>
                    {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-muted hover:border-primary/30 transition-colors text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-background border border-border text-foreground rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1.5 ${
                          message.type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask CoPilot anything..."}
                  disabled={isProcessing || isListening}
                  className="w-full px-4 py-2.5 bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isProcessing}
                className={`p-2.5 rounded-xl transition-all ${
                  !inputValue.trim() || isProcessing
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                }`}
                title="Send message"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Zap className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">
                Powered by GoGreenlight AI
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
