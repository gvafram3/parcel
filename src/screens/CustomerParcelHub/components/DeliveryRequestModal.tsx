import { useMemo, useState } from "react";
import { CalendarClock, Loader2, MapPin, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { GoogleMapPicker } from "./GoogleMapPicker";
import {
  buildPaystackReference,
  openPaystackPayment,
  paystackEmailFromPhone,
} from "../../../services/paystackService";
import { useToast } from "../../../components/ui/toast";
import type { DeliverySchedule, EnrichedParcel, GpsCoordinates } from "../trackParcelUtils";
import {
  estimateDeliveryFee,
  formatTrackCurrency,
  isParcelArrived,
  requiresScheduledDelivery,
  sumParcelAmounts,
  todayDateInput,
} from "../trackParcelUtils";

interface Props {
  parcels: EnrichedParcel[];
  customerPhone: string;
  onClose: () => void;
  onSubmit: (
    coords: GpsCoordinates,
    notes: string,
    paystackReference: string,
    schedule: DeliverySchedule | null,
  ) => void;
}

export const DeliveryRequestModal = ({ parcels, customerPhone, onClose, onSubmit }: Props) => {
  const { showToast } = useToast();
  const [coords, setCoords] = useState<GpsCoordinates | null>(null);
  const [notes, setNotes] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isScheduled = requiresScheduledDelivery(parcels);
  const pendingCount = parcels.filter(p => !isParcelArrived(p)).length;

  const deliveryFee = estimateDeliveryFee(parcels.length);
  const parcelTotal = sumParcelAmounts(parcels);
  const grandTotal = deliveryFee + parcelTotal;

  const parcelLabels = useMemo(
    () =>
      parcels.map(p => ({
        id: p.parcelId,
        title: p.parcelDescription || p.receiverName || p.parcelId,
        arrived: isParcelArrived(p),
      })),
    [parcels],
  );

  const hasValidCoords =
    coords != null &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !(coords.latitude === 0 && coords.longitude === 0);

  const hasValidSchedule = !isScheduled || (scheduleDate && scheduleTime);

  const handlePay = async () => {
    if (!hasValidCoords || !coords || !hasValidSchedule) return;

    const schedule: DeliverySchedule | null = isScheduled
      ? { date: scheduleDate, time: scheduleTime }
      : null;

    setSubmitting(true);
    const reference = buildPaystackReference();

    try {
      await openPaystackPayment({
        email: paystackEmailFromPhone(customerPhone),
        amountGhc: grandTotal,
        reference,
        metadata: {
          parcelIds: parcels.map(p => p.parcelId),
          deliveryType: isScheduled ? "scheduled" : "immediate",
          scheduledDate: schedule?.date,
          scheduledTime: schedule?.time,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: coords.address,
          notes: notes.trim() || undefined,
        },
        onSuccess: paidRef => {
          setSubmitting(false);
          onSubmit(coords, notes.trim(), paidRef, schedule);
        },
        onCancel: () => {
          setSubmitting(false);
          showToast("Payment cancelled.", "info");
        },
      });
    } catch (err) {
      setSubmitting(false);
      showToast(err instanceof Error ? err.message : "Could not start Paystack payment.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Close" />
      <Card className="relative w-full sm:max-w-md border border-slate-200 bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-base font-bold text-neutral-800">
                {isScheduled ? "Schedule delivery" : "Request delivery"}
                {parcels.length > 1 ? ` · ${parcels.length} parcels` : ""}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isScheduled
                  ? "Delivery runs after parcel(s) arrive at the branch"
                  : "Select location on map · pay with Paystack"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-neutral-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {isScheduled && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3">
                <CalendarClock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">Scheduled delivery required</p>
                  <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                    {pendingCount === parcels.length
                      ? "Your parcel(s) have not arrived at the branch yet. Choose when you want them delivered after they arrive."
                      : `${pendingCount} of ${parcels.length} parcel(s) are still in transit. The full batch will be delivered together once all have arrived.`}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Parcels in this delivery</p>
              </div>
              <ul className="max-h-28 overflow-y-auto">
                {parcelLabels.map(p => (
                  <li key={p.id} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-neutral-800">{p.title}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        p.arrived
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {p.arrived ? "Arrived" : "In transit"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-date" className="text-sm font-medium text-neutral-800">
                    Preferred date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={todayDateInput()}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-time" className="text-sm font-medium text-neutral-800">
                    Preferred time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Delivery fee ({parcels.length} parcel{parcels.length !== 1 ? "s" : ""})</span>
                <span className="font-medium text-neutral-800">{formatTrackCurrency(deliveryFee)}</span>
              </div>
              {parcelTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Parcel amount{parcels.length > 1 ? "s" : ""} (POD)</span>
                  <span className="font-medium text-neutral-800">{formatTrackCurrency(parcelTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-semibold text-neutral-800">Total via Paystack</span>
                <span className="text-lg font-bold text-[#ea690c]">{formatTrackCurrency(grandTotal)}</span>
              </div>
              <p className="text-xs text-slate-500">
                {isScheduled
                  ? "Rider assigned for your preferred slot once all parcels are at the branch."
                  : "ETA 15–20 minutes after rider assignment."}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-800">Delivery location on Google Maps</Label>
              <GoogleMapPicker coords={coords} onChange={setCoords} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delivery-notes" className="text-sm font-medium text-neutral-800">
                Landmark or directions <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="delivery-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Blue gate near the main road"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePay}
                disabled={!hasValidCoords || !hasValidSchedule || submitting}
                className="flex-1 h-11 rounded-xl bg-[#ea690c] hover:bg-[#d45e0a] text-white"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    {isScheduled ? "Schedule & pay" : "Pay with Paystack"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
