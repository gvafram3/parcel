import { Loader2, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { GhanaPhoneInput } from "../../../components/GhanaPhoneInput";
import { validatePhoneNumber } from "../../../utils/dataHelpers";
import type { GoogleCredentialPayload } from "../../../utils/googleAuth";
import { ReceiveFooter } from "./ReceiveFooter";
import { CustomerEmailAuthForm, type AuthMode } from "./CustomerEmailAuthForm";
import { PwaInstallBanner } from "./PwaInstallBanner";

export type LandingTab = "account" | "find";

interface Props {
  phone: string;
  loading: boolean;
  error: string;
  tab: LandingTab;
  onTabChange: (tab: LandingTab) => void;
  authMode: AuthMode;
  onAuthModeChange: (mode: AuthMode) => void;
  isSignedIn?: boolean;
  customerName?: string;
  customerEmail?: string;
  customerPicture?: string;
  deliveryAuthPrompt?: boolean;
  pendingDeliveryCount?: number;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onGoogleSuccess: (profile: GoogleCredentialPayload) => void;
  onAuthSuccess: () => void;
}

export const CustomerReceiveLanding = ({
  phone,
  loading,
  error,
  tab,
  onTabChange,
  authMode,
  onAuthModeChange,
  isSignedIn,
  customerName,
  customerEmail,
  customerPicture,
  deliveryAuthPrompt,
  pendingDeliveryCount,
  onPhoneChange,
  onSubmit,
  onGoogleSuccess,
  onAuthSuccess,
}: Props) => (
  <div className="animate-in fade-in duration-300">
    <PwaInstallBanner />

    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight text-center mb-5">
      Receive your parcels
    </h1>

    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1">
        <button
          type="button"
          onClick={() => onTabChange("account")}
          className={`py-2.5 text-sm font-semibold rounded-2xl transition-all ${
            tab === "account" ? "bg-white text-neutral-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => onTabChange("find")}
          className={`py-2.5 text-sm font-semibold rounded-2xl transition-all ${
            tab === "find" ? "bg-white text-neutral-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Find parcels
        </button>
      </div>

      <div className="p-5">
        {tab === "account" && (
          <div className="space-y-4">
            {deliveryAuthPrompt && pendingDeliveryCount ? (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Sign in to request delivery for {pendingDeliveryCount} parcel
                {pendingDeliveryCount !== 1 ? "s" : ""}.
              </p>
            ) : null}

            {isSignedIn ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {customerPicture ? (
                    <img src={customerPicture} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {(customerName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{customerName}</p>
                    <p className="text-xs text-slate-500 truncate">{customerEmail}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onTabChange("find")}
                  className="w-full h-10 rounded-xl border-emerald-200"
                >
                  Find parcels
                </Button>
              </div>
            ) : (
              <CustomerEmailAuthForm
                phone={phone}
                mode={authMode}
                onModeChange={onAuthModeChange}
                onSuccess={onAuthSuccess}
                onGoogleSuccess={onGoogleSuccess}
              />
            )}
          </div>
        )}

        {tab === "find" && (
          <div className="space-y-4">
            <GhanaPhoneInput
              id="track-phone"
              value={phone}
              onChange={onPhoneChange}
              disabled={loading}
              className="rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white py-3.5"
            />

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading || !validatePhoneNumber(phone)}
              className="w-full h-11 bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find parcels
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>

    <ReceiveFooter variant="search" />
  </div>
);
