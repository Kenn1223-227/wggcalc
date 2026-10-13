import source from "../game-data.json"

export type Slot = "Cores" | "Barrels" | "Grips" | "Magazines" | "Stocks"
export type AttachmentSlot = Exclude<Slot, "Cores">

export type GamePart = {
  Name: string
  Category: string
  Price_Type?: string
  Firing_Mode?: string
  Damage?: number | number[]
  Dropoff_Studs?: number | number[]
  Reload_Time?: number
  Magazine_Size?: number
  Fire_Rate?: number
  Time_To_Aim?: number
  Movement_Speed?: number
  Health?: number
  Equip_Time?: number
  Max_Spread?: number
  ADS_Spread?: number
  Hipfire_Spread?: number
  Recoil_Hipfire_Horizontal?: number[] | number
  Recoil_Hipfire_Vertical?: number[] | number
  Recoil_Aim_Horizontal?: number[] | number
  Recoil_Aim_Vertical?: number[] | number
  [key: string]: unknown
}

export type PartEntry = {
  item: GamePart
  index: number
  id: string
}

type SourceShape = {
  Data: Record<Slot, GamePart[]>
  Penalties: number[][]
  Categories: { Primary: Record<string, number>; Secondary: Record<string, number> }
}

export const gameData = source as SourceShape
export const slots: Slot[] = ["Cores", "Barrels", "Grips", "Magazines", "Stocks"]
export const attachmentSlots: AttachmentSlot[] = ["Barrels", "Grips", "Magazines", "Stocks"]
export const weaponClasses = Object.keys(gameData.Categories.Primary)

export function getEntries(slot: Slot, category?: string): PartEntry[] {
  return gameData.Data[slot]
    .map((item, index) => ({ item, index, id: `${slot}:${index}` }))
    .filter(({ item }) => !category || item.Category === category)
}

export const allEntries = Object.fromEntries(
  slots.map((slot) => [slot, getEntries(slot)]),
) as Record<Slot, PartEntry[]>

export function getInventoryDefaults(): Record<Slot, Set<string>> {
  return Object.fromEntries(
    slots.map((slot) => [slot, new Set(allEntries[slot].map((entry) => entry.id))]),
  ) as Record<Slot, Set<string>>
}

export function formatStat(value: unknown, digits = 1): string {
  if (Array.isArray(value)) return value.map((part) => formatStat(part, digits)).join(" / ")
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(digits)
  return typeof value === "string" ? value : "—"
}

export function formatStatName(name: string): string {
  return name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function rawStatSummary(item: GamePart): string {
  return Object.entries(item)
    .filter(([key]) => !["Name", "Category", "Price_Type", "Firing_Mode"].includes(key))
    .map(([key, value]) => `${formatStatName(key)} ${formatStat(value)}`)
    .slice(0, 3)
    .join(" · ") || "Không có modifier"
}

export const formatPrice = (price?: string) => price || "Unclassified"