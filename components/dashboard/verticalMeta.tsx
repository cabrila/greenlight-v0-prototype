import { UserCircle, MapPin, Scissors, Package, Calendar } from "lucide-react"
import type { VerticalKey } from "@/lib/dashboardData"

// Discreet, consistent iconography + a restrained accent per vertical.
// Accent is used sparingly (icon chip only) to keep the dashboard calm.
export const VERTICAL_META: Record<
  VerticalKey,
  { Icon: typeof UserCircle; chip: string; icon: string }
> = {
  characters: { Icon: UserCircle, chip: "bg-emerald-50", icon: "text-emerald-600" },
  locations: { Icon: MapPin, chip: "bg-teal-50", icon: "text-teal-600" },
  costumes: { Icon: Scissors, chip: "bg-pink-50", icon: "text-pink-600" },
  props: { Icon: Package, chip: "bg-amber-50", icon: "text-amber-700" },
  schedule: { Icon: Calendar, chip: "bg-blue-50", icon: "text-blue-600" },
}
