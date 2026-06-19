import type { CustomerParcel } from "../../services/customerService";

export type TrackStep = "search" | "otp" | "list" | "detail";

export type ParcelDisplayStatus = "ready" | "in_progress" | "delivered" | "out_for_delivery";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface ParcelTimelineEvent {
  id: string;
  label: string;
  timestamp: number | null;
  completed: boolean;
}

export interface EnrichedParcel extends CustomerParcel {
  displayStatus: ParcelDisplayStatus;
  statusLabel: string;
  branchName: string;
  pickupCode: string;
  arrivedAt: number | null;
  storageDays: number;
  freeStorageDays: number;
  timeline: ParcelTimelineEvent[];
}

export function formatTrackCurrency(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `GHC ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTrackDate(ts: number | null | undefined): string {
  if (ts == null) return "—";
  const ms = typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTrackDateTime(ts: number | null | undefined): string {
  if (ts == null) return "—";
  const ms = typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts;
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const local = digits.startsWith("233") ? digits.slice(3) : digits;
  return `+233 ${local.slice(0, 2)}••••${local.slice(-3)}`;
}

export function getAmountToPay(p: CustomerParcel): number | null {
  if (p.parcelAmount != null && !Number.isNaN(p.parcelAmount)) return p.parcelAmount;
  const total =
    (Number(p.inboundCost) || 0) +
    (Number(p.deliveryCost) || 0) +
    (Number(p.storageCost) || 0) +
    (Number(p.pickUpCost) || 0);
  return total > 0 ? total : null;
}

function getDisplayStatus(p: CustomerParcel): { status: ParcelDisplayStatus; label: string } {
  if (p.delivered) return { status: "delivered", label: "Delivered" };
  if (p.homeDelivery && p.parcelAssigned) return { status: "out_for_delivery", label: "Out for delivery" };
  if (p.shelfName) return { status: "ready", label: "Ready for pickup" };
  return { status: "in_progress", label: "In progress" };
}

function buildTimeline(p: CustomerParcel): ParcelTimelineEvent[] {
  const created = p.createdAt ?? null;
  const updated = p.updatedAt ?? null;
  const events: ParcelTimelineEvent[] = [
    { id: "registered", label: "Parcel registered", timestamp: created, completed: created != null },
    { id: "transit", label: "In transit to branch", timestamp: created, completed: !!p.shelfName || !!p.delivered },
    { id: "arrived", label: "Arrived at branch", timestamp: p.shelfName ? updated ?? created : null, completed: !!p.shelfName },
    { id: "notified", label: "Customer notified", timestamp: p.shelfName ? updated : null, completed: !!p.shelfName && !p.delivered },
    { id: "delivered", label: "Delivered", timestamp: p.delivered ? updated : null, completed: !!p.delivered },
  ];
  return events.filter(e => e.completed || e.timestamp != null);
}

export const STATUS_STYLES: Record<ParcelDisplayStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  delivered: "bg-slate-100 text-slate-600 border-slate-200",
  out_for_delivery: "bg-sky-50 text-sky-700 border-sky-200",
};

export function getParcelTitle(p: Pick<EnrichedParcel, "parcelDescription" | "receiverName" | "parcelId">): string {
  return p.parcelDescription || p.receiverName || "Parcel";
}

export function getParcelImageUrl(p: CustomerParcel): string | null {
  const candidates = [
    p.parcelImageUrl,
    (p as CustomerParcel & { imageUrl?: string }).imageUrl,
    (p as CustomerParcel & { parcelImage?: string }).parcelImage,
    (p as CustomerParcel & { photoUrl?: string }).photoUrl,
  ];
  const url = candidates.find(v => typeof v === "string" && v.trim().length > 0);
  return url?.trim() ?? null;
}

const FALLBACK_GRADIENTS = [
  "from-orange-50 via-white to-orange-100/80",
  "from-slate-50 via-white to-slate-100",
  "from-amber-50/80 via-white to-orange-50",
  "from-stone-50 via-white to-stone-100",
];

export function getParcelFallbackGradient(parcelId: string): string {
  const code = parcelId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_GRADIENTS[code % FALLBACK_GRADIENTS.length];
}

export function getParcelInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return title.slice(0, 2).toUpperCase() || "PK";
}

const STATUS_SORT_ORDER: Record<ParcelDisplayStatus, number> = {
  ready: 0,
  out_for_delivery: 1,
  in_progress: 2,
  delivered: 3,
};

export function sortParcelsForReceive(parcels: EnrichedParcel[]): EnrichedParcel[] {
  return [...parcels].sort((a, b) => {
    const byStatus = STATUS_SORT_ORDER[a.displayStatus] - STATUS_SORT_ORDER[b.displayStatus];
    if (byStatus !== 0) return byStatus;
    return (b.arrivedAt ?? b.createdAt ?? 0) - (a.arrivedAt ?? a.createdAt ?? 0);
  });
}

export function isParcelDeliverable(p: EnrichedParcel): boolean {
  return p.displayStatus === "ready" || p.displayStatus === "in_progress";
}

export function isParcelArrived(p: EnrichedParcel): boolean {
  return p.displayStatus === "ready";
}

/** True when any parcel in the batch has not reached the branch yet. */
export function requiresScheduledDelivery(parcels: EnrichedParcel[]): boolean {
  return parcels.some(p => !isParcelArrived(p));
}

export interface DeliverySchedule {
  date: string;
  time: string;
}

export function formatDeliverySchedule(schedule: DeliverySchedule): string {
  const d = new Date(`${schedule.date}T${schedule.time}`);
  if (Number.isNaN(d.getTime())) return `${schedule.date} ${schedule.time}`;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayDateInput(): string {
  return new Date().toISOString().split("T")[0];
}

const DELIVERY_BASE_FEE = 10;
const DELIVERY_EXTRA_PER_PARCEL = 3;

export function estimateDeliveryFee(parcelCount: number): number {
  if (parcelCount <= 0) return 0;
  return DELIVERY_BASE_FEE + Math.max(0, parcelCount - 1) * DELIVERY_EXTRA_PER_PARCEL;
}

export function sumParcelAmounts(parcels: EnrichedParcel[]): number {
  return parcels.reduce((sum, p) => sum + (getAmountToPay(p) ?? 0), 0);
}

export type DeliverySuccessInfo = {
  parcelCount: number;
  paystackReference?: string;
  scheduled?: boolean;
  scheduledAt?: string;
} | null;

export function enrichParcel(p: CustomerParcel, officeNames: Record<string, string> = {}): EnrichedParcel {
  const { status, label } = getDisplayStatus(p);
  const arrivedAt = p.shelfName ? (p.updatedAt ?? p.createdAt ?? null) : null;
  const storageDays =
    arrivedAt != null
      ? Math.max(0, Math.floor((Date.now() - (arrivedAt < 1e12 ? arrivedAt * 1000 : arrivedAt)) / 86400000))
      : 0;

  return {
    ...p,
    displayStatus: status,
    statusLabel: label,
    branchName:
      (p.officeId && officeNames[p.officeId]) ||
      (p as CustomerParcel & { officeName?: string }).officeName ||
      (p.officeId ? `Branch ${p.officeId.slice(-4).toUpperCase()}` : "Pickup branch"),
    pickupCode: p.parcelId.replace(/\D/g, "").slice(-4).padStart(4, "0"),
    arrivedAt,
    storageDays,
    freeStorageDays: 3,
    timeline: buildTimeline(p),
  };
}

