"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Mail, Send, Edit3, Eye, User } from "lucide-react"
import type { Actor } from "@/types/casting"

interface ContactActorModalProps {
  onClose: () => void
  actorIds: string[]
  characterId: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: "audition" | "callback" | "rejection" | "offer" | "general"
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "invitation-audition",
    name: "Invitation to Audition",
    subject: "Audition Invitation - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "audition",
    content: `Dear {{ACTOR_NAME}},

We are pleased to invite you to audition for the role of {{CHARACTER_NAME}} in our upcoming production "{{PROJECT_NAME}}".

Audition Details:
Date: {{AUDITION_DATE}}
Time: {{AUDITION_TIME}}
Location: {{AUDITION_LOCATION}}
Duration: Approximately {{AUDITION_DURATION}}

Please prepare:
- A contemporary monologue (2-3 minutes)
- Sides will be provided upon arrival
- Please bring a current headshot and resume

If you have any questions or need to reschedule, please contact us as soon as possible.

We look forward to seeing your audition.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "callback",
    name: "Callback Invitation",
    subject: "Callback Invitation - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "callback",
    content: `Dear {{ACTOR_NAME}},

Congratulations! We would like to invite you back for a callback audition for the role of {{CHARACTER_NAME}} in "{{PROJECT_NAME}}".

Callback Details:
Date: {{CALLBACK_DATE}}
Time: {{CALLBACK_TIME}}
Location: {{CALLBACK_LOCATION}}
Duration: Approximately {{CALLBACK_DURATION}}

For this callback, please prepare:
- The attached sides ({{SCENE_REFERENCE}})
- Be prepared to take direction and try different approaches
- {{ADDITIONAL_PREPARATION}}

Please confirm your attendance by replying to this email.

We were impressed with your initial audition and look forward to working with you further.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "rejection",
    name: "Audition Thank You",
    subject: "Thank you for your audition - {{PROJECT_NAME}}",
    category: "rejection",
    content: `Dear {{ACTOR_NAME}},

Thank you for taking the time to audition for the role of {{CHARACTER_NAME}} in "{{PROJECT_NAME}}". We appreciate your preparation and the energy you brought to your audition.

After careful consideration, we have decided to move forward with another actor for this particular role. This decision was not easy, as we had many talented actors audition.

We were impressed with your work and would like to keep you in mind for future projects. We encourage you to continue submitting for roles with our production company.

Thank you again for your time and interest in our project.

Best wishes,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "formal-offer",
    name: "Formal Casting Offer",
    subject: "Casting Offer - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "offer",
    content: `Dear {{ACTOR_NAME}},

We are delighted to formally offer you the role of {{CHARACTER_NAME}} in our production "{{PROJECT_NAME}}".

Production Details:
Start Date: {{START_DATE}}
End Date: {{END_DATE}}
Rehearsal Period: {{REHEARSAL_PERIOD}}
Performance Dates: {{PERFORMANCE_DATES}}
Location: {{PRODUCTION_LOCATION}}

Compensation: {{COMPENSATION_DETAILS}}

Next Steps:
1. Please confirm your acceptance by {{RESPONSE_DEADLINE}}
2. Contract and additional details will be sent upon acceptance
3. First rehearsal: {{FIRST_REHEARSAL_DATE}}

We are excited about the possibility of working with you and believe you will bring something special to this role.

Please let us know if you have any questions.

Congratulations and welcome to the team!

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "general-inquiry",
    name: "General Inquiry",
    subject: "Regarding {{PROJECT_NAME}} - {{CHARACTER_NAME}}",
    category: "general",
    content: `Dear {{ACTOR_NAME}},

I hope this email finds you well. I am reaching out regarding our upcoming production "{{PROJECT_NAME}}".

{{CUSTOM_MESSAGE}}

If you are interested and available, please let us know at your earliest convenience.

Thank you for your time and consideration.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
]

export default function ContactActorModal({ onClose, actorIds, characterId }: ContactActorModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [emailContent, setEmailContent] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [customFields, setCustomFields] = useState({
    auditionDate: "",
    auditionTime: "",
    auditionLocation: "",
    auditionDuration: "30 minutes",
    callbackDate: "",
    callbackTime: "",
    callbackLocation: "",
    callbackDuration: "45 minutes",
    sceneReference: "",
    additionalPreparation: "",
    startDate: "",
    endDate: "",
    rehearsalPeriod: "",
    performanceDates: "",
    productionLocation: "",
    compensationDetails: "",
    responseDeadline: "",
    firstRehearsalDate: "",
    customMessage: "",
  })

  // Get selected actors
  const selectedActors = actorIds
    .map((id) => {
      const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const character = currentProject?.characters.find((c) => c.id === characterId)
      if (!character) return null

      // Search through all actor lists
      const allActors = [
        ...character.actors.longList,
        ...character.actors.audition,
        ...character.actors.approval,
        ...character.actors.shortLists.flatMap((sl) => sl.actors),
      ]

      return allActors.find((actor) => actor.id === id)
    })
    .filter((actor): actor is Actor => Boolean(actor))

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const character = currentProject?.characters.find((c) => c.id === characterId)

  // Replace template variables with actual values
  const replaceTemplateVariables = (text: string, actor: Actor): string => {
    const currentUser = state.currentUser
    const replacements = {
      "{{ACTOR_NAME}}": actor.name,
      "{{CHARACTER_NAME}}": character?.name || "Character",
      "{{PROJECT_NAME}}": currentProject?.name || "Project",
      "{{SENDER_NAME}}": currentUser?.name || "Casting Director",
      "{{SENDER_TITLE}}":
        currentUser?.role === "Producer"
          ? "Producer"
          : currentUser?.role === "Director"
            ? "Director"
            : "Casting Director",
      "{{PRODUCTION_COMPANY}}": "Production Company",
      "{{AUDITION_DATE}}": customFields.auditionDate || "[AUDITION DATE]",
      "{{AUDITION_TIME}}": customFields.auditionTime || "[AUDITION TIME]",
      "{{AUDITION_LOCATION}}": customFields.auditionLocation || "[AUDITION LOCATION]",
      "{{AUDITION_DURATION}}": customFields.auditionDuration,
      "{{CALLBACK_DATE}}": customFields.callbackDate || "[CALLBACK DATE]",
      "{{CALLBACK_TIME}}": customFields.callbackTime || "[CALLBACK TIME]",
      "{{CALLBACK_LOCATION}}": customFields.callbackLocation || "[CALLBACK LOCATION]",
      "{{CALLBACK_DURATION}}": customFields.callbackDuration,
      "{{SCENE_REFERENCE}}": customFields.sceneReference || "[SCENE REFERENCE]",
      "{{ADDITIONAL_PREPARATION}}": customFields.additionalPreparation || "[ADDITIONAL PREPARATION]",
      "{{START_DATE}}": customFields.startDate || "[START DATE]",
      "{{END_DATE}}": customFields.endDate || "[END DATE]",
      "{{REHEARSAL_PERIOD}}": customFields.rehearsalPeriod || "[REHEARSAL PERIOD]",
      "{{PERFORMANCE_DATES}}": customFields.performanceDates || "[PERFORMANCE DATES]",
      "{{PRODUCTION_LOCATION}}": customFields.productionLocation || "[PRODUCTION LOCATION]",
      "{{COMPENSATION_DETAILS}}": customFields.compensationDetails || "[COMPENSATION DETAILS]",
      "{{RESPONSE_DEADLINE}}": customFields.responseDeadline || "[RESPONSE DEADLINE]",
      "{{FIRST_REHEARSAL_DATE}}": customFields.firstRehearsalDate || "[FIRST REHEARSAL DATE]",
      "{{CUSTOM_MESSAGE}}": customFields.customMessage || "[YOUR MESSAGE HERE]",
    }

    let result = text
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, "g"), value)
    })

    return result
  }

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEmailSubject(template.subject)
    setEmailContent(template.content)
    setIsEditing(false)
    setIsPreview(false)
  }

  // Handle sending email
  const handleSendEmail = async () => {
    if (!selectedTemplate || selectedActors.length === 0) return

    setIsSending(true)

    try {
      // Simulate email sending process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real implementation, you would:
      // 1. Send emails to each selected actor
      // 2. Log the communication in the system
      // 3. Update actor records with communication history

      console.log(
        "Sending emails to:",
        selectedActors.map((a) => a.name),
      )
      console.log("Template:", selectedTemplate.name)
      console.log("Subject:", emailSubject)
      console.log("Content:", emailContent)

      // Add contact status to actors
      dispatch({
        type: "ADD_CONTACT_STATUS",
        payload: {
          actorIds: actorIds,
          characterId: characterId,
          contactType: selectedTemplate.category,
          templateName: selectedTemplate.name,
          timestamp: Date.now(),
        },
      })

      // Close modal after successful send
      onClose()
    } catch (error) {
      console.error("Failed to send emails:", error)
    } finally {
      setIsSending(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "audition":
        return "bg-blue-100 text-blue-800"
      case "callback":
        return "bg-green-100 text-green-800"
      case "rejection":
        return "bg-red-100 text-red-800"
      case "offer":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderCustomFields = () => {
    if (!selectedTemplate) return null

    const fields = []

    if (selectedTemplate.category === "audition") {
      fields.push(
        <div key="audition-date" className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audition Date</label>
            <input
              type="date"
              value={customFields.auditionDate}
              onChange={(e) => setCustomFields({ ...customFields, auditionDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audition Time</label>
            <input
              type="time"
              value={customFields.auditionTime}
              onChange={(e) => setCustomFields({ ...customFields, auditionTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>,
        <div key="audition-location">
          <label className="block text-sm font-medium text-gray-700 mb-1">Audition Location</label>
          <input
            type="text"
            value={customFields.auditionLocation}
            onChange={(e) => setCustomFields({ ...customFields, auditionLocation: e.target.value })}
            placeholder="Studio address or virtual meeting link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>,
      )
    }

    if (selectedTemplate.category === "callback") {
      fields.push(
        <div key="callback-details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Callback Date</label>
              <input
                type="date"
                value={customFields.callbackDate}
                onChange={(e) => setCustomFields({ ...customFields, callbackDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Callback Time</label>
              <input
                type="time"
                value={customFields.callbackTime}
                onChange={(e) => setCustomFields({ ...customFields, callbackTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scene Reference</label>
            <input
              type="text"
              value={customFields.sceneReference}
              onChange={(e) => setCustomFields({ ...customFields, sceneReference: e.target.value })}
              placeholder="e.g., Act 2, Scene 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Preparation</label>
            <textarea
              value={customFields.additionalPreparation}
              onChange={(e) => setCustomFields({ ...customFields, additionalPreparation: e.target.value })}
              placeholder="Any specific preparation instructions"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>,
      )
    }

    if (selectedTemplate.category === "offer") {
      fields.push(
        <div key="offer-details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customFields.startDate}
                onChange={(e) => setCustomFields({ ...customFields, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Deadline</label>
              <input
                type="date"
                value={customFields.responseDeadline}
                onChange={(e) => setCustomFields({ ...customFields, responseDeadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compensation Details</label>
            <input
              type="text"
              value={customFields.compensationDetails}
              onChange={(e) => setCustomFields({ ...customFields, compensationDetails: e.target.value })}
              placeholder="e.g., $500/week + benefits"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>,
      )
    }

    if (selectedTemplate.category === "general") {
      fields.push(
        <div key="custom-message">
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
          <textarea
            value={customFields.customMessage}
            onChange={(e) => setCustomFields({ ...customFields, customMessage: e.target.value })}
            placeholder="Enter your custom message here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>,
      )
    }

    return fields.length > 0 ? (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900">Template Details</h4>
        {fields}
      </div>
    ) : null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Actor{selectedActors.length > 1 ? "s" : ""}
              </h2>
              <p className="text-sm text-gray-600">
                Send email to {selectedActors.length} selected actor{selectedActors.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Templates and Recipients */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {/* Recipients */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Recipients ({selectedActors.length})</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedActors.map((actor) => (
                  <div key={actor.id} className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{actor.name}</span>
                    {actor.email && <span className="text-gray-500">({actor.email})</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Email Templates */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Email Templates</h3>
              <div className="space-y-2">
                {EMAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{template.subject}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Email Composition */}
          <div className="flex-1 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Email Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          isPreview ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        Preview
                      </button>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          isEditing ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Edit3 className="w-4 h-4 mr-1 inline" />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {isPreview && selectedActors.length > 0
                          ? replaceTemplateVariables(emailSubject, selectedActors[0])
                          : emailSubject}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {!isPreview && <div className="p-4 border-b border-gray-200">{renderCustomFields()}</div>}

                {/* Email Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  {isEditing ? (
                    <textarea
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="w-full h-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Email content..."
                    />
                  ) : (
                    <div className="w-full h-full min-h-[300px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {isPreview && selectedActors.length > 0
                          ? replaceTemplateVariables(emailContent, selectedActors[0])
                          : emailContent}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {isPreview && selectedActors.length > 1 && (
                        <p>
                          Preview shows content for {selectedActors[0].name}. Each actor will receive a personalized
                          email.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={isSending}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={isSending || !emailContent.trim() || !emailSubject.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {isSending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Email{selectedActors.length > 1 ? "s" : ""}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an email template to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
