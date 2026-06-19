import { Loader2, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { GhanaPhoneInput } from "../../../components/GhanaPhoneInput";
import { validatePhoneNumber } from "../../../utils/dataHelpers";
import { ReceiveFooter } from "./ReceiveFooter";

interface Props {
  phone: string;
  loading: boolean;
  error: string;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
}

export const PhoneSearchStep = ({ phone, loading, error, onPhoneChange, onSubmit }: Props) => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="text-center px-2">
      <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Receive your parcel</h1>
      <p className="text-slate-600 mt-2 text-sm">
        Pick up at a branch or request delivery to your location. We&apos;ll verify your phone first.
      </p>
    </div>

    <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="track-phone" className="text-sm font-medium text-neutral-700">
            Phone number
          </label>
          <GhanaPhoneInput
            id="track-phone"
            value={phone}
            onChange={onPhoneChange}
            disabled={loading}
            className="rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white py-3"
          />
          <p className="text-xs text-slate-500">Ghana numbers only — 10 digits</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || !validatePhoneNumber(phone)}
          className="w-full bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl h-11 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find my parcels
            </>
          )}
        </Button>
      </CardContent>
    </Card>

    <ReceiveFooter variant="search" />
  </div>
);
