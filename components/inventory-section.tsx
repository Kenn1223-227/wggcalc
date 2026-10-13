"use client"

import { Check, ChevronDown, Crosshair, Search } from "lucide-react"
import { useState } from "react"
import { formatPrice, type PartEntry, type Slot } from "@/lib/game-data"

const slotMeta: Record<Slot, { subtitle: string; number: string }> = {
  Cores: { subtitle: "Nền tảng vũ khí", number: "01" },
  Barrels: { subtitle: "Tầm bắn · sát thương", number: "02" },
  Grips: { subtitle: "Độ giật · ổn định", number: "03" },
  Magazines: { subtitle: "Băng đạn · nạp đạn", number: "04" },
  Stocks: { subtitle: "Di chuyển · kiểm soát", number: "05" },
}

export function InventorySection({
  slot,
  entries,
  selected,
  query,
  onToggle,
  onSelectAll,
}: {
  slot: Slot
  entries: PartEntry[]
  selected: Set<string>
  query: string
  onToggle: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  // State quản lý thanh tìm kiếm riêng biệt cho từng cột
  const [slotSearch, setSlotSearch] = useState("")

  // Kết hợp tìm kiếm chung của toàn trang và tìm kiếm riêng theo từng cột
  const normalizedGlobalQuery = query.trim().toLocaleLowerCase()
  const normalizedSlotQuery = slotSearch.trim().toLocaleLowerCase()

  const visibleEntries = entries.filter(({ item }) => {
    const textToSearch = `${item.Name} ${item.Price_Type || ""}`.toLocaleLowerCase()
    const matchesGlobal = !normalizedGlobalQuery || textToSearch.includes(normalizedGlobalQuery)
    const matchesSlot = !normalizedSlotQuery || textToSearch.includes(normalizedSlotQuery)
    return matchesGlobal && matchesSlot
  })

  const visibleLimit = expanded ? visibleEntries.length : 8
  const visible = visibleEntries.slice(0, visibleLimit)
  const allSelected = entries.length > 0 && entries.every(({ id }) => selected.has(id))
  const selectedCount = entries.filter(({ id }) => selected.has(id)).length

  return (
    <section className="inventory-card flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.18em] text-slate-500">{slotMeta[slot].number}</span>
            <h3 className="truncate text-sm font-semibold text-slate-100">{slot}</h3>
          </div>
          <p className="mt-1 truncate text-[11px] text-slate-500">{slotMeta[slot].subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelectAll(entries.map(({ id }) => id), !allSelected)}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-emerald-300 transition hover:bg-emerald-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label={`${allSelected ? "Bỏ chọn" : "Chọn"} tất cả ${slot}`}
        >
          {allSelected ? "Bỏ chọn" : "Chọn hết"}
        </button>
      </div>

      {/* Thanh tìm kiếm nhỏ ngay dưới tên cột bộ phận */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            value={slotSearch}
            onChange={(e) => {
              setSlotSearch(e.target.value)
              setExpanded(true) // Tự động mở rộng danh sách khi người dùng gõ tìm kiếm trong cột
            }}
            placeholder={`Tìm trong ${slot.toLowerCase()}...`}
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2.5 text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/60"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 text-[10px]">
        <span className="font-mono text-slate-500">KHO ĐỒ</span>
        <span className="font-mono text-slate-400"><strong className="text-emerald-300">{selectedCount}</strong> / {entries.length}</span>
      </div>

      <div className="inventory-list mt-2 flex flex-col gap-0.5 px-2 pb-2">
        {visible.length ? visible.map(({ id, item }) => {
          const checked = selected.has(id)
          return (
            <div
              key={id}
              onClick={() => onToggle(id)}
              className={`group flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 transition ${
                checked ? "bg-emerald-400/[0.055]" : "hover:bg-slate-800/70"
              }`}
            >
              <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition ${
                checked ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-600 bg-slate-950 group-hover:border-slate-400"
              }`}>
                {checked && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-xs ${checked ? "text-slate-100" : "text-slate-400"}`}>{item.Name}</span>
                  <span className="shrink-0 font-mono text-[9px] text-slate-600">{formatPrice(item.Price_Type)}</span>
                </span>
              </span>
            </div>
          )
        }) : (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center text-slate-500">
            <Crosshair className="size-4" aria-hidden="true" />
            <span className="text-[11px]">Không có món phù hợp</span>
          </div>
        )}
      </div>

      {visibleEntries.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center justify-center gap-1 border-t border-slate-800/80 px-3 py-2.5 text-[10px] text-slate-400 transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {expanded ? "Thu gọn" : `Xem thêm ${visibleEntries.length - 8}`}
          <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}