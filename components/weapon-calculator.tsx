"use client"

import { Activity, AlertTriangle, ArrowDown, ArrowRight, Boxes, Check, ChevronDown, CircleHelp, Crosshair, Database, Gauge, Heart, Radar, Scan, Search, Shield, SlidersHorizontal, Sparkles, Target, Timer, Wind, Zap } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { DatabaseBrowser } from "@/components/database-browser"
import { InventorySection } from "@/components/inventory-section"
import { MetaBuilds } from "@/components/meta-builds"
import { allEntries, attachmentSlots, getEntries, getInventoryDefaults, slots, type AttachmentSlot, type PartEntry, type Slot } from "@/lib/game-data"
import { optimizeBuild, playStyles, styleLabel, type OptimizedBuild, type PlayStyle } from "@/lib/optimizer"

const tabs = [
  { id: "calculator", label: "Auto Calc", icon: SlidersHorizontal },
  { id: "meta", label: "Meta Builds", icon: Zap },
  { id: "database", label: "Database", icon: Database },
] as const

type TabId = (typeof tabs)[number]["id"]
const classes = ["AR", "Sniper", "SMG", "Shotgun", "LMG", "BR", "Weird", "Sidearm"]

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-slate-500">{label}</span>
      <span className="relative">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-3.5 pr-9 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10">{children}</select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </span>
    </label>
  )
}

function StatCard({ label, value, unit, icon: Icon, quality, bar, subtitle }: { label: string; value: string; unit: string; icon: typeof Crosshair; quality: "good" | "neutral" | "cyan"; bar: number; subtitle: string }) {
  const color = quality === "good" ? "text-emerald-300" : quality === "cyan" ? "text-cyan-300" : "text-slate-100"
  const barColor = quality === "good" ? "bg-emerald-400" : quality === "cyan" ? "bg-cyan-400" : "bg-slate-500"
  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">{label}</span>
        <Icon className={`size-3.5 ${color}`} aria-hidden="true" />
      </div>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${color}`}>{value}<span className="ml-1 text-[10px] font-normal text-slate-500">{unit}</span></p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(5, Math.min(100, bar))}%` }} /></div>
      <p className="mt-2 text-[10px] text-slate-600">{subtitle}</p>
    </div>
  )
}

