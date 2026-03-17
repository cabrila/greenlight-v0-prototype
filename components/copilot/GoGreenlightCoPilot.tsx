"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Send, X, Loader2, Mic, MicOff, Sparkles, MessageCircle, Lightbulb, 
  Users, Film, Calendar, Search, ArrowRight, User, Clapperboard,
  ChevronRight, ExternalLink, CheckCircle2, ListChecks, BarChart3
} from "lucide-react"
import { Z_INDEX } from "@/utils/zIndex"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
  actions?: ActionButton[]
  queryType?: "actors" | "characters" | "auditions" | "project" | "general"
}

interface ActionButton {
  label: string
  icon: "actors" | "characters" | "auditions" | "search" | "navigate" | "confirm"
  action: string
}

const SUGGESTED_PROMPTS = [
  { text: "What characters need casting?", icon: "characters" as const },
  { text: "Show me actors tagged as 'Lead Potential'", icon: "actors" as const },
  { text: "How many actors are in the project?", icon: "actors" as const },
  { text: "What's the status of auditions?", icon: "auditions" as const },
]

const QUERY_ICONS = {
  actors: Users,
  characters: Film,
  auditions: Calendar,
  project: Clapperboard,
  general: Sparkles,
  search: Search,
  navigate: ArrowRight,
  confirm: CheckCircle2,
}

