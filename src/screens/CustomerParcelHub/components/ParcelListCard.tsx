import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { ParcelThumbnail } from "./ParcelThumbnail";
import {
  EnrichedParcel,
  STATUS_STYLES,
  formatTrackCurrency,
  getAmountToPay,
  getParcelTitle,
} from "../trackParcelUtils";

interface Props {
  parcel: EnrichedParcel;
  isSelected: boolean;
  showCheckbox: boolean;
  onToggleSelect?: () => void;
  onOpen: () => void;
}

export const ParcelListCard = ({
  parcel,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onOpen,
}: Props) => {
  const title = getParcelTitle(parcel);
  const amount = getAmountToPay(parcel);

  return (
    <Card
      className={`group overflow-hidden rounded-2xl bg-white transition-all duration-200 ${
        isSelected
          ? "border-[#ea690c]/40 shadow-md ring-2 ring-[#ea690c]/15"
          : "border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch min-h-[5.5rem]">
          {showCheckbox && (
            <label className="flex items-center pl-3.5 pr-1 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 accent-[#ea690c] rounded"
                aria-label={`Select ${title} for delivery`}
              />
            </label>
          )}

          <button
            type="button"
            onClick={onOpen}
            className="flex flex-1 items-center gap-3.5 py-3.5 pr-3.5 min-w-0 text-left"
          >
            <ParcelThumbnail parcel={parcel} size="md" />

            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-neutral-900 leading-snug line-clamp-2 pr-1">{title}</p>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[parcel.displayStatus]}`}
                >
                  {parcel.statusLabel}
                </span>
              </div>

              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">{parcel.parcelId}</p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs text-slate-500">
                {parcel.shelfName && (
                  <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-slate-600">
                    Shelf {parcel.shelfName}
                  </span>
                )}
                {parcel.branchName && !parcel.shelfName && (
                  <span className="truncate max-w-[140px]">{parcel.branchName}</span>
                )}
                {amount != null && (
                  <span className="font-semibold text-[#ea690c]">{formatTrackCurrency(amount)}</span>
                )}
                {parcel.pod && (
                  <span className="text-[10px] font-medium text-orange-600/90">POD</span>
                )}
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ea690c] shrink-0 self-center transition-colors" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
