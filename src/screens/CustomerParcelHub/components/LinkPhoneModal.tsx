import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { GhanaPhoneInput } from "../../../components/GhanaPhoneInput";
import { validatePhoneNumber } from "../../../utils/dataHelpers";
import type { GoogleCredentialPayload } from "../../../utils/googleAuth";

interface Props {
  profile: GoogleCredentialPayload;
  onClose: () => void;
  onSubmit: (phone: string) => void;
  loading?: boolean;
}

export const LinkPhoneModal = ({ profile, onClose, onSubmit, loading }: Props) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(phone)) {
      setError("Enter a valid Ghana phone number.");
      return;
    }
    setError("");
    onSubmit(phone);
  };

  return (
    <div className="fixed inset-0 z-[10060] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {profile.picture ? (
                <img src={profile.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#ea690c] font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-neutral-800 truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-neutral-800 mb-4">Link phone</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GhanaPhoneInput
              id="link-phone"
              value={phone}
              onChange={value => {
                setPhone(value);
                setError("");
              }}
              disabled={loading}
              className="rounded-xl border-slate-200 bg-slate-50/60 py-3"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !validatePhoneNumber(phone)}
              className="w-full h-11 bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
