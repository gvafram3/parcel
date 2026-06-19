import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { usePwaInstall } from "../../../hooks/usePwaInstall";

export const PwaInstallBanner = () => {
  const { showBanner, showInstallButton, showIosHint, installing, install, dismiss } = usePwaInstall(true);

  if (!showBanner) return null;

  return (
    <div className="mb-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ea690c] flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm">Install M&amp;M Receive</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {showIosHint
              ? "Add to your home screen for quick access."
              : "Open parcels faster from your home screen."}
          </p>

          {showIosHint ? (
            <p className="text-xs text-slate-700 mt-2 flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 shrink-0 text-[#ea690c]" />
              Tap Share, then <span className="font-medium">Add to Home Screen</span>
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => void install()}
              disabled={installing}
              className="mt-2.5 h-9 rounded-lg bg-[#ea690c] hover:bg-[#d45e0a] text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {installing ? "Installing…" : "Install app"}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
