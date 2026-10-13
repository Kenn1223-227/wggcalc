"use client"

import { ArrowDownRight, ArrowUpRight, Crosshair, Gauge, MoveUpRight, ShieldCheck, Zap } from "lucide-react"
import { useMemo, useState } from "react"
import { allEntries, attachmentSlots, getEntries, type GamePart, type PartEntry } from "@/lib/game-data"
import { calculateFinalStats, optimizeBuild, playStyles, type PlayStyle } from "@/lib/optimizer"

const presets: { id: string; name: string; category: string; style: PlayStyle; type: string; description: string; accent: string; icon: typeof Zap }[] = [
  { id: "shotgun", name: "Auto Shotgun", category: "Shotgun", style: "close", type: "CẬN CHIẾN", description: "Tăng nhịp bắn, băng đạn và khả năng áp sát trong giao tranh ngắn.", accent: "amber", icon: Zap },
  { id: "sniper", name: "1-Tap Sniper", category: "Sniper", style: "sniper", type: "SÁT THƯƠNG CAO", description: "Tối ưu sát thương đầu, tầm bắn và thời gian ngắm cho từng phát chính xác.", accent: "cyan", icon: Crosshair },
  { id: "three-tap", name: "3-Tap Gun", category: "AR", style: "balanced", type: "CÂN BẰNG", description: "Một cấu hình linh hoạt cho nhịp bắn ổn định và sát thương theo loạt.", accent: "emerald", icon: Gauge },
  { id: "run-and-gun", name: "Run & Gun", category: "SMG", style: "auto", type: "CƠ ĐỘNG", description: "Ưu tiên tốc độ bắn cùng thời gian ngắm thấp khi di chuyển liên tục.", accent: "violet", icon: MoveUpRight },
  { id: "battle-rifle", name: "Battle Control", category: "BR", style: "balanced", type: "TẦM TRUNG", description: "Kiểm soát độ giật, giữ tầm hiệu quả và duy trì độ chính xác.", accent: "blue", icon: ShieldCheck },
  { id: "heavy-support", name: "Heavy Support", category: "LMG", style: "auto", type: "YỂM TRỢ", description: "Tăng khả năng duy trì hỏa lực và kiểm soát súng hạng nặng.", accent: "orange", icon: ArrowUpRight },
]

const accentStyles: Record<string, string> = {
  amber: "border-amber-400/25 bg-amber-300/[0.06] text-amber-300",
  cyan: "border-cyan-400/25 bg-cyan-300/[0.06] text-cyan-300",
  emerald: "border-emerald-400/25 bg-emerald-300/[0.06] text-emerald-300",
  violet: "border-violet-400/25 bg-violet-300/[0.06] text-violet-300",
  blue: "border-blue-400/25 bg-blue-300/[0.06] text-blue-300",
  orange: "border-orange-400/25 bg-orange-300/[0.06] text-orange-300",
}

function StatLine({ label, value, unit, inverse = false }: { label: string; value: string; unit: string; inverse?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-3 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="font-mono text-xs text-slate-100">{value}<span className="ml-1 text-[10px] text-slate-500">{unit}</span>{inverse ? <ArrowDownRight className="ml-1 inline size-3 text-emerald-400" aria-label="Càng thấp càng tốt" /> : <ArrowUpRight className="ml-1 inline size-3 text-emerald-400" aria-label="Càng cao càng tốt" />}</span>
    </div>
  )
}

