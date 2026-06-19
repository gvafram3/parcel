import { useMemo } from "react";
import { Truck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ParcelListCard } from "./ParcelListCard";
import {
  EnrichedParcel,
  isParcelDeliverable,
  requiresScheduledDelivery,
  sortParcelsForReceive,
} from "../trackParcelUtils";

interface Props {
  phone: string;
  parcels: EnrichedParcel[];
  selectedIds: Set<string>;
  onToggleSelect: (parcelId: string) => void;
  onSelectAllDeliverable: () => void;
  onClearSelection: () => void;
  onSelect: (parcel: EnrichedParcel) => void;
  onRequestDelivery: (parcels: EnrichedParcel[]) => void;
  onNewSearch: () => void;
}

export const ParcelListStep = ({
  phone,
  parcels,
  selectedIds,
  onToggleSelect,
  onSelectAllDeliverable,
  onClearSelection,
  onSelect,
  onRequestDelivery,
  onNewSearch,
}: Props) => {
  const sorted = sortParcelsForReceive(parcels);
  const readyCount = sorted.filter(p => p.displayStatus === "ready").length;
  const deliverable = useMemo(() => sorted.filter(isParcelDeliverable), [sorted]);
  const selectedParcels = useMemo(
    () => sorted.filter(p => selectedIds.has(p.parcelId)),
    [sorted, selectedIds],
  );
  const selectionIsScheduled = requiresScheduledDelivery(selectedParcels);
  const allDeliverableSelected =
    deliverable.length > 0 && deliverable.every(p => selectedIds.has(p.parcelId));

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-28">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Your parcels</h1>
          <p className="text-sm text-slate-600 mt-1">
            {sorted.length} result{sorted.length !== 1 ? "s" : ""} for {phone}
            {readyCount > 0 && (
              <span className="text-emerald-700 font-medium"> · {readyCount} ready for pickup</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewSearch}
          className="text-sm font-medium text-[#ea690c] hover:underline shrink-0"
        >
          New search
        </button>
      </div>

      {deliverable.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="text-xs text-slate-600">
            Select parcels that should be delivered together to one location.
          </p>
          <button
            type="button"
            onClick={allDeliverableSelected ? onClearSelection : onSelectAllDeliverable}
            className="text-xs font-semibold text-[#ea690c] hover:underline shrink-0"
          >
            {allDeliverableSelected ? "Clear selection" : `Select all (${deliverable.length})`}
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        {sorted.map(parcel => (
          <ParcelListCard
            key={parcel.parcelId}
            parcel={parcel}
            isSelected={selectedIds.has(parcel.parcelId)}
            showCheckbox={isParcelDeliverable(parcel)}
            onToggleSelect={() => onToggleSelect(parcel.parcelId)}
            onOpen={() => onSelect(parcel)}
          />
        ))}
      </div>

      {selectedParcels.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-slate-500 text-center mb-2">
              {selectedParcels.length} parcel{selectedParcels.length !== 1 ? "s" : ""} · one delivery, one payment
              {selectionIsScheduled && (
                <span className="block text-amber-700 font-medium mt-0.5">
                  Includes in-transit parcel(s) — scheduled delivery
                </span>
              )}
            </p>
            <Button
              type="button"
              onClick={() => onRequestDelivery(selectedParcels)}
              className="w-full h-11 rounded-xl bg-[#ea690c] hover:bg-[#d45e0a] text-white"
            >
              <Truck className="w-4 h-4 mr-2" />
              {selectionIsScheduled ? "Schedule delivery" : "Request delivery"} ({selectedParcels.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
