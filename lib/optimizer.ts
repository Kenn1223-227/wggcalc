import { attachmentSlots, gameData, type AttachmentSlot, type GamePart, type PartEntry } from "./game-data"

export type PlayStyle = "auto" | "sniper" | "close" | "balanced"
export type BuildParts = Partial<Record<AttachmentSlot, GamePart>>

export type FinalStats = {
  bodyDamage: number
  headDamage: number
  fireRate: number
  recoil: number
  magazine: number
  aimTime: number
  range: number
  spread: number
  reloadTime: number
  movementSpeed: number
  health: number
  equipTime: number
  maxSpread: number
  adsMaxSpread: number
  recoilHipfire: number
  modifiers: Record<string, number>
}

export type OptimizedBuild = {
  parts: BuildParts
  stats: FinalStats
  score: number
  combinationsEvaluated: number
  candidatesEvaluated: number
  wasShortlisted: boolean
}

const weights: Record<PlayStyle, Record<string, number>> = {
  auto: { damage: 0.22, fireRate: 0.3, recoil: 0.15, magazine: 0.13, aim: 0.12, range: 0.03, spread: 0.05 },
  sniper: { damage: 0.4, fireRate: 0.08, recoil: 0.17, magazine: 0.05, aim: 0.15, range: 0.1, spread: 0.05 },
  close: { damage: 0.25, fireRate: 0.25, recoil: 0.1, magazine: 0.17, aim: 0.15, range: 0.01, spread: 0.07 },
  balanced: { damage: 0.24, fireRate: 0.19, recoil: 0.17, magazine: 0.12, aim: 0.13, range: 0.08, spread: 0.07 },
}

