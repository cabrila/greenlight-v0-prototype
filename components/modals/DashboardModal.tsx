"use client"

import { useState } from "react"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import Dashboard from "@/components/dashboard/Dashboard"

interface DashboardModalProps {
  onClose: () => void
}

export default function DashboardModal({ onClose }: DashboardModalProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 pl-14">
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="dashboard"
      />

      <ModalHeader title="Dashboard" titleColor="bg-slate-900" onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        <Dashboard />
      </div>
    </div>
  )
}
