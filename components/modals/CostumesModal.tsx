"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import type {
  Actor,
  Character,
  ProjectCostumes,
  CostumeInventoryItem,
  CostumeLook,
  CostumeShoppingItem,
  ActorMeasurements,
  ActorHMUSpecs,
  CostumeItemType,
  CostumeItemStatus,
} from "@/types/casting"
import {
  X,
  Plus,
  Search,
  Grid3X3,
  List,
  Shirt,
  Scissors,
  ShoppingBag,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Upload,
  Trash2,
  Pencil,
  AlertTriangle,
  Camera,
  Eye,
  MoreVertical,
  User,
  Palette,
  Ruler,
  Package,
  ArrowRight,
  Check,
  ImageIcon,
} from "lucide-react"

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function uid() {
  return Math.random().toString(36).slice(2, 11)
}

/** Get the cast actor for a character across ALL lists */
function getCastActorForCharacter(character: Character): Actor | null {
  const allActors: Actor[] = [
    ...(character.actors.longList as Actor[]),
    ...(character.actors.audition as Actor[]),
    ...(character.actors.approval as Actor[]),
    ...(character.actors.shortLists?.flatMap((sl) => sl.actors) || []),
  ]
  return allActors.find((a) => a.isCast) || null
}

/** Get all actors across all lists for a character */
function getAllActorsForCharacter(character: Character): Actor[] {
  return [
    ...(character.actors.longList as Actor[]),
    ...(character.actors.audition as Actor[]),
    ...(character.actors.approval as Actor[]),
    ...(character.actors.shortLists?.flatMap((sl) => sl.actors) || []),
  ]
}

const VIBE_TAGS = [
  "Formal",
  "Casual",
  "Distressed",
  "Bloody",
  "Futuristic",
  "Period",
  "Military",
  "Athletic",
  "Elegant",
  "Rugged",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Romantic",
  "Uniform",
]

const STATUS_COLORS: Record<CostumeItemStatus, { bg: string; text: string; label: string }> = {
  "in-stock": { bg: "bg-emerald-100", text: "text-emerald-700", label: "In Stock" },
  rented: { bg: "bg-blue-100", text: "text-blue-700", label: "Rented" },
  purchased: { bg: "bg-teal-100", text: "text-teal-700", label: "Purchased" },
  "on-set": { bg: "bg-amber-100", text: "text-amber-700", label: "On Set" },
  "at-cleaners": { bg: "bg-purple-100", text: "text-purple-700", label: "At Cleaners" },
  damaged: { bg: "bg-red-100", text: "text-red-700", label: "Damaged" },
}

const ITEM_TYPES: Record<CostumeItemType, string> = {
  "costume-piece": "Costume Piece",
  "hmu-consumable": "HMU Consumable",
  durable: "Durable (Wig, Prosthetic)",
}

