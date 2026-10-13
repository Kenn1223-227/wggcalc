"use client"

import { Braces, ChevronLeft, ChevronRight, Search, Table2 } from "lucide-react"
import { useMemo, useState } from "react"
import { allEntries, formatStat, formatStatName, gameData, rawStatSummary, slots, type Slot } from "@/lib/game-data"

const pageSize = 15
const slotOptions = ["All records", ...slots]

export function DatabaseBrowser() {
  const [search, setSearch] = useState("")
  const [slot, setSlot] = useState("All records")
  const [category, setCategory] = useState("All classes")
  const [view, setView] = useState<"table" | "json">("table")
  const [page, setPage] = useState(0)
  const categories = useMemo(() => ["All classes", ...Object.keys(gameData.Categories.Primary), ...Object.keys(gameData.Categories.Secondary)], [])
  const records = useMemo(() => {
    const chosenSlots = slot === "All records" ? slots : [slot as Slot]
    const query = search.trim().toLocaleLowerCase()
    return chosenSlots.flatMap((key) => allEntries[key].map(({ item }) => ({ slot: key, item })))
      .filter(({ item }) => category === "All classes" || item.Category === category)
      .filter(({ item, slot: recordSlot }) => !query || `${item.Name} ${item.Category} ${item.Price_Type} ${recordSlot} ${rawStatSummary(item)}`.toLocaleLowerCase().includes(query))
  }, [category, search, slot])
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRecords = records.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  function updateSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  function updateSlot(value: string) {
    setSlot(value)
    setPage(0)
  }

  function updateCategory(value: string) {
    setCategory(value)
    setPage(0)
  }

  return (
    <section id="database" className="scroll-mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/55">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400">DATA EXPLORER / v1.0</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Cơ sở dữ liệu</h2>
          <p className="mt-1 text-xs text-slate-500">Tra cứu thông số gốc của {records.length.toLocaleString("vi-VN")} bản ghi.</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-slate-800 bg-slate-950 p-1 lg:self-auto" aria-label="Chế độ hiển thị">
          <button type="button" onClick={() => setView("table")} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition ${view === "table" ? "bg-slate-800 text-cyan-300" : "text-slate-500 hover:text-slate-200"}`} aria-pressed={view === "table"}>
            <Table2 className="size-3.5" aria-hidden="true" /> Bảng
          </button>
          <button type="button" onClick={() => setView("json")} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition ${view === "json" ? "bg-slate-800 text-cyan-300" : "text-slate-500 hover:text-slate-200"}`} aria-pressed={view === "json"}>
            <Braces className="size-3.5" aria-hidden="true" /> JSON
          </button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-800 p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px] sm:p-5">
        <label className="relative block">
          <span className="sr-only">Tìm trong dữ liệu</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Tìm vũ khí hoặc chỉ số..." className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60" />
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] text-slate-500">
          Nhóm phụ kiện
          <select value={slot} onChange={(event) => updateSlot(event.target.value)} className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500/60">
            {slotOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] text-slate-500">
          Lớp súng
          <select value={category} onChange={(event) => updateCategory(event.target.value)} className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500/60">
            {categories.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-3">Tên</th><th className="px-4 py-3">Slot</th><th className="px-4 py-3">Lớp</th><th className="px-4 py-3">Giá</th><th className="px-5 py-3">Thông số</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map(({ slot: recordSlot, item }, index) => (
                <tr key={`${recordSlot}-${item.Name}-${currentPage}-${index}`} className="border-b border-slate-800/60 text-xs last:border-0 hover:bg-slate-800/30">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-200">{item.Name}</td>
                  <td className="px-4 py-3 text-slate-400">{recordSlot}</td>
                  <td className="px-4 py-3"><span className="rounded-full border border-slate-700 px-2 py-1 font-mono text-[10px] text-cyan-300">{item.Category}</span></td>
                  <td className="px-4 py-3 text-slate-500">{item.Price_Type || "—"}</td>
                  <td className="max-w-[380px] truncate px-5 py-3 text-slate-500">{rawStatSummary(item)}</td>
                </tr>
              ))}
              {!pageRecords.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-500">Không tìm thấy bản ghi phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <pre className="max-h-[570px] overflow-auto p-4 text-[11px] leading-6 text-cyan-100/80 sm:p-6"><code>{JSON.stringify(pageRecords.map(({ slot: recordSlot, item }) => ({ slot: recordSlot, ...item })), null, 2)}</code></pre>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-[11px] text-slate-500">Hiển thị <span className="font-mono text-slate-300">{records.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, records.length)}</span> trên {records.length.toLocaleString("vi-VN")}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} aria-label="Trang trước" className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" /></button>
          <span className="min-w-16 text-center font-mono text-[10px] text-slate-500">{currentPage + 1} / {pageCount}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} aria-label="Trang tiếp" className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  )
}

export function formatDatabaseValue(key: string, value: unknown) {
  return `${formatStatName(key)}: ${formatStat(value)}`
}