function numeric(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function midpointMagnitude(value: unknown): number {
  if (Array.isArray(value)) {
    const values = value.filter((part): part is number => typeof part === "number")
    return values.length ? values.reduce((sum, part) => sum + Math.abs(part), 0) / values.length : 0
  }
  return Math.abs(numeric(value))
}

function percentMultiplier(percent: number): number {
  return Math.max(0.05, 1 + percent / 100)
}

// Bảng tỷ lệ phạt khi dùng chéo phụ kiện
const categoryPenalties: Record<string, Record<string, number>> = {
  "AR": { "AR": 0, "Sniper": 0.30, "SMG": 0.21, "Shotgun": 0.25, "LMG": 0.25, "BR": 0.20, "Sidearm": 0.35 },
  "Sniper": { "AR": 0.30, "Sniper": 0, "SMG": 0.40, "Shotgun": 0.40, "LMG": 0.20, "BR": 0.20, "Sidearm": 0.50 },
  "SMG": { "AR": 0.20, "Sniper": 0.40, "SMG": 0, "Shotgun": 0.35, "LMG": 0.35, "BR": 0.30, "Sidearm": 0.30 },
  "Shotgun": { "AR": 0.30, "Sniper": 0.50, "SMG": 0.35, "Shotgun": 0, "LMG": 0.25, "BR": 0.40, "Sidearm": 0.30 },
  "LMG": { "AR": 0.25, "Sniper": 0.20, "SMG": 0.35, "Shotgun": 0.25, "LMG": 0, "BR": 0.15, "Sidearm": 0.50 },
  "BR": { "AR": 0.20, "Sniper": 0.15, "SMG": 0.30, "Shotgun": 0.40, "LMG": 0.15, "BR": 0, "Sidearm": 0.35 },
  "Sidearm": { "AR": 0.35, "Sniper": 0.50, "SMG": 0.25, "Shotgun": 0.35, "LMG": 0.50, "BR": 0.35, "Sidearm": 0 },
  "Weird": { "AR": 0, "Sniper": 0, "SMG": 0, "Shotgun": 0, "LMG": 0, "BR": 0, "Sidearm": 0, "Weird": 0 }
};

// Hàm tổng hợp modifier xử lý phạt chéo và tự động nhận diện Key lỗi trong JSON
function getModifierTotals(core: GamePart, parts: BuildParts) {
  const totals: Record<string, number> = {}
  const coreCat = core.Category

  Object.values(parts).forEach((part) => {
    if (!part) return
    const partCat = part.Category
    
    let penalty = 0
    if (partCat !== "Weird" && coreCat !== "Weird" && categoryPenalties[coreCat] && categoryPenalties[coreCat][partCat] !== undefined) {
      penalty = categoryPenalties[coreCat][partCat]
    }

    Object.entries(part).forEach(([key, value]) => {
      // Bỏ qua các chỉ số gốc tĩnh, chỉ tính Modifier phần trăm
      if (typeof value === "number" && !["Magazine_Size", "Pellets", "Burst"].includes(key)) {
        const actualValue = value * (1 - penalty)
        totals[key] = (totals[key] || 0) + actualValue
      }
    })
  })
  return totals
}

export function calculateFinalStats(core: GamePart, parts: BuildParts): FinalStats {
  const totals = getModifierTotals(core, parts)
  
  const damage = Array.isArray(core.Damage) ? core.Damage : [numeric(core.Damage, 0)]
  const damageMultiplier = percentMultiplier(totals.Damage || 0)
  
  const baseMagazine = gameData.Data.Magazines.find((item) => item.Name === core.Name && item.Category === core.Category)
  const selectedMagazine = parts.Magazines
  const magazineSize = numeric(selectedMagazine?.Magazine_Size, numeric(baseMagazine?.Magazine_Size, 30))
  
  const baseReload = numeric(baseMagazine?.Reload_Time, numeric(core.Reload_Time, 3.2))
  const directReloadTime = numeric(selectedMagazine?.Reload_Time, baseReload)
  
  const baseRecoilAiming = (midpointMagnitude(core.Recoil_Aim_Vertical) + midpointMagnitude(core.Recoil_Aim_Horizontal)) / 2 || 5
  
  // Tự động fallback đọc biến Recoil_Hip_Vertical cũ trong JSON
  const baseRecoilHipfire = (midpointMagnitude(core.Recoil_Hip_Vertical || core.Recoil_Hipfire_Vertical) + midpointMagnitude(core.Recoil_Hip_Horizontal || core.Recoil_Hipfire_Horizontal)) / 2 || 10
  
  // Tự động fallback đọc biến Hipfire_Spread cũ
  const baseMaxSpread = numeric(core.Max_Spread, numeric(core.Hipfire_Spread, 1.5))
  const baseAdsMaxSpread = numeric(core.ADS_Spread, 0.4)

  return {
    bodyDamage: numeric(damage[0]) * damageMultiplier,
    headDamage: numeric(damage[1], numeric(damage[0])) * damageMultiplier,
    fireRate: numeric(core.Fire_Rate) * percentMultiplier(totals.Fire_Rate || 0),
    recoil: baseRecoilAiming * percentMultiplier(totals.Recoil || 0),
    magazine: Math.max(1, magazineSize * percentMultiplier(totals.Magazine_Cap || 0)),
    aimTime: Math.max(0.05, numeric(core.Time_To_Aim, 0.5) * percentMultiplier(totals.Time_To_Aim || 0)),
    range: numeric(Array.isArray(core.Dropoff_Studs) ? core.Dropoff_Studs[0] : 0) * percentMultiplier(totals.Range || 0),
    spread: Math.max(0.01, baseMaxSpread * percentMultiplier(totals.Spread || totals.Max_Spread || 0)),
    
    // Đọc bù trừ thông số mới:
    reloadTime: Math.max(0.1, directReloadTime * percentMultiplier(-(totals.Reload_Speed || 0))),
    
    // Tự động gom Movement_Speed_Modifier (cũ) và Movement_Speed lại với nhau
    movementSpeed: numeric(core.Movement_Speed, numeric(core.Movement_Speed_Modifier, 0)) + numeric(totals.Movement_Speed, 0),
    health: numeric(core.Health, 0) + numeric(totals.Health, 0),
    equipTime: Math.max(0.05, numeric(core.Equip_Time, 0.5) * percentMultiplier(totals.Equip_Time || 0)),
    
    // Khớp lệnh Spread dùng chung cho cả Max Spread và ADS Spread nếu phụ kiện chỉ ghi "Spread"
    maxSpread: Math.max(0.01, baseMaxSpread * percentMultiplier(totals.Max_Spread || totals.Spread || 0)),
    adsMaxSpread: Math.max(0.01, baseAdsMaxSpread * percentMultiplier(totals.ADS_Spread || totals.Spread || 0)),
    recoilHipfire: baseRecoilHipfire * percentMultiplier(totals.Recoil_Hipfire || totals.Recoil || 0),
    
    modifiers: totals,
  }
}

function ratio(value: number, baseline: number, inverse = false): number {
  if (baseline <= 0 || value <= 0) return 1
  const normalized = inverse ? baseline / value : value / baseline
  return Math.max(0.4, Math.min(1.6, normalized))
}

export function scoreBuild(core: GamePart, parts: BuildParts, style: PlayStyle): number {
  const final = calculateFinalStats(core, parts)
  const baseline = calculateFinalStats(core, {})
  const profile = weights[style]
  const quality = {
    damage: ratio(final.bodyDamage, baseline.bodyDamage),
    fireRate: ratio(final.fireRate, baseline.fireRate),
    recoil: ratio(final.recoil, baseline.recoil, true),
    magazine: ratio(final.magazine, baseline.magazine),
    aim: ratio(final.aimTime, baseline.aimTime, true),
    range: ratio(final.range, baseline.range),
    spread: ratio(final.spread, baseline.spread, true),
  }
  return (
    quality.damage * profile.damage +
    quality.fireRate * profile.fireRate +
    quality.recoil * profile.recoil +
    quality.magazine * profile.magazine +
    quality.aim * profile.aim +
    quality.range * profile.range +
    quality.spread * profile.spread
  ) * 100
}

function bestCandidateSet(core: GamePart, entries: PartEntry[], slot: AttachmentSlot, style: PlayStyle, limit: number) {
  return [...entries]
    .sort((left, right) => {
      const leftScore = scoreBuild(core, { [slot]: left.item }, style)
      const rightScore = scoreBuild(core, { [slot]: right.item }, style)
      return rightScore - leftScore
    })
    .slice(0, limit)
    .map((entry) => entry.item)
}

export function optimizeBuild(
  core: GamePart,
  available: Record<AttachmentSlot, PartEntry[]>,
  style: PlayStyle,
): OptimizedBuild | null {
  if (attachmentSlots.some((slot) => available[slot].length === 0)) return null

  const totalPossible = attachmentSlots.reduce((count, slot) => count * available[slot].length, 1)
  const shortlistLimit = 12
  const wasShortlisted = totalPossible > 180_000
  const candidates = Object.fromEntries(
    attachmentSlots.map((slot) => [
      slot,
      wasShortlisted ? bestCandidateSet(core, available[slot], slot, style, shortlistLimit) : available[slot].map((entry) => entry.item),
    ]),
  ) as Record<AttachmentSlot, GamePart[]>

  let best: OptimizedBuild | null = null
  let combinationsEvaluated = 0
  const current: BuildParts = {}

  function search(depth: number) {
    if (depth === attachmentSlots.length) {
      combinationsEvaluated += 1
      const parts = { ...current }
      const score = scoreBuild(core, parts, style)
      if (!best || score > best.score) {
        best = { parts, score, stats: calculateFinalStats(core, parts), combinationsEvaluated: 0, candidatesEvaluated: totalPossible, wasShortlisted }
      }
      return
    }

    const slot = attachmentSlots[depth]
    for (const part of candidates[slot]) {
      current[slot] = part
      search(depth + 1)
    }
  }

  search(0)
  const winner = best as OptimizedBuild | null
  if (!winner) return null
  winner.combinationsEvaluated = combinationsEvaluated
  return winner
}

export const playStyles: { id: PlayStyle; label: string; description: string }[] = [
  { id: "auto", label: "Tự động", description: "Ưu tiên nhịp bắn và ổn định khi xả đạn." },
  { id: "sniper", label: "Bắn tỉa", description: "Ưu tiên sát thương, tầm bắn và thời gian ngắm." },
  { id: "close", label: "Cận chiến", description: "Ưu tiên tốc độ, băng đạn và khả năng xoay trở." },
  { id: "balanced", label: "Cân bằng", description: "Phân bổ điểm đồng đều cho mọi tình huống." },
]

export const styleLabel = (style: PlayStyle) => playStyles.find((option) => option.id === style)?.label || "Cân bằng"
export const getCore = (name: string, category: string) => gameData.Data.Cores.find((core) => core.Name === name && core.Category === category)
export const coreBaseDamage = (core: GamePart) => numeric(Array.isArray(core.Damage) ? core.Damage[0] : core.Damage)