export default function GoGreenlightCoPilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const detectQueryType = (message: string): Message["queryType"] => {
    const lower = message.toLowerCase()
    if (lower.includes("actor") || lower.includes("cast") || lower.includes("talent")) return "actors"
    if (lower.includes("character") || lower.includes("role")) return "characters"
    if (lower.includes("audition") || lower.includes("schedule") || lower.includes("callback")) return "auditions"
    if (lower.includes("project") || lower.includes("status") || lower.includes("progress")) return "project"
    return "general"
  }

  const generateMockResponse = (userMessage: string): { content: string; actions?: ActionButton[]; queryType: Message["queryType"] } => {
    const lowerMessage = userMessage.toLowerCase()
    const queryType = detectQueryType(userMessage)

    if (lowerMessage.includes("character") && (lowerMessage.includes("need") || lowerMessage.includes("casting"))) {
      return {
        content: "I found **5 characters** that still need casting:\n\n1. **Detective Sarah** - Lead role, dramatic presence required\n2. **Dr. Marcus** - Supporting, medical professional\n3. **Young Tommy** - Child actor, ages 8-12\n4. **Mayor Chen** - Recurring, authority figure\n5. **Mysterious Stranger** - Guest role, Episode 3",
        queryType: "characters",
        actions: [
          { label: "View Characters", icon: "characters", action: "openCharacters" },
          { label: "Find Matching Actors", icon: "search", action: "searchActors" },
        ]
      }
    }

    if (lowerMessage.includes("actor") && (lowerMessage.includes("how many") || lowerMessage.includes("count"))) {
      return {
        content: "The current project has **47 actors** in the database:\n\n- 12 marked as 'Lead Potential'\n- 18 in 'Under Consideration'\n- 8 with confirmed audition slots\n- 9 in the general pool",
        queryType: "actors",
        actions: [
          { label: "View All Actors", icon: "actors", action: "openActors" },
          { label: "Filter by Status", icon: "search", action: "filterActors" },
        ]
      }
    }

    if (lowerMessage.includes("tagged") || lowerMessage.includes("lead potential")) {
      return {
        content: "Found **12 actors** tagged as 'Lead Potential':\n\n1. Emma Richardson - Drama specialist\n2. Marcus Chen - Action/Drama\n3. Sofia Alvarez - Comedy/Drama\n4. James Wright - Character actor\n...and 8 more.",
        queryType: "actors",
        actions: [
          { label: "Open Filtered View", icon: "navigate", action: "openFiltered" },
          { label: "Compare Top Picks", icon: "actors", action: "compareActors" },
        ]
      }
    }

    if (lowerMessage.includes("add") && lowerMessage.includes("character")) {
      const characterMatch = userMessage.match(/['"]([^'"]+)['"]/) || userMessage.match(/called\s+(\w+)/i)
      const characterName = characterMatch ? characterMatch[1] : "New Character"
      return {
        content: `Character **"${characterName}"** has been added to your project.\n\nThe character is now available in the Characters panel.`,
        queryType: "characters",
        actions: [
          { label: "Set Attributes", icon: "characters", action: "editCharacter" },
          { label: "Find Actors", icon: "search", action: "searchForRole" },
          { label: "Done", icon: "confirm", action: "dismiss" },
        ]
      }
    }

    if (lowerMessage.includes("audition") && lowerMessage.includes("status")) {
      return {
        content: "**Audition Overview:**\n\n**Today:** 3 sessions (2:00, 3:30, 5:00 PM)\n**This Week:** 5 more scheduled\n**Completed:** 23 total (15 callbacks recommended)\n**Pending Review:** 4 tape submissions",
        queryType: "auditions",
        actions: [
          { label: "View Schedule", icon: "auditions", action: "openSchedule" },
          { label: "Review Tapes", icon: "navigate", action: "reviewTapes" },
        ]
      }
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
      return {
        content: "I can help you with:\n\n**Casting**\n- Find and filter actors\n- Manage character roles\n- Track casting progress\n\n**Scheduling**\n- View audition calendar\n- Check session status\n\n**Quick Actions**\n- Add characters\n- Update statuses\n- Generate reports",
        queryType: "general",
        actions: [
          { label: "View Actors", icon: "actors", action: "openActors" },
          { label: "View Characters", icon: "characters", action: "openCharacters" },
          { label: "View Auditions", icon: "auditions", action: "openAuditions" },
        ]
      }
    }

    return {
      content: `I understand you're asking about: "${userMessage}"\n\nI can help with actors, characters, auditions, and project management. Could you provide more details?`,
      queryType: "general",
      actions: [
        { label: "Browse Actors", icon: "actors", action: "openActors" },
        { label: "Browse Characters", icon: "characters", action: "openCharacters" },
      ]
    }
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

    setTimeout(() => {
      const response = generateMockResponse(text)
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        type: "assistant",
        content: response.content,
        timestamp: Date.now(),
        actions: response.actions,
        queryType: response.queryType,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsProcessing(false)
    }, 600 + Math.random() * 600)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        setInputValue("Show me actors for the lead role")
      }, 2000)
    }
  }

  const handleActionClick = (action: string) => {
    // Simulate action handling - in real app, this would trigger navigation/modals
    const responseMap: Record<string, string> = {
      openActors: "Opening Actors panel...",
      openCharacters: "Opening Characters panel...",
      openSchedule: "Opening Audition Schedule...",
      searchActors: "Starting actor search...",
      filterActors: "Opening filter options...",
    }
    if (responseMap[action]) {
      // Could dispatch to app state or open modals here
    }
  }

  const QueryIcon = ({ type }: { type: keyof typeof QUERY_ICONS }) => {
    const Icon = QUERY_ICONS[type]
    return <Icon className="w-3.5 h-3.5" />
  }

  const ActionButtonComponent = ({ action }: { action: ActionButton }) => {
    const Icon = QUERY_ICONS[action.icon]
    return (
      <button
        onClick={() => handleActionClick(action.action)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors"
      >
        <Icon className="w-3 h-3" />
        {action.label}
        <ChevronRight className="w-3 h-3 opacity-60" />
      </button>
    )
  }

  return (
    <>
      {/* Floating CoPilot Button - Green brand color, hover animation only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            : "bg-success-600 text-white hover:bg-success-500 hover:scale-110 hover:shadow-xl"
        }`}
        style={{ zIndex: Z_INDEX.COPILOT }}
        title={isOpen ? "Close CoPilot" : "Open GoGreenlight CoPilot"}
        aria-label={isOpen ? "Close CoPilot" : "Open GoGreenlight CoPilot"}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </button>

      {/* CoPilot Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-[380px] max-h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ zIndex: Z_INDEX.COPILOT }}
        >
          {/* Header - Green brand gradient */}
          <div className="bg-gradient-to-r from-success-600 to-success-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">GoGreenlight CoPilot</h3>
                <p className="text-xs text-white/70">AI Casting Assistant</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setShowSuggestions(true) }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Clear chat"
              >
                <ListChecks className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[360px] bg-muted/20">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-success-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">How can I help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask about actors, characters, or auditions
                </p>
                
                {showSuggestions && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center mb-2">
                      <Lightbulb className="w-3 h-3" />
                      Try asking:
                    </p>
                    {SUGGESTED_PROMPTS.map((prompt, index) => {
                      const Icon = QUERY_ICONS[prompt.icon]
                      return (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(prompt.text)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm bg-background border border-border rounded-xl hover:bg-muted hover:border-success-300 transition-colors text-foreground text-left group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-success-100 transition-colors">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-success-600" />
                          </span>
                          <span className="flex-1">{prompt.text}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    })}
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
                    <div className={`max-w-[88%] ${message.type === "assistant" ? "space-y-2" : ""}`}>
                      {/* Query type indicator for assistant messages */}
                      {message.type === "assistant" && message.queryType && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-5 h-5 rounded bg-success-100 flex items-center justify-center">
                            <QueryIcon type={message.queryType} />
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-medium text-success-600">
                            {message.queryType}
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 ${
                          message.type === "user"
                            ? "bg-success-600 text-white rounded-br-md"
                            : "bg-background border border-border text-foreground rounded-bl-md shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                            }
                            return part
                          })}
                        </p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            message.type === "user" ? "text-white/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Action buttons for assistant messages */}
                      {message.type === "assistant" && message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                          {message.actions.map((action, idx) => (
                            <ActionButtonComponent key={idx} action={action} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
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
                    : "bg-muted text-muted-foreground hover:bg-success-100 hover:text-success-600"
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask CoPilot..."}
                  disabled={isProcessing || isListening}
                  className="w-full px-4 py-2.5 bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success-500 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isProcessing}
                className={`p-2.5 rounded-xl transition-all ${
                  !inputValue.trim() || isProcessing
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-success-600 text-white hover:bg-success-500 shadow-md"
                }`}
                title="Send message"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <BarChart3 className="w-3 h-3 text-success-500" />
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