export function MetaBuilds({ onApply }: { onApply: (core: PartEntry, style: PlayStyle) => void }) {
  const [selectedId, setSelectedId] = useState(presets[0].id)
  const active = presets.find((preset) => preset.id === selectedId) || presets[0]
  const core = useMemo(() => getEntries("Cores", active.category)[0], [active.category])
  const optimized = useMemo(() => {
    if (!core) return null
    const candidates = Object.fromEntries(attachmentSlots.map((slot) => [slot, allEntries[slot].filter(({ item }) => item.Category === active.category)])) as Record<(typeof attachmentSlots)[number], PartEntry[]>
    return optimizeBuild(core.item as GamePart, candidates, active.style)
  }, [active.category, active.style, core])
  const stats = optimized?.stats || (core ? calculateFinalStats(core.item, {}) : null)
  const buildParts = optimized?.parts

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400">CURATED LOADOUTS</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-100">Meta builds</h2>
          </div>
          <span className="rounded-full border border-slate-800 px-2.5 py-1 font-mono text-[10px] text-slate-500">{presets.length} CẤU HÌNH</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {presets.map((preset, index) => {
            const Icon = preset.icon
            const selected = preset.id === selectedId
            return (
              <button key={preset.id} type="button" onClick={() => setSelectedId(preset.id)} aria-pressed={selected} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${selected ? "border-emerald-400/50 bg-emerald-400/[0.07]" : "border-slate-800 bg-slate-900/55 hover:border-slate-700 hover:bg-slate-900"}`}>
                <span className="absolute right-4 top-4 font-mono text-[10px] text-slate-700">0{index + 1}</span>
                <span className={`flex size-9 items-center justify-center rounded-xl border ${accentStyles[preset.accent]}`}><Icon className="size-4" aria-hidden="true" /></span>
                <p className="mt-4 text-sm font-semibold text-slate-100">{preset.name}</p>
                <p className="mt-1 text-[10px] font-medium tracking-[0.1em] text-slate-500">{preset.type} · {preset.category.toUpperCase()}</p>
                <span className={`mt-4 block h-px w-full ${selected ? "bg-emerald-400/30" : "bg-slate-800"}`} />
                <span className={`mt-3 block text-[11px] ${selected ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-400"}`}>{selected ? "Đang xem cấu hình" : "Xem chi tiết"}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/55">
        <div className="relative border-b border-slate-800 bg-[radial-gradient(ellipse_at_90%_5%,rgba(16,185,129,0.12),transparent_45%)] p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] ${accentStyles[active.accent]}`}>{active.type}</span>
            <span className="rounded-full border border-slate-800 px-2.5 py-1 font-mono text-[9px] text-slate-500">{active.category}</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">{active.name}</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{active.description}</p>
          {core && <p className="mt-5 flex items-center gap-2 text-xs text-slate-400"><span className="size-1.5 rounded-full bg-emerald-400" /> Core gợi ý <strong className="font-medium text-slate-200">{core.item.Name}</strong></p>}
        </div>

        {stats && (
          <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
            <div>
              <div className="mb-1 flex items-center justify-between"><h4 className="text-[10px] font-semibold tracking-[0.16em] text-slate-500">CHỈ SỐ ƯỚC TÍNH</h4><span className="font-mono text-[9px] text-emerald-400">{optimized ? `${optimized.score.toFixed(1)} PTS` : "—"}</span></div>
              <StatLine label="Sát thương thân" value={stats.bodyDamage.toFixed(1)} unit="DMG" />
              <StatLine label="Sát thương đầu" value={stats.headDamage.toFixed(1)} unit="DMG" />
              <StatLine label="Tốc độ bắn" value={Math.round(stats.fireRate).toLocaleString("vi-VN")} unit="RPM" />
              <StatLine label="Độ giật" value={stats.recoil.toFixed(1)} unit="AVG" inverse />
              <StatLine label="Băng đạn" value={Math.round(stats.magazine).toString()} unit="VIÊN" />
            </div>
            <div>
              <h4 className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-slate-500">PHỤ KIỆN ĐỀ XUẤT</h4>
              {attachmentSlots.map((slot) => (
                <div key={slot} className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-3 last:border-0">
                  <span className="text-xs text-slate-500">{slot}</span>
                  <span className="max-w-[180px] truncate text-right text-xs font-medium text-slate-200">{buildParts?.[slot]?.Name || "Không có lựa chọn"}</span>
                </div>
              ))}
              {optimized?.wasShortlisted && <p className="mt-3 text-[10px] leading-5 text-slate-500">Kết quả được tối ưu trên nhóm ứng viên phù hợp nhất từ dữ liệu lớp súng.</p>}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-[11px] text-slate-500">Phong cách: <span className="text-slate-300">{playStyles.find((item) => item.id === active.style)?.label}</span></p>
          <button type="button" disabled={!core} onClick={() => core && onApply(core, active.style)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">Dùng cấu hình này <MoveUpRight className="size-3.5" aria-hidden="true" /></button>
        </div>
      </section>
    </div>
  )
}