function ResultPanel({ result, core, style }: { result: OptimizedBuild; core: PartEntry; style: PlayStyle }) {
  const { stats } = result
  
  const rows = [
    { label: "Damage", value: stats.bodyDamage.toFixed(1), unit: "body", icon: Target, quality: "good" as const, percent: Math.min(100, stats.bodyDamage * 2.6), modifier: result.stats.modifiers.Damage },
    { label: "Fire rate", value: Math.round(stats.fireRate).toLocaleString("vi-VN"), unit: "RPM", icon: Zap, quality: "cyan" as const, percent: Math.min(100, stats.fireRate / 12), modifier: result.stats.modifiers.Fire_Rate },
    { label: "Recoil (Aim)", value: stats.recoil.toFixed(1), unit: "avg", icon: Activity, quality: "good" as const, percent: Math.max(6, 100 - stats.recoil * 2), modifier: result.stats.modifiers.Recoil, inverse: true },
    { label: "Recoil (Hip)", value: stats.recoilHipfire.toFixed(1), unit: "avg", icon: Activity, quality: "neutral" as const, percent: Math.max(6, 100 - stats.recoilHipfire * 2), modifier: result.stats.modifiers.Recoil_Hipfire, inverse: true },
    { label: "Magazine", value: Math.round(stats.magazine).toString(), unit: "rounds", icon: Boxes, quality: "neutral" as const, percent: Math.min(100, stats.magazine * 1.8), modifier: result.stats.modifiers.Magazine_Cap },
    { label: "Reload", value: `${stats.reloadTime.toFixed(1)}s`, unit: "sec", icon: Timer, quality: "cyan" as const, percent: Math.max(6, 100 - stats.reloadTime * 20), modifier: result.stats.modifiers.Reload_Time, inverse: true },
    { label: "Aim time", value: `${stats.aimTime.toFixed(2)}s`, unit: "ADS", icon: Crosshair, quality: "cyan" as const, percent: Math.max(6, 100 - stats.aimTime * 95), modifier: result.stats.modifiers.Time_To_Aim, inverse: true },
    { label: "Equip time", value: `${stats.equipTime.toFixed(2)}s`, unit: "sec", icon: Zap, quality: "neutral" as const, percent: Math.max(6, 100 - stats.equipTime * 95), modifier: result.stats.modifiers.Equip_Time, inverse: true },
    { label: "Movement", value: `${stats.movementSpeed > 0 ? '+' : ''}${stats.movementSpeed.toFixed(1)}`, unit: "%", icon: Wind, quality: "good" as const, percent: Math.min(100, Math.max(5, 50 + stats.movementSpeed * 3)), modifier: result.stats.modifiers.Movement_Speed },
    { label: "Health", value: `${stats.health > 0 ? '+' : ''}${stats.health.toFixed(1)}`, unit: "%", icon: Heart, quality: "good" as const, percent: Math.min(100, Math.max(5, 50 + stats.health * 3)), modifier: result.stats.modifiers.Health },
    { label: "Max spread", value: `${stats.maxSpread.toFixed(1)}°`, unit: "deg", icon: Scan, quality: "neutral" as const, percent: Math.max(6, 100 - stats.maxSpread * 10), modifier: result.stats.modifiers.Max_Spread, inverse: true },
    { label: "ADS spread", value: `${stats.adsMaxSpread.toFixed(2)}°`, unit: "deg", icon: Target, quality: "cyan" as const, percent: Math.max(6, 100 - stats.adsMaxSpread * 50), modifier: result.stats.modifiers.ADS_Spread, inverse: true },
  ]
  
  const selectedParts = attachmentSlots.map((slot) => ({ slot, part: result.parts[slot] }))

  return (
    <section id="results" aria-live="polite" className="scroll-mt-24 overflow-hidden rounded-2xl border border-emerald-400/25 bg-slate-900/65 shadow-[0_0_55px_rgba(16,185,129,0.045)]">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Sparkles className="size-4" aria-hidden="true" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-slate-100">Build tối ưu tốt nhất</h2><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] text-emerald-300">{result.score.toFixed(1)} PTS</span></div>
            <p className="mt-1 text-[11px] text-slate-500">[{core.item.Category}] {core.item.Name} · {styleLabel(style)} · {result.combinationsEvaluated.toLocaleString("vi-VN")} tổ hợp đã kiểm tra</p>
          </div>
        </div>
        {result.wasShortlisted && <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1.5 text-[10px] text-cyan-300 sm:self-auto"><Radar className="size-3" aria-hidden="true" /> Sàng lọc {result.candidatesEvaluated.toLocaleString("vi-VN")} ứng viên</span>}
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-semibold tracking-[0.16em] text-slate-500">PHỤ KIỆN ĐƯỢC CHỌN</h3><span className="font-mono text-[9px] text-slate-600">4 SLOT</span></div>
          <div className="flex flex-col gap-2">
            {selectedParts.map(({ slot, part }, index) => (
              <div key={slot} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-[10px] text-slate-500">0{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">{slot}</p><p className="truncate text-xs font-medium text-slate-200">{part?.Name || "—"}</p></div>
                <Check className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5">
            <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">Core chiến thắng</span><span className="rounded-full bg-slate-800 px-2 py-1 font-mono text-[9px] text-cyan-300">{core.item.Category}</span></div>
            <p className="mt-1 text-sm font-medium text-slate-200">{core.item.Name}</p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-semibold tracking-[0.16em] text-slate-500">FINAL STATS CHUYÊN SÂU</h3><span className="font-mono text-[9px] text-slate-600">MODIFIER + MULTIPLIER</span></div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
            {rows.map(({ label, value, unit, icon, quality, percent, modifier, inverse }) => (
              <StatCard key={label} label={label} value={value} unit={unit} icon={icon} quality={quality} bar={percent} subtitle={`${typeof modifier === "number" && modifier >= 0 ? "+" : ""}${typeof modifier === "number" ? modifier.toFixed(1) : "0.0"}% modifier${inverse ? " · thấp hơn tốt hơn" : ""}`} />
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-slate-600">Chỉ số phụ kiện phần trăm được cộng gộp thành hệ số. Movement & Health được tính cộng trực tiếp.</p>
        </div>
      </div>
    </section>
  )
}

function EmptyResults({ ownedCount, canCalculate }: { ownedCount: number; canCalculate: boolean }) {
  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-5 py-10 text-center sm:py-12">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500"><Crosshair className="size-5" aria-hidden="true" /></span>
      <p className="mt-4 text-sm font-medium text-slate-200">Sẵn sàng tìm build của bạn</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Chọn các vũ khí và món đồ đang có trong kho, thiết lập phong cách chơi và chạy bộ tối ưu.</p>
      {!canCalculate && <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-amber-300"><AlertTriangle className="size-3.5" aria-hidden="true" /> Cần ít nhất một món trong mỗi slot phụ kiện tương thích.</p>}
      <span className="mt-4 font-mono text-[9px] tracking-[0.15em] text-slate-700">{ownedCount} ITEMS IN INVENTORY</span>
    </section>
  )
}

export function WeaponCalculator() {
  const [activeTab, setActiveTab] = useState<TabId>("calculator")
  const coreOptions = useMemo(() => allEntries.Cores, [])
  
  const [selectedCoreIds, setSelectedCoreIds] = useState<string[]>(() => coreOptions.map(c => c.id))
  const [style, setStyle] = useState<PlayStyle>("auto")
  const [inventory, setInventory] = useState(getInventoryDefaults)

  // 1. Tự động tải kho đồ đã lưu từ bộ nhớ trình duyệt khi người dùng quay lại web
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wggcalc-inventory")
      if (saved) {
        const parsed = JSON.parse(saved)
        // Chuyển đổi Array thành Set để code xử lý được
        const restored = Object.fromEntries(
          Object.entries(parsed).map(([key, array]) => [key, new Set(array as string[])])
        ) as Record<Slot, Set<string>>
        setInventory(restored)
      }
    } catch (error) {
      console.error("Lỗi khi tải kho đồ:", error)
    }
  }, [])

  // 2. Tự động lưu kho đồ vào trình duyệt mỗi khi người dùng thay đổi lựa chọn
  useEffect(() => {
    try {
      // Chuyển đổi Set thành Array để lưu thành chuỗi JSON
      const serializable = Object.fromEntries(
        Object.entries(inventory).map(([key, set]) => [key, Array.from(set as Set<string>)])
      )
      localStorage.setItem("wggcalc-inventory", JSON.stringify(serializable))
    } catch (error) {
      console.error("Lỗi khi lưu kho đồ:", error)
    }
  }, [inventory])

  const [search, setSearch] = useState("")
  const [result, setResult] = useState<OptimizedBuild | null>(null)
  const [winningCore, setWinningCore] = useState<PartEntry | null>(null)
  const [error, setError] = useState("")

  const selectedCores = useMemo(() => coreOptions.filter(c => selectedCoreIds.includes(c.id)), [coreOptions, selectedCoreIds])
  
  const entriesBySlot = useMemo(
    () => Object.fromEntries(slots.map((slot) => [slot, allEntries[slot]])) as Record<Slot, PartEntry[]>,
    []
  )

  const available = useMemo(() => Object.fromEntries(attachmentSlots.map((slot) => [slot, entriesBySlot[slot].filter(({ id }) => inventory[slot].has(id))])) as Record<AttachmentSlot, PartEntry[]>, [entriesBySlot, inventory])
  const ownedCount = attachmentSlots.reduce((total, slot) => total + available[slot].length, 0)
  const canCalculate = selectedCoreIds.length > 0 && attachmentSlots.every((slot) => available[slot].length > 0)

  useEffect(() => {
    setResult(null)
    setWinningCore(null)
    setError("")
  }, [selectedCoreIds, style, inventory])

  function toggleItem(slot: Slot, id: string) {
    setInventory((current) => {
      const selected = new Set(current[slot])
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      return { ...current, [slot]: selected }
    })
  }

  function setItems(ids: string[], checked: boolean) {
    setInventory((current) => {
      const next = { ...current }
      const matching = ids.map((id) => id.split(":")[0] as Slot)
      const perSlot = new Map<Slot, Set<string>>()
      matching.forEach((slot) => { if (!perSlot.has(slot)) perSlot.set(slot, new Set(current[slot])) })
      ids.forEach((id) => {
        const slot = id.split(":")[0] as Slot
        const set = perSlot.get(slot)
        if (checked) set?.add(id)
        else set?.delete(id)
      })
      perSlot.forEach((value, slot) => { next[slot] = value })
      return next
    })
  }

  function setAll(checked: boolean) {
    setInventory((current) => Object.fromEntries(slots.map((slot) => {
      const compatible = entriesBySlot[slot].map(({ id }) => id)
      const next = new Set(current[slot])
      compatible.forEach((id) => checked ? next.add(id) : next.delete(id))
      return [slot, next]
    })) as Record<Slot, Set<string>>)
  }

  function calculate() {
    if (selectedCoreIds.length === 0 || !canCalculate) {
      setResult(null)
      setWinningCore(null)
      setError("Chọn ít nhất một vũ khí và ít nhất một phụ kiện trong mỗi slot trước khi tính toán.")
      return
    }
    setError("")

    let bestOverallResult: OptimizedBuild | null = null
    let bestCore: PartEntry | null = null

    for (const coreId of selectedCoreIds) {
      const core = coreOptions.find(c => c.id === coreId)
      if (!core) continue

      const availForCore = Object.fromEntries(
        attachmentSlots.map(slot => [
          slot,
          allEntries[slot].filter(({ id }) => inventory[slot].has(id))
        ])
      ) as Record<AttachmentSlot, PartEntry[]>

      const isValid = attachmentSlots.every(slot => availForCore[slot].length > 0)
      if (!isValid) continue

      const currentResult = optimizeBuild(core.item, availForCore, style)

      if (!bestOverallResult || currentResult.score > bestOverallResult.score) {
        bestOverallResult = currentResult
        bestCore = core
      }
    }

    if (bestOverallResult && bestCore) {
      setResult(bestOverallResult)
      setWinningCore(bestCore)
    } else {
      setError("Không tìm thấy tổ hợp hợp lệ cho các vũ khí đã chọn (vui lòng kiểm tra lại kho phụ kiện tương thích).")
    }

    window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30)
  }

  function applyMetaBuild(core: PartEntry, nextStyle: PlayStyle) {
    setSelectedCoreIds([core.id])
    setStyle(nextStyle)
    setActiveTab("calculator")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_52%_-18%,rgba(6,78,59,0.24),transparent_50%)]" aria-hidden="true" />
      <div className="relative mx-auto min-h-screen max-w-[1520px] px-4 pb-10 sm:px-6 lg:px-9">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-800/80">
          <a href="#top" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label="WeirdGunGameCalc, về đầu trang">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"><Crosshair className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-tight text-slate-100">Weird<span className="text-emerald-400">Gun</span>GameCalc</span><span className="mt-0.5 block font-mono text-[9px] tracking-[0.12em] text-slate-600">WEAPON LAB · MULTI-WEAPON OPTIMIZER</span></span>
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 sm:flex"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" /><span className="font-mono text-[9px] tracking-[0.1em] text-slate-400">DATA SYNCED</span><span className="text-[9px] text-slate-700">·</span><span className="font-mono text-[9px] text-slate-500">{allEntries.Cores.length} CORES</span></div>
          <a href="#database" onClick={() => setActiveTab("database")} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[11px] text-slate-400 transition hover:border-slate-700 hover:text-slate-100"><Database className="size-3.5" aria-hidden="true" /><span className="hidden sm:inline">Database</span><ArrowRight className="size-3" aria-hidden="true" /></a>
        </header>

        <section id="top" className="pt-8 sm:pt-10">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" /> MULTI-WEAPON OPTIMIZATION SYSTEM <span className="text-slate-700">/ 03.0</span></div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-100 sm:text-4xl">Hệ thống phân tích sâu. <span className="text-slate-500">12 chỉ số cốt lõi.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Tối ưu hóa và quét tự động xuyên suốt nhiều loại vũ khí khác nhau dựa trên kho đồ và phong cách chơi của bạn.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[{ label: "WEAPON CORES", value: allEntries.Cores.length, icon: Crosshair }, { label: "ATTACHMENTS", value: attachmentSlots.reduce((count, slot) => count + allEntries[slot].length, 0), icon: Boxes }, { label: "BUILD SLOTS", value: "04", icon: Gauge }].map(({ label, value, icon: Icon }) => (
                <div key={label} className="min-w-0 rounded-xl border border-slate-800/80 bg-slate-900/45 px-3 py-3 sm:min-w-[112px] sm:px-4"><Icon className="size-3.5 text-cyan-400" aria-hidden="true" /><p className="mt-2 font-mono text-lg font-medium text-slate-100">{value}</p><p className="mt-0.5 truncate font-mono text-[8px] tracking-[0.1em] text-slate-600 sm:text-[9px]">{label}</p></div>
              ))}
            </div>
          </div>

          <nav aria-label="Chức năng chính" className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-800/90">
            {tabs.map(({ id, label, icon: Icon }, index) => {
              const active = activeTab === id
              return <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={active ? "page" : undefined} className={`relative flex shrink-0 items-center gap-2.5 px-4 py-3.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 sm:px-5 ${active ? "text-emerald-300" : "text-slate-500 hover:text-slate-200"}`}><Icon className="size-3.5" aria-hidden="true" /><span>{label}</span><span className="hidden font-mono text-[9px] text-slate-700 sm:inline">0{index + 1}</span>{active && <span className="absolute inset-x-4 bottom-[-1px] h-0.5 rounded-full bg-emerald-400 sm:inset-x-5" />}</button>
            })}
          </nav>
        </section>

        <div className="pt-6">
          {activeTab === "calculator" && (
            <div className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                    
                    <label className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-slate-500">01 / CHỌN VŨ KHÍ (CÓ THỂ CHỌN NHIỀU)</span>
                        <div className="space-x-2 font-mono text-[9px]">
                          <button type="button" onClick={() => setSelectedCoreIds(coreOptions.map(c => c.id))} className="text-emerald-400 hover:underline">Chọn tất cả</button>
                          <span className="text-slate-600">|</span>
                          <button type="button" onClick={() => setSelectedCoreIds([])} className="text-slate-400 hover:underline">Bỏ chọn</button>
                        </div>
                      </div>
                      <span className="relative">
                        <select 
                          multiple 
                          value={selectedCoreIds} 
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value)
                            setSelectedCoreIds(values)
                          }} 
                          className="h-28 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                        >
                          {classes.map((weaponClass) => {
                            const options = coreOptions.filter(({ item }) => item.Category === weaponClass)
                            return options.length ? (
                              <optgroup key={weaponClass} label={`── ${weaponClass} ──`}>
                                {options.map(({ id, item }) => <option key={id} value={id}>{item.Name} · {item.Firing_Mode || "Special"}</option>)}
                              </optgroup>
                            ) : null
                          })}
                        </select>
                      </span>
                      <span className="text-[10px] text-slate-500">Giữ phím Ctrl (hoặc Cmd trên Mac) để chọn/bỏ chọn từng khẩu súng. Đang chọn: <strong className="text-emerald-400">{selectedCoreIds.length}</strong> khẩu súng.</span>
                    </label>

                    <div className="sm:w-72">
                      <SelectField label="02 / PHONG CÁCH CHƠI" value={style} onChange={(value) => setStyle(value as PlayStyle)}>
                        {playStyles.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </SelectField>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 xl:max-w-[290px]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-300"><Shield className="size-4" aria-hidden="true" /></span>
                    <p className="text-[11px] leading-5 text-slate-500">Hệ thống sẽ quét chéo <strong className="font-medium text-cyan-300">{selectedCoreIds.length}</strong> vũ khí đã chọn để tìm ra khẩu súng cho hiệu suất chiến đấu cao nhất.</p>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-100">Kho phụ kiện toàn bộ</h2><span className="rounded-full border border-slate-800 px-2 py-0.5 font-mono text-[9px] text-emerald-400">Tất cả phân loại súng</span></div>
                    <p className="mt-1 text-[11px] text-slate-500">Tích món bạn đang sở hữu để giới hạn kết quả đề xuất.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="relative min-w-[190px] flex-1 sm:flex-none"><span className="sr-only">Tìm phụ kiện trong kho</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm món đồ..." className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/60 sm:w-48" /></label>
                    <button type="button" onClick={() => setAll(true)} className="h-9 rounded-lg border border-slate-800 px-3 text-[10px] text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300">Chọn tất cả</button>
                    <button type="button" onClick={() => setAll(false)} className="h-9 rounded-lg border border-slate-800 px-3 text-[10px] text-slate-400 transition hover:border-slate-700 hover:text-slate-200">Bỏ chọn</button>
                  </div>
                </div>
                <div className="px-4 pt-3 sm:px-5"><p className="flex items-center gap-2 text-[10px] leading-5 text-slate-500"><CircleHelp className="size-3.5 shrink-0 text-cyan-400" aria-hidden="true" /> Tất cả dữ liệu tương thích được chọn sẵn làm mẫu. Bỏ tích phụ kiện bạn chưa sở hữu.</p></div>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:p-5">
                  {slots.map((slot) => <InventorySection key={slot} slot={slot} entries={entriesBySlot[slot]} selected={inventory[slot]} query={search} onToggle={(id) => toggleItem(slot, id)} onSelectAll={setItems} />)}
                </div>
                <div className="flex flex-col gap-4 border-t border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"><Boxes className="size-3.5" aria-hidden="true" /></span><div><p className="text-xs font-medium text-slate-200">{ownedCount} phụ kiện tương thích</p><p className="mt-0.5 text-[10px] text-slate-600">{attachmentSlots.map((slot) => `${available[slot].length} ${slot.toLowerCase()}`).join(" · ")}</p></div></div>
                  <button type="button" onClick={calculate} disabled={!canCalculate} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-emerald-400 px-5 text-xs font-bold tracking-[0.04em] text-slate-950 shadow-[0_8px_24px_rgba(16,185,129,0.12)] transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><Zap className="size-4" aria-hidden="true" /> TÍNH TỔ HỢP TỐI ƯU TOÀN BỘ <ArrowDown className="size-3.5" aria-hidden="true" /></button>
                </div>
              </section>

              {error && <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">{error}</p>}
              {result && winningCore && <ResultPanel result={result} core={winningCore} style={style} />}
              {(!result || !winningCore) && <EmptyResults ownedCount={ownedCount} canCalculate={canCalculate} />}
            </div>
          )}

          {activeTab === "meta" && <MetaBuilds onApply={applyMetaBuild} />}
          {activeTab === "database" && <DatabaseBrowser />}
        </div>

        <footer className="mt-12 flex flex-col gap-3 border-t border-slate-800/70 pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>WEIRDGUNGAMECALC <span className="mx-1 text-slate-800">/</span> Community weapon lab (Multi-Weapon Support)</p>
          <p className="flex items-center gap-2"><span className="size-1 rounded-full bg-emerald-400" /> Dữ liệu game dùng cho mục đích tham khảo. Cập nhật từ kho dữ liệu đính kèm.</p>
        </footer>
      </div>
    </main>
  )
}