import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { maskPhone } from "../trackParcelUtils";
import { TRACK_OTP_BYPASS } from "../trackOtpMock";
import { OtpDigitInput } from "./OtpDigitInput";

interface Props {
  phone: string;
  parcelCount: number;
  loading: boolean;
  sending: boolean;
  error: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  otp: string;
}

export const OtpVerifyStep = ({
  phone,
  parcelCount,
  loading,
  sending,
  error,
  otp,
  onOtpChange,
  onVerify,
  onResend,
}: Props) => {
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || sending) return;
    setCooldown(30);
    onResend();
  };

  const tryAutoVerify = useCallback(
    (code: string) => {
      if (!TRACK_OTP_BYPASS && code.length === 6 && !loading) onVerify();
    },
    [loading, onVerify],
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="text-center px-2">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-[#ea690c]" />
        </div>
        <h1 className="text-xl font-bold text-neutral-800">Verify phone</h1>
        <p className="text-slate-600 mt-1.5 text-sm">
          Code sent to <span className="font-semibold text-neutral-800">{maskPhone(phone)}</span>
          {parcelCount > 0 && (
            <>
              {" "}
              · {parcelCount} parcel{parcelCount !== 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <OtpDigitInput
              value={otp}
              onChange={onOtpChange}
              onComplete={tryAutoVerify}
              disabled={loading}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {TRACK_OTP_BYPASS && import.meta.env.DEV && (
            <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Dev mode: OTP check is off — tap continue with any or no code.
            </p>
          )}

          <Button
            type="button"
            onClick={onVerify}
            disabled={loading || (!TRACK_OTP_BYPASS && otp.length !== 6)}
            className="w-full bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl h-11 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify & continue"
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || sending}
              className="font-medium text-[#ea690c] hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              {sending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
