import { Package, Phone } from "lucide-react";

interface Props {
  onBack?: () => void;
  backLabel?: string;
  subtitle?: string;
}

export const TrackHeader = ({ onBack, backLabel = "Back", subtitle = "Receive your parcel" }: Props) => (
  <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
    <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-[#ea690c] hover:underline shrink-0"
          >
            {backLabel}
          </button>
        ) : (
          <div className="w-9 h-9 bg-[#ea690c] rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-neutral-800 leading-tight">M&amp;M Delivery</p>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
      </div>
      <a
        href="tel:+233504040226"
        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#ea690c] shrink-0"
      >
        <Phone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Need help?</span>
      </a>
    </div>
  </header>
);
