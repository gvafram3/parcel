import { useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  MapPin,
  Package,
  Phone,
  Share2,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { ParcelThumbnail } from "./ParcelThumbnail";
import {
  EnrichedParcel,
  STATUS_STYLES,
  formatTrackCurrency,
  formatTrackDateTime,
  getAmountToPay,
  getParcelTitle,
  isParcelArrived,
} from "../trackParcelUtils";
import type { DeliverySuccessInfo } from "../trackParcelUtils";

export type ParcelActionSuccess = "pickup" | "delivery" | null;

interface Props {
  parcel: EnrichedParcel;
  actionSuccess: ParcelActionSuccess;
  deliverySuccess: DeliverySuccessInfo;
  onRequestDelivery: () => void;
  onSelfPickup: () => void;
}

export const ParcelDetailView = ({
  parcel,
  actionSuccess,
  deliverySuccess,
  onRequestDelivery,
  onSelfPickup,
}: Props) => {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const amount = getAmountToPay(parcel);
  const title = getParcelTitle(parcel);
  const canRequestDelivery =
    !actionSuccess &&
    (parcel.displayStatus === "ready" || parcel.displayStatus === "in_progress");
  const canSelfPickup = !actionSuccess && parcel.displayStatus === "ready";
  const scheduleDelivery = !isParcelArrived(parcel);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(parcel.parcelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareTracking = async () => {
    const text = `My M&M parcel: ${parcel.parcelId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Parcel tracking", text });
      } catch {
        /* ignore */
      }
    } else {
      copyId();
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parcel.branchName)}`;

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {actionSuccess === "pickup" && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">Branch notified — you&apos;re on your way</p>
            <p className="text-sm text-emerald-800 mt-1">
              Est. wait 10–15 min · Pickup code <span className="font-bold">{parcel.pickupCode}</span> · {parcel.branchName}
            </p>
          </div>
        </div>
      )}

      {actionSuccess === "delivery" && deliverySuccess && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
          <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">
              {deliverySuccess.scheduled ? "Scheduled delivery booked" : "Delivery paid & requested"}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              {deliverySuccess.parcelCount} parcel{deliverySuccess.parcelCount !== 1 ? "s" : ""} in one trip · paid via
              Paystack
              {deliverySuccess.scheduled && deliverySuccess.scheduledAt && (
                <> · {deliverySuccess.scheduledAt}</>
              )}
              {deliverySuccess.paystackReference && (
                <> · ref <span className="font-mono text-xs">{deliverySuccess.paystackReference}</span></>
              )}
              {" "}· ETA 15–20 min after rider assignment
            </p>
          </div>
        </div>
      )}

      {actionSuccess === "delivery" && !deliverySuccess && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
          <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Delivery requested</p>
            <p className="text-sm text-blue-800 mt-1">
              A rider will be assigned shortly · ETA 15–20 min after assignment
            </p>
          </div>
        </div>
      )}

      <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
        <ParcelThumbnail parcel={parcel} size="hero" className="rounded-none border-0 border-b border-slate-100" />
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 leading-snug">{title}</h1>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[parcel.displayStatus]}`}
              >
                {parcel.statusLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-[#ea690c]"
            >
              {parcel.parcelId}
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Building2, label: "Branch", value: parcel.branchName },
              { icon: Package, label: "Shelf", value: parcel.shelfName || "—" },
              { icon: MapPin, label: "Code", value: parcel.pickupCode },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                <item.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{item.label}</p>
                <p className="text-xs font-semibold text-neutral-800 mt-0.5 truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-700/80 font-medium">Amount to pay</p>
              <p className="text-xl font-bold text-[#ea690c] mt-0.5">
                {amount != null ? formatTrackCurrency(amount) : "Contact branch"}
              </p>
            </div>
            {parcel.pod && (
              <span className="text-[11px] font-semibold bg-white text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                POD
              </span>
            )}
          </div>

          <div className="flex items-center justify-around border-t border-slate-100 pt-3">
            <a
              href="tel:+233504040226"
              className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-[#ea690c]"
            >
              <Phone className="w-4 h-4" />
              Call branch
            </a>
            <button
              type="button"
              onClick={shareTracking}
              className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-[#ea690c]"
            >
              <Share2 className="w-4 h-4" />
              Share ID
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-[#ea690c]"
            >
              <MapPin className="w-4 h-4" />
              Directions
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 rounded-2xl">
        <button
          type="button"
          onClick={() => setDetailsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-neutral-800">More details</span>
          {detailsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {detailsOpen && (
          <CardContent className="px-4 pb-4 pt-0 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-xs text-slate-500">Arrived</p>
                <p className="font-medium text-neutral-800 mt-0.5">{formatTrackDateTime(parcel.arrivedAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-xs text-slate-500">Storage</p>
                <p className="font-medium text-neutral-800 mt-0.5">
                  {parcel.storageDays} day{parcel.storageDays !== 1 ? "s" : ""}{" "}
                  <span className="text-slate-400 font-normal">({parcel.freeStorageDays} free)</span>
                </p>
              </div>
            </div>
            {(parcel.receiverName || parcel.receiverAddress) && (
              <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-xs text-slate-500">Receiver</p>
                {parcel.receiverName && <p className="font-medium text-neutral-800 mt-0.5">{parcel.receiverName}</p>}
                {parcel.receiverAddress && <p className="text-slate-600 text-xs mt-0.5">{parcel.receiverAddress}</p>}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card className="border border-slate-200 rounded-2xl">
        <button
          type="button"
          onClick={() => setTimelineOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-neutral-800">Parcel journey</span>
          {timelineOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {timelineOpen && (
          <CardContent className="px-4 pb-4 pt-0">
            <ol className="space-y-0">
              {parcel.timeline.map((event, index) => {
                const isLast = index === parcel.timeline.length - 1;
                return (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                          event.completed ? "bg-[#ea690c]" : "bg-slate-300"
                        }`}
                      />
                      {!isLast && <div className="w-px flex-1 bg-slate-200 my-1 min-h-[24px]" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className={`text-sm ${event.completed ? "text-neutral-800 font-medium" : "text-slate-400"}`}>
                        {event.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatTrackDateTime(event.timestamp)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        )}
      </Card>

      {(canSelfPickup || canRequestDelivery) && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 safe-area-pb">
          <div className="max-w-lg mx-auto flex gap-2">
            {canSelfPickup && (
              <Button
                type="button"
                onClick={onSelfPickup}
                className="flex-1 h-11 rounded-xl bg-[#ea690c] hover:bg-[#d45e0a] text-white"
              >
                <UserRound className="w-4 h-4 mr-2" />
                I&apos;m coming
              </Button>
            )}
            {canRequestDelivery && (
              <Button
                type="button"
                onClick={onRequestDelivery}
                className={`h-11 rounded-xl text-white ${canSelfPickup ? "flex-1 bg-blue-600 hover:bg-blue-700" : "w-full bg-blue-600 hover:bg-blue-700"}`}
              >
                <Truck className="w-4 h-4 mr-2" />
                {scheduleDelivery ? "Schedule delivery" : "Request delivery"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