function emptyProjectCostumes(): ProjectCostumes {
  return { actorSpecs: {}, inventory: [], looks: [], shoppingList: [] }
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

type MainTab = "wardrobe" | "looks" | "crossplot" | "shopping"

export default function CostumesModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()

  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null
  const characters: Character[] = currentProject?.characters ?? []

  /* ---- Persisted costumes data ---- */
  const costumes: ProjectCostumes = currentProject?.costumes ?? emptyProjectCostumes()
  const costumesRef = useRef(costumes)
  costumesRef.current = costumes

  const syncCostumes = useCallback(
    (updater: (prev: ProjectCostumes) => ProjectCostumes) => {
      if (!projectId) return
      const next = updater(costumesRef.current)
      dispatch({ type: "SET_PROJECT_COSTUMES", payload: { projectId, costumes: next } })
    },
    [projectId, dispatch],
  )

  /* ---- UI State ---- */
  const [mainTab, setMainTab] = useState<MainTab>("wardrobe")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CostumeInventoryItem | null>(null)
  const [showLookBuilder, setShowLookBuilder] = useState(false)
  const [editingLook, setEditingLook] = useState<CostumeLook | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [showActorSpecs, setShowActorSpecs] = useState<string | null>(null) // actorId
  const [showShoppingForm, setShowShoppingForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  /* ---- Character/Actor mapping ---- */
  const characterActorMap = useMemo(() => {
    const map: { character: Character; castActor: Actor | null }[] = []
    for (const ch of characters) {
      map.push({ character: ch, castActor: getCastActorForCharacter(ch) })
    }
    return map
  }, [characters])

  /* ---- Filtered inventory ---- */
  const filteredInventory = useMemo(() => {
    let items = costumes.inventory
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.brand?.toLowerCase().includes(s) ||
          i.vibeTags.some((t) => t.toLowerCase().includes(s)),
      )
    }
    if (filterTag) {
      items = items.filter((i) => i.vibeTags.includes(filterTag))
    }
    return items
  }, [costumes.inventory, searchTerm, filterTag])

  /* ================================================================ */
  /*  Inventory Handlers                                               */
  /* ================================================================ */

  const handleAddInventoryItem = (item: Omit<CostumeInventoryItem, "id">) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: [...prev.inventory, { ...item, id: uid() }],
    }))
    setShowAddItem(false)
  }

  const handleUpdateInventoryItem = (updated: CostumeInventoryItem) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.id === updated.id ? updated : i)),
    }))
    setEditingItem(null)
  }

  const handleDeleteInventoryItem = (id: string) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== id),
      looks: prev.looks.map((l) => ({
        ...l,
        itemIds: l.itemIds.filter((iid) => iid !== id),
      })),
    }))
    setConfirmDeleteId(null)
  }

  /* ================================================================ */
  /*  Look Handlers                                                    */
  /* ================================================================ */

  const handleSaveLook = (look: CostumeLook) => {
    syncCostumes((prev) => {
      const exists = prev.looks.find((l) => l.id === look.id)
      if (exists) {
        return { ...prev, looks: prev.looks.map((l) => (l.id === look.id ? look : l)) }
      }
      return { ...prev, looks: [...prev.looks, look] }
    })
    setShowLookBuilder(false)
    setEditingLook(null)
  }

  const handleDeleteLook = (id: string) => {
    syncCostumes((prev) => ({ ...prev, looks: prev.looks.filter((l) => l.id !== id) }))
  }

  /* ================================================================ */
  /*  Actor Specs Handler                                              */
  /* ================================================================ */

  const handleSaveActorSpecs = (actorId: string, measurements: ActorMeasurements, hmuSpecs: ActorHMUSpecs) => {
    syncCostumes((prev) => ({
      ...prev,
      actorSpecs: {
        ...prev.actorSpecs,
        [actorId]: { measurements, hmuSpecs },
      },
    }))
    setShowActorSpecs(null)
  }

  /* ================================================================ */
  /*  Shopping List Handler                                            */
  /* ================================================================ */

  const handleAddShoppingItem = (item: Omit<CostumeShoppingItem, "id">) => {
    syncCostumes((prev) => ({
      ...prev,
      shoppingList: [...prev.shoppingList, { ...item, id: uid() }],
    }))
    setShowShoppingForm(false)
  }

  const handleUpdateShoppingStatus = (id: string, status: CostumeShoppingItem["status"]) => {
    syncCostumes((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((i) => (i.id === id ? { ...i, status } : i)),
    }))
  }

  const handleDeleteShoppingItem = (id: string) => {
    syncCostumes((prev) => ({ ...prev, shoppingList: prev.shoppingList.filter((i) => i.id !== id) }))
  }

  /* ================================================================ */
  /*  Allergy check for Look Builder                                   */
  /* ================================================================ */

  const getAllergyWarnings = useCallback(
    (characterId: string, itemIds: string[]): string[] => {
      const ch = characters.find((c) => c.id === characterId)
      if (!ch) return []
      const castActor = getCastActorForCharacter(ch)
      if (!castActor) return []
      const specs = costumes.actorSpecs[castActor.id]
      if (!specs?.hmuSpecs?.allergies?.length) return []
      const warnings: string[] = []
      for (const iid of itemIds) {
        const item = costumes.inventory.find((i) => i.id === iid)
        if (!item) continue
        for (const allergy of specs.hmuSpecs.allergies) {
          if (
            item.name.toLowerCase().includes(allergy.toLowerCase()) ||
            item.vibeTags.some((t) => t.toLowerCase().includes(allergy.toLowerCase())) ||
            (item.notes ?? "").toLowerCase().includes(allergy.toLowerCase())
          ) {
            warnings.push(`"${item.name}" may trigger ${castActor.name}'s "${allergy}" allergy`)
          }
        }
      }
      return warnings
    },
    [characters, costumes],
  )

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const TABS: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: "wardrobe", label: "Wardrobe", icon: <Shirt className="w-4 h-4" /> },
    { key: "looks", label: "Looks", icon: <Palette className="w-4 h-4" /> },
    { key: "crossplot", label: "Cross-Plot", icon: <LayoutGrid className="w-4 h-4" /> },
    { key: "shopping", label: "Shopping List", icon: <ShoppingBag className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-8 w-auto" />
          <div className="inline-flex items-center bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            Costumes & Makeup
          </div>
          {currentProject && (
            <span className="hidden sm:inline text-sm text-gray-500">{currentProject.name}</span>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ---- Tab Bar ---- */}
      <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              mainTab === t.key
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "text-gray-600 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        {/* Character filter (used in Looks and Cross-Plot) */}
        {(mainTab === "looks" || mainTab === "crossplot") && characters.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Character:</span>
            <select
              value={selectedCharacterId ?? ""}
              onChange={(e) => setSelectedCharacterId(e.target.value || null)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">All Characters</option>
              {characters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---- Content Area ---- */}
      <div className="flex-1 overflow-hidden">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Shirt className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No project selected</p>
            <p className="text-gray-400 text-xs mt-1">Create or open a project first to manage costumes and makeup</p>
          </div>
        ) : mainTab === "wardrobe" ? (
          <WardrobeTab
            inventory={filteredInventory}
            allInventory={costumes.inventory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterTag={filterTag}
            onFilterTagChange={setFilterTag}
            onAdd={() => setShowAddItem(true)}
            onEdit={setEditingItem}
            onDelete={(id) => setConfirmDeleteId(id)}
            characterActorMap={characterActorMap}
            actorSpecs={costumes.actorSpecs}
            onShowActorSpecs={setShowActorSpecs}
          />
        ) : mainTab === "looks" ? (
          <LooksTab
            looks={costumes.looks}
            inventory={costumes.inventory}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onNewLook={() => {
              setEditingLook(null)
              setShowLookBuilder(true)
            }}
            onEditLook={(l) => {
              setEditingLook(l)
              setShowLookBuilder(true)
            }}
            onDeleteLook={handleDeleteLook}
            allergyWarnings={getAllergyWarnings}
          />
        ) : mainTab === "crossplot" ? (
          <CrossPlotTab
            looks={costumes.looks}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            inventory={costumes.inventory}
          />
        ) : (
          <ShoppingTab
            shoppingList={costumes.shoppingList}
            characters={characters}
            onAdd={() => setShowShoppingForm(true)}
            onUpdateStatus={handleUpdateShoppingStatus}
            onDelete={handleDeleteShoppingItem}
          />
        )}
      </div>

      {/* ---- Sub-modals ---- */}
      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} onSave={handleAddInventoryItem} />
      )}
      {editingItem && (
        <AddItemModal
          onClose={() => setEditingItem(null)}
          onSave={(item) => handleUpdateInventoryItem({ ...item, id: editingItem.id } as CostumeInventoryItem)}
          initial={editingItem}
        />
      )}
      {showLookBuilder && (
        <LookBuilderModal
          onClose={() => {
            setShowLookBuilder(false)
            setEditingLook(null)
          }}
          onSave={handleSaveLook}
          initial={editingLook}
          characters={characters}
          inventory={costumes.inventory}
          allergyWarnings={getAllergyWarnings}
        />
      )}
      {showActorSpecs && (
        <ActorSpecsModal
          actorId={showActorSpecs}
          characters={characters}
          specs={costumes.actorSpecs[showActorSpecs]}
          onClose={() => setShowActorSpecs(null)}
          onSave={(m, h) => handleSaveActorSpecs(showActorSpecs, m, h)}
        />
      )}
      {showShoppingForm && (
        <ShoppingFormModal
          characters={characters}
          onClose={() => setShowShoppingForm(false)}
          onSave={handleAddShoppingItem}
        />
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">Delete Item</h3>
              <p className="text-sm text-gray-500 text-center mt-2">This will also remove it from any Looks using it.</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <div className="w-px bg-gray-200" />
              <button onClick={() => handleDeleteInventoryItem(confirmDeleteId)} className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  WARDROBE TAB                                                       */
/* ================================================================== */

function WardrobeTab({
  inventory,
  allInventory,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterTag,
  onFilterTagChange,
  onAdd,
  onEdit,
  onDelete,
  characterActorMap,
  actorSpecs,
  onShowActorSpecs,
}: {
  inventory: CostumeInventoryItem[]
  allInventory: CostumeInventoryItem[]
  searchTerm: string
  onSearchChange: (s: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (m: "grid" | "list") => void
  filterTag: string | null
  onFilterTagChange: (t: string | null) => void
  onAdd: () => void
  onEdit: (item: CostumeInventoryItem) => void
  onDelete: (id: string) => void
  characterActorMap: { character: Character; castActor: Actor | null }[]
  actorSpecs: ProjectCostumes["actorSpecs"]
  onShowActorSpecs: (actorId: string) => void
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          <button onClick={() => onViewModeChange("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => onViewModeChange("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search wardrobe..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-300 bg-white"
          />
        </div>

        {/* Vibe tags filter */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => onFilterTagChange(null)}
            className={`px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
              !filterTag ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {VIBE_TAGS.slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterTagChange(filterTag === tag ? null : tag)}
              className={`px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
                filterTag === tag ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Two-panel: Left = Cast cards, Right = Inventory */}
      <div className="flex-1 flex overflow-hidden">
        {/* Cast panel */}
        <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cast Members</h3>
          {characterActorMap.length === 0 ? (
            <p className="text-xs text-gray-400">No characters in this project</p>
          ) : (
            <div className="space-y-2">
              {characterActorMap.map(({ character, castActor }) => (
                <div key={character.id} className="rounded-xl border border-gray-200 p-3 hover:border-rose-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    {castActor?.headshots?.[0] ? (
                      <img src={castActor.headshots[0]} alt="" className="w-8 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{character.name}</p>
                      {castActor ? (
                        <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>
                      ) : (
                        <p className="text-[10px] text-amber-600 italic">Not cast</p>
                      )}
                    </div>
                  </div>
                  {castActor && (
                    <button
                      onClick={() => onShowActorSpecs(castActor.id)}
                      className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Ruler className="w-3 h-3" />
                      {actorSpecs[castActor.id] ? "View / Edit Specs" : "Add Measurements"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Shirt className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No items in wardrobe</p>
              <p className="text-gray-400 text-xs mt-1">Add costume pieces, HMU consumables, or durables</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {inventory.map((item) => (
                <InventoryCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {inventory.map((item) => (
                <InventoryListRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Inventory Card                                                     */
/* ================================================================== */

function InventoryCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CostumeInventoryItem
  onEdit: (item: CostumeInventoryItem) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const st = STATUS_COLORS[item.status]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all group relative">
      {/* Portrait image (fashion magazine aspect ratio) */}
      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className={`${st.bg} ${st.text} text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>{st.label}</span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex flex-wrap gap-1">
            {item.vibeTags.slice(0, 3).map((t) => (
              <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
        {/* Menu */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute top-8 right-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]" onMouseLeave={() => setMenuOpen(false)}>
            <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button onClick={() => { onDelete(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{ITEM_TYPES[item.type]} {item.brand ? `/ ${item.brand}` : ""}</p>
        {item.size && <p className="text-[10px] text-gray-400 mt-0.5">Size: {item.size}</p>}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Inventory List Row                                                 */
/* ================================================================== */

function InventoryListRow({ item, onEdit, onDelete }: { item: CostumeInventoryItem; onEdit: (i: CostumeInventoryItem) => void; onDelete: (id: string) => void }) {
  const st = STATUS_COLORS[item.status]
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-rose-200 transition-colors">
      <div className="w-10 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-gray-300" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-[10px] text-gray-500">{ITEM_TYPES[item.type]} {item.brand ? `/ ${item.brand}` : ""} {item.size ? `/ ${item.size}` : ""}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.vibeTags.slice(0, 2).map((t) => (
          <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-medium px-1.5 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <span className={`${st.bg} ${st.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>{st.label}</span>
      <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  )
}

/* ================================================================== */
/*  LOOKS TAB                                                          */
/* ================================================================== */

function LooksTab({
  looks,
  inventory,
  characters,
  selectedCharacterId,
  onNewLook,
  onEditLook,
  onDeleteLook,
  allergyWarnings,
}: {
  looks: CostumeLook[]
  inventory: CostumeInventoryItem[]
  characters: Character[]
  selectedCharacterId: string | null
  onNewLook: () => void
  onEditLook: (l: CostumeLook) => void
  onDeleteLook: (id: string) => void
  allergyWarnings: (characterId: string, itemIds: string[]) => string[]
}) {
  const filtered = selectedCharacterId ? looks.filter((l) => l.characterId === selectedCharacterId) : looks

  const groupedByCharacter: Record<string, CostumeLook[]> = {}
  for (const l of filtered) {
    if (!groupedByCharacter[l.characterId]) groupedByCharacter[l.characterId] = []
    groupedByCharacter[l.characterId].push(l)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filtered.length}</span> look{filtered.length !== 1 ? "s" : ""} defined
        </p>
        <button onClick={onNewLook} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
          <Plus className="w-4 h-4" /> New Look
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {Object.keys(groupedByCharacter).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Palette className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No looks created yet</p>
            <p className="text-gray-400 text-xs mt-1">Create looks by combining wardrobe items for each character</p>
            <button onClick={onNewLook} className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">Create First Look</button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCharacter).map(([charId, charLooks]) => {
              const ch = characters.find((c) => c.id === charId)
              const castActor = ch ? getCastActorForCharacter(ch) : null
              return (
                <div key={charId}>
                  <div className="flex items-center gap-3 mb-4">
                    {castActor?.headshots?.[0] ? (
                      <img src={castActor.headshots[0]} alt="" className="w-8 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-gray-200 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ch?.name ?? "Unknown"}</p>
                      {castActor && <p className="text-[10px] text-gray-500">{castActor.name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {charLooks.map((look) => {
                      const warnings = allergyWarnings(look.characterId, look.itemIds)
                      return (
                        <div key={look.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                          {/* Item thumbnails strip */}
                          <div className="flex h-28 bg-gray-50">
                            {look.itemIds.slice(0, 4).map((iid) => {
                              const item = inventory.find((i) => i.id === iid)
                              return (
                                <div key={iid} className="flex-1 border-r border-gray-200 last:border-r-0">
                                  {item?.imageUrl ? (
                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-gray-300" /></div>
                                  )}
                                </div>
                              )
                            })}
                            {look.itemIds.length === 0 && (
                              <div className="w-full flex items-center justify-center text-gray-400 text-xs">No items</div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{look.name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Change {look.changeNumber} &middot; {look.sceneNumbers.join(", ") || "No scenes"}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => onEditLook(look)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDeleteLook(look.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            {look.continuityNotes && (
                              <p className="text-[10px] text-gray-600 mt-2 bg-amber-50 rounded p-1.5 border border-amber-100">{look.continuityNotes}</p>
                            )}
                            {warnings.length > 0 && (
                              <div className="mt-2 bg-red-50 rounded p-1.5 border border-red-100 flex items-start gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  {warnings.map((w, i) => (
                                    <p key={i} className="text-[10px] text-red-700">{w}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  CROSS-PLOT TAB                                                     */
/* ================================================================== */

function CrossPlotTab({
  looks,
  characters,
  selectedCharacterId,
  inventory,
}: {
  looks: CostumeLook[]
  characters: Character[]
  selectedCharacterId: string | null
  inventory: CostumeInventoryItem[]
}) {
  const displayChars = selectedCharacterId ? characters.filter((c) => c.id === selectedCharacterId) : characters

  // Gather all scene numbers from looks
  const allScenes = Array.from(new Set(looks.flatMap((l) => l.sceneNumbers))).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0
    return numA - numB
  })

  if (allScenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LayoutGrid className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm font-medium">No scene data yet</p>
        <p className="text-gray-400 text-xs mt-1">Create Looks with scene numbers to populate the cross-plot</p>
      </div>
    )
  }

  // Build matrix lookup
  const matrix: Record<string, Record<string, CostumeLook | null>> = {}
  for (const scene of allScenes) {
    matrix[scene] = {}
    for (const ch of displayChars) {
      matrix[scene][ch.id] = looks.find((l) => l.characterId === ch.id && l.sceneNumbers.includes(scene)) ?? null
    }
  }

  // Detect quick changes: sequential scenes where same character has different looks
  const quickChanges = new Set<string>()
  for (let i = 1; i < allScenes.length; i++) {
    for (const ch of displayChars) {
      const prev = matrix[allScenes[i - 1]][ch.id]
      const curr = matrix[allScenes[i]][ch.id]
      if (prev && curr && prev.id !== curr.id) {
        quickChanges.add(`${allScenes[i]}-${ch.id}`)
      }
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="min-w-max">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-r border-gray-300 min-w-[100px]">Scene</th>
              {displayChars.map((ch) => {
                const castActor = getCastActorForCharacter(ch)
                return (
                  <th key={ch.id} className="px-4 py-2 border-b border-gray-300 min-w-[140px] bg-gray-100">
                    <p className="text-xs font-semibold text-gray-900">{ch.name}</p>
                    {castActor && <p className="text-[10px] text-gray-500 font-normal">{castActor.name}</p>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {allScenes.map((scene) => (
              <tr key={scene} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 text-xs font-medium text-gray-700 border-b border-r border-gray-200">{scene}</td>
                {displayChars.map((ch) => {
                  const look = matrix[scene][ch.id]
                  const isQuick = quickChanges.has(`${scene}-${ch.id}`)
                  return (
                    <td key={ch.id} className={`px-3 py-2 border-b border-gray-200 ${isQuick ? "bg-amber-50" : ""}`}>
                      {look ? (
                        <div className={`rounded-lg px-2 py-1.5 text-xs ${isQuick ? "border-2 border-amber-400 bg-amber-100" : "bg-rose-50 border border-rose-200"}`}>
                          <p className="font-semibold text-gray-900">{look.name}</p>
                          <p className="text-gray-500 text-[10px]">Chg {look.changeNumber}</p>
                          {isQuick && (
                            <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold text-amber-700">
                              <AlertTriangle className="w-3 h-3" /> Quick Change
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHOPPING TAB                                                       */
/* ================================================================== */

const SHOPPING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested: { bg: "bg-gray-100", text: "text-gray-700" },
  approved: { bg: "bg-blue-100", text: "text-blue-700" },
  ordered: { bg: "bg-amber-100", text: "text-amber-700" },
  received: { bg: "bg-emerald-100", text: "text-emerald-700" },
}

function ShoppingTab({
  shoppingList,
  characters,
  onAdd,
  onUpdateStatus,
  onDelete,
}: {
  shoppingList: CostumeShoppingItem[]
  characters: Character[]
  onAdd: () => void
  onUpdateStatus: (id: string, status: CostumeShoppingItem["status"]) => void
  onDelete: (id: string) => void
}) {
  // Group by vendor
  const grouped: Record<string, CostumeShoppingItem[]> = {}
  for (const item of shoppingList) {
    const vendor = item.vendor || "Unassigned"
    if (!grouped[vendor]) grouped[vendor] = []
    grouped[vendor].push(item)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">Purchase Orders</p>
          <p className="text-xs text-gray-500">Grouped by vendor for easy procurement</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Request
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">Shopping list is empty</p>
            <p className="text-gray-400 text-xs mt-1">Add items that need to be purchased or rented</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([vendor, items]) => (
              <div key={vendor} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">{vendor}</span>
                    <span className="text-xs text-gray-500">({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    Est. Total: ${items.reduce((sum, i) => sum + (parseFloat(i.estimatedPrice.replace(/[^0-9.]/g, "")) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const ch = characters.find((c) => c.id === item.characterId)
                    const s = SHOPPING_STATUS_COLORS[item.status] ?? SHOPPING_STATUS_COLORS.requested
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="text-[10px] text-gray-500">
                            {ch ? `For: ${ch.name}` : ""} {item.estimatedPrice ? `/ ${item.estimatedPrice}` : ""}
                          </p>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as CostumeShoppingItem["status"])}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 ${s.bg} ${s.text} cursor-pointer`}
                        >
                          <option value="requested">Requested</option>
                          <option value="approved">Approved</option>
                          <option value="ordered">Ordered</option>
                          <option value="received">Received</option>
                        </select>
                        <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  ADD/EDIT INVENTORY ITEM MODAL                                      */
/* ================================================================== */

function AddItemModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void
  onSave: (item: Omit<CostumeInventoryItem, "id">) => void
  initial?: CostumeInventoryItem
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState<CostumeItemType>(initial?.type ?? "costume-piece")
  const [status, setStatus] = useState<CostumeItemStatus>(initial?.status ?? "in-stock")
  const [brand, setBrand] = useState(initial?.brand ?? "")
  const [size, setSize] = useState(initial?.size ?? "")
  const [price, setPrice] = useState(initial?.purchasePrice ?? "")
  const [vendor, setVendor] = useState(initial?.vendor ?? "")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [vibeTags, setVibeTags] = useState<string[]>(initial?.vibeTags ?? [])
  const [returnDate, setReturnDate] = useState(initial?.rentReturnDate ?? "")

  const imgInputRef = useRef<HTMLInputElement>(null)

  const handleImgUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name,
      type,
      status,
      brand,
      size,
      purchasePrice: price,
      vendor,
      imageUrl,
      vibeTags,
      notes,
      rentReturnDate: status === "rented" ? returnDate : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{initial ? "Edit Item" : "Add Item"}</h2>
              <p className="text-xs text-gray-500">Register an item with the wardrobe inventory</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Image upload */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-1 space-y-3">
              <FloatingInput label="Name" value={name} onChange={setName} />
              <div className="grid grid-cols-2 gap-3">
                <FloatingSelect label="Type" value={type} onChange={(v) => setType(v as CostumeItemType)} options={Object.entries(ITEM_TYPES).map(([k, v]) => ({ value: k, label: v }))} />
                <FloatingSelect label="Status" value={status} onChange={(v) => setStatus(v as CostumeItemStatus)} options={Object.entries(STATUS_COLORS).map(([k, v]) => ({ value: k, label: v.label }))} />
              </div>
            </div>
            <button
              onClick={() => imgInputRef.current?.click()}
              className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-rose-300 transition-colors flex flex-col items-center justify-center overflow-hidden shrink-0"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[9px] text-gray-400">Upload</span>
                </>
              )}
            </button>
            <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImgUpload(e.target.files[0]) }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Brand" value={brand} onChange={setBrand} />
            <FloatingInput label="Size" value={size} onChange={setSize} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Purchase Price" value={price} onChange={setPrice} />
            <FloatingInput label="Vendor" value={vendor} onChange={setVendor} />
          </div>

          {status === "rented" && (
            <div className="mb-4">
              <FloatingInput label="Return Date" value={returnDate} onChange={setReturnDate} type="date" />
            </div>
          )}

          {/* Vibe tags */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Vibe Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setVibeTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                  className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${vibeTags.includes(tag) ? "bg-rose-100 text-rose-700 border border-rose-300" : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 resize-none" />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={!name.trim()} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors">
              {initial ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  LOOK BUILDER MODAL                                                 */
/* ================================================================== */

function LookBuilderModal({
  onClose,
  onSave,
  initial,
  characters,
  inventory,
  allergyWarnings,
}: {
  onClose: () => void
  onSave: (look: CostumeLook) => void
  initial: CostumeLook | null
  characters: Character[]
  inventory: CostumeInventoryItem[]
  allergyWarnings: (characterId: string, itemIds: string[]) => string[]
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [characterId, setCharacterId] = useState(initial?.characterId ?? (characters[0]?.id ?? ""))
  const [changeNumber, setChangeNumber] = useState(initial?.changeNumber ?? "1")
  const [scriptDays, setScriptDays] = useState(initial?.scriptDays?.join(", ") ?? "")
  const [sceneNumbers, setSceneNumbers] = useState(initial?.sceneNumbers?.join(", ") ?? "")
  const [continuityNotes, setContinuityNotes] = useState(initial?.continuityNotes ?? "")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(initial?.itemIds ?? [])
  const [searchInv, setSearchInv] = useState("")

  const warnings = allergyWarnings(characterId, selectedItemIds)

  const filteredInv = inventory.filter((i) => {
    if (searchInv) {
      const s = searchInv.toLowerCase()
      return i.name.toLowerCase().includes(s) || i.vibeTags.some((t) => t.toLowerCase().includes(s))
    }
    return true
  })

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSave = () => {
    if (!name.trim() || !characterId) return
    onSave({
      id: initial?.id ?? uid(),
      name,
      characterId,
      changeNumber,
      scriptDays: scriptDays
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sceneNumbers: sceneNumbers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      itemIds: selectedItemIds,
      continuityNotes,
      referencePhotos: initial?.referencePhotos ?? [],
      matchPhotos: initial?.matchPhotos ?? [],
    })
  }

  const selectedChar = characters.find((c) => c.id === characterId)
  const castActor = selectedChar ? getCastActorForCharacter(selectedChar) : null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{initial ? "Edit Look" : "New Look"}</h2>
            <p className="text-xs text-gray-500">Combine wardrobe items into a character look</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Look Name" value={name} onChange={setName} />
            <FloatingSelect
              label="Character"
              value={characterId}
              onChange={setCharacterId}
              options={characters.map((c) => {
                const ca = getCastActorForCharacter(c)
                return { value: c.id, label: `${c.name}${ca ? ` (${ca.name})` : ""}` }
              })}
            />
          </div>

          {castActor && (
            <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-lg px-3 py-2">
              {castActor.headshots?.[0] ? (
                <img src={castActor.headshots[0]} alt="" className="w-6 h-8 rounded object-cover" />
              ) : (
                <div className="w-6 h-8 rounded bg-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
              )}
              <span className="text-xs text-gray-600">Cast: <strong>{castActor.name}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <FloatingInput label="Change #" value={changeNumber} onChange={setChangeNumber} />
            <FloatingInput label="Script Days (comma-sep)" value={scriptDays} onChange={setScriptDays} />
            <FloatingInput label="Scene Numbers (comma-sep)" value={sceneNumbers} onChange={setSceneNumbers} />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Continuity Notes</label>
            <textarea value={continuityNotes} onChange={(e) => setContinuityNotes(e.target.value)} rows={2} placeholder="Top button undone, mud on left boot..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 resize-none" />
          </div>

          {/* Allergy warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 bg-red-50 rounded-xl p-3 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800 mb-1">Allergy Warning</p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-red-700">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Item picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Select Items ({selectedItemIds.length} chosen)</p>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={searchInv} onChange={(e) => setSearchInv(e.target.value)} placeholder="Search inventory..." className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-rose-300" />
              </div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 max-h-52 overflow-y-auto">
              {filteredInv.map((item) => {
                const isSelected = selectedItemIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`rounded-lg border-2 overflow-hidden transition-all text-left ${isSelected ? "border-rose-500 ring-2 ring-rose-200" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-gray-300" /></div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-gray-800 p-1.5 truncate">{item.name}</p>
                  </button>
                )
              })}
              {filteredInv.length === 0 && (
                <p className="col-span-full text-center text-xs text-gray-400 py-8">No items found. Add items in the Wardrobe tab first.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !characterId} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors">
            {initial ? "Save Look" : "Create Look"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  ACTOR SPECS MODAL                                                  */
/* ================================================================== */

function ActorSpecsModal({
  actorId,
  characters,
  specs,
  onClose,
  onSave,
}: {
  actorId: string
  characters: Character[]
  specs?: { measurements: ActorMeasurements; hmuSpecs: ActorHMUSpecs }
  onClose: () => void
  onSave: (m: ActorMeasurements, h: ActorHMUSpecs) => void
}) {
  // Find actor across all characters
  let actorName = "Unknown"
  let characterName = ""
  for (const ch of characters) {
    const all = getAllActorsForCharacter(ch)
    const a = all.find((a) => a.id === actorId)
    if (a) {
      actorName = a.name
      characterName = ch.name
      break
    }
  }

  const [chest, setChest] = useState(specs?.measurements?.chest ?? "")
  const [waist, setWaist] = useState(specs?.measurements?.waist ?? "")
  const [inseam, setInseam] = useState(specs?.measurements?.inseam ?? "")
  const [hat, setHat] = useState(specs?.measurements?.hat ?? "")
  const [ring, setRing] = useState(specs?.measurements?.ring ?? "")
  const [glove, setGlove] = useState(specs?.measurements?.glove ?? "")
  const [shoe, setShoe] = useState(specs?.measurements?.shoe ?? "")

  const [skinTone, setSkinTone] = useState(specs?.hmuSpecs?.skinToneCode ?? "")
  const [hairType, setHairType] = useState(specs?.hmuSpecs?.hairType ?? "")
  const [hairColor, setHairColor] = useState(specs?.hmuSpecs?.hairColor ?? "")
  const [allergies, setAllergies] = useState(specs?.hmuSpecs?.allergies?.join(", ") ?? "")
  const [tattoos, setTattoos] = useState(
    specs?.hmuSpecs?.tattoos?.map((t) => `${t.location}${t.coverUpNeeded ? " (cover-up)" : ""}`).join(", ") ?? "",
  )

  const handleSave = () => {
    onSave(
      { chest, waist, inseam, hat, ring, glove, shoe },
      {
        skinToneCode: skinTone,
        hairType,
        hairColor,
        allergies: allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tattoos: tattoos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((t) => ({
            location: t.replace(" (cover-up)", ""),
            coverUpNeeded: t.includes("(cover-up)"),
          })),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">{actorName}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-xs text-gray-500 mb-5">Measurements & HMU specs{characterName ? ` (as ${characterName})` : ""}</p>

          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> Measurements</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <FloatingInput label="Chest" value={chest} onChange={setChest} />
            <FloatingInput label="Waist" value={waist} onChange={setWaist} />
            <FloatingInput label="Inseam" value={inseam} onChange={setInseam} />
            <FloatingInput label="Hat" value={hat} onChange={setHat} />
            <FloatingInput label="Ring" value={ring} onChange={setRing} />
            <FloatingInput label="Glove" value={glove} onChange={setGlove} />
            <FloatingInput label="Shoe" value={shoe} onChange={setShoe} />
          </div>

          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> HMU Specifics</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Skin Tone (Pantone/MAC)" value={skinTone} onChange={setSkinTone} />
            <FloatingInput label="Hair Type" value={hairType} onChange={setHairType} />
            <FloatingInput label="Hair Color" value={hairColor} onChange={setHairColor} />
          </div>

          <div className="space-y-3 mb-5">
            <FloatingInput label="Allergies (comma-separated)" value={allergies} onChange={setAllergies} />
            <FloatingInput label="Tattoos (comma-sep, add '(cover-up)' if needed)" value={tattoos} onChange={setTattoos} />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors">Save Specs</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHOPPING FORM MODAL                                                */
/* ================================================================== */

function ShoppingFormModal({
  characters,
  onClose,
  onSave,
}: {
  characters: Character[]
  onClose: () => void
  onSave: (item: Omit<CostumeShoppingItem, "id">) => void
}) {
  const [description, setDescription] = useState("")
  const [vendor, setVendor] = useState("")
  const [price, setPrice] = useState("")
  const [charId, setCharId] = useState("")

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Add Shopping Request</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3 mb-5">
            <FloatingInput label="Description" value={description} onChange={setDescription} />
            <FloatingInput label="Vendor" value={vendor} onChange={setVendor} />
            <FloatingInput label="Estimated Price" value={price} onChange={setPrice} />
            <FloatingSelect
              label="For Character (optional)"
              value={charId}
              onChange={setCharId}
              options={[{ value: "", label: "None" }, ...characters.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!description.trim()) return
                onSave({
                  description,
                  vendor,
                  estimatedPrice: price,
                  status: "requested",
                  requestedBy: "Current User",
                  characterId: charId || undefined,
                })
              }}
              disabled={!description.trim()}
              className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors"
            >
              Add Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHARED UI PRIMITIVES                                               */
/* ================================================================== */

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
      />
    </div>
  )
}

function FloatingSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none z-[1]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
