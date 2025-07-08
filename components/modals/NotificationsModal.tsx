"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Search,
  UserPlus,
  MessageSquare,
  Vote,
  Users,
  AlertTriangle,
  Info,
  Star,
  Clock,
  Eye,
  Settings,
} from "lucide-react"

interface NotificationsModalProps {
  onClose: () => void
}

interface Notification {
  id: string
  type: "vote" | "comment" | "status" | "user" | "deadline" | "system" | "mention" | "approval"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  actorId?: string
  characterId?: string
  userId?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions" | "votes" | "comments">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  // Use real notifications from state
  const notifications = state.notifications || []

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-5 h-5 ${priority === "high" ? "text-red-500" : priority === "medium" ? "text-blue-500" : "text-gray-500"}`

    switch (type) {
      case "vote":
        return <Vote className={iconClass} />
      case "comment":
        return <MessageSquare className={iconClass} />
      case "user":
        return <UserPlus className={iconClass} />
      case "status":
        return <Star className={iconClass} />
      case "deadline":
        return <Clock className={iconClass} />
      case "mention":
        return <Users className={iconClass} />
      case "approval":
        return <AlertTriangle className={iconClass} />
      case "system":
        return <Info className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const filteredNotifications = (notifications || []).filter((notification) => {
    // Add null checks for notification properties
    if (!notification || typeof notification.title !== "string" || typeof notification.message !== "string") {
      return false
    }

    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    switch (activeTab) {
      case "unread":
        return !notification.read && matchesSearch
      case "mentions":
        return notification.type === "mention" && matchesSearch
      case "votes":
        return notification.type === "vote" && matchesSearch
      case "comments":
        return notification.type === "comment" && matchesSearch
      default:
        return matchesSearch
    }
  })

  const unreadCount = (notifications || []).filter((n) => n && !n.read).length
  const mentionCount = (notifications || []).filter((n) => n && n.type === "mention" && !n.read).length

  const handleMarkAsRead = (notificationId: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId })
  }

  const handleMarkAllAsRead = () => {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })
  }

  const handleDeleteNotification = (notificationId: string) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId })
  }

  const handleBulkAction = (action: "read" | "delete") => {
    if (action === "read") {
      selectedNotifications.forEach((id) => {
        dispatch({ type: "MARK_NOTIFICATION_READ", payload: id })
      })
    } else {
      dispatch({ type: "DELETE_SELECTED_NOTIFICATIONS", payload: selectedNotifications })
    }
    setSelectedNotifications([])
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId],
    )
  }

  const handleViewNotification = (notification: Notification) => {
    // Mark notification as read when viewed
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Handle navigation based on notification type and metadata
    if (notification.actorId && notification.characterId) {
      // Find the project containing this character
      const targetProject = state.projects.find((project) =>
        project.characters.some((char) => char.id === notification.characterId),
      )

      if (!targetProject) {
        console.warn("Project not found for notification:", notification)
        return
      }

      // Switch to the correct project if needed
      if (state.currentFocus.currentProjectId !== targetProject.id) {
        dispatch({ type: "SELECT_PROJECT", payload: targetProject.id })
      }

      // Switch to the correct character if needed
      if (state.currentFocus.characterId !== notification.characterId) {
        dispatch({ type: "SELECT_CHARACTER", payload: notification.characterId })
      }

      // Find where the actor is currently located
      const character = targetProject.characters.find((c) => c.id === notification.characterId)
      if (character) {
        let targetTab = "longList" // default fallback

        // Check standard lists
        if (character.actors.longList.some((a) => a.id === notification.actorId)) {
          targetTab = "longList"
        } else if (character.actors.audition.some((a) => a.id === notification.actorId)) {
          targetTab = "audition"
        } else if (character.actors.approval.some((a) => a.id === notification.actorId)) {
          targetTab = "approval"
        } else if (character.actors.shortLists.some((sl) => sl.actors.some((a) => a.id === notification.actorId))) {
          targetTab = "shortLists"
        } else {
          // Check custom tabs
          for (const [tabKey, actors] of Object.entries(character.actors)) {
            if (
              !["longList", "audition", "approval", "shortLists"].includes(tabKey) &&
              Array.isArray(actors) &&
              actors.some((a: any) => a.id === notification.actorId)
            ) {
              targetTab = tabKey
              break
            }
          }
        }

        // Navigate to the correct tab
        dispatch({ type: "SELECT_TAB", payload: targetTab })
      }
    } else if (notification.characterId) {
      // Navigate to character even without specific actor
      const targetProject = state.projects.find((project) =>
        project.characters.some((char) => char.id === notification.characterId),
      )

      if (targetProject) {
        if (state.currentFocus.currentProjectId !== targetProject.id) {
          dispatch({ type: "SELECT_PROJECT", payload: targetProject.id })
        }
        dispatch({ type: "SELECT_CHARACTER", payload: notification.characterId })
      }
    }

    // Close the notifications modal
    onClose()
  }

  const shouldShowViewButton = (notification: Notification) => {
    // Show view button for notifications that have actionable context
    return (
      notification.actorId ||
      notification.characterId ||
      ["vote", "user", "system", "mention", "approval"].includes(notification.type)
    )
  }

  const tabs = [
    { key: "all", label: "All", count: (notifications || []).length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "mentions", label: "Mentions", count: mentionCount },
    { key: "votes", label: "Votes", count: (notifications || []).filter((n) => n && n.type === "vote").length },
    {
      key: "comments",
      label: "Comments",
      count: (notifications || []).filter((n) => n && n.type === "comment").length,
    },
  ] as const

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedNotifications.length} selected</span>
              <button
                onClick={() => handleBulkAction("read")}
                className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark read
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key ? "bg-blue-400" : "bg-gray-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-sm">{searchTerm ? "No notifications match your search." : "You're all caught up!"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                          {notification.priority === "high" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              High Priority
                            </span>
                          )}
                          {notification.type === "mention" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Mention
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {shouldShowViewButton(notification) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewNotification(notification)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View related content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </div>
          <button
            onClick={() => alert("Notification settings coming soon!")}
            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
