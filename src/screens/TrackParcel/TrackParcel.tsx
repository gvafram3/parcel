import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PackageIcon,
  SearchIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  AlertCircleIcon,
  Loader2Icon,
  BanknoteIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { searchParcelsByPhone, type CustomerParcel } from "../../services/customerService";

function formatDate(ts: number | null | undefined): string {
  if (ts == null) return "—";
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts : ts);
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `GHC ${Math.round(amount).toLocaleString()}`;
}

/** Amount the customer has to pay (parcelAmount from API or sum of costs). */
function getAmountToPay(p: CustomerParcel): number | null {
  if (p.parcelAmount != null && !Number.isNaN(p.parcelAmount)) return Math.round(p.parcelAmount);
  const inbound = Number(p.inboundCost) || 0;
  const delivery = Number(p.deliveryCost) || 0;
  const storage = Number(p.storageCost) || 0;
  const pickup = Number(p.pickUpCost) || 0;
  const total = inbound + delivery + storage + pickup;
  return total > 0 ? total : null;
}

export const TrackParcel = (): JSX.Element => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parcels, setParcels] = useState<CustomerParcel[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setParcels([]);
    setSearched(false);
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const result = await searchParcelsByPhone(trimmed);
      setSearched(true);
      if (result.success && result.data) {
        setParcels(result.data);
        if (result.data.length === 0) {
          setError("No parcels found for this phone number.");
        } else {
          setError("");
        }
      } else {
        setError(result.message || "Search failed. Please try again.");
      }
    } catch {
      setSearched(true);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isNoResults = searched && parcels.length === 0 && error?.toLowerCase().includes("no parcels");
  const isApiError = error && !isNoResults;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#ea690c] rounded-lg flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-neutral-800">Mealex & Mailex</span>
          </div>
          <Link
            to="/login"
            className="text-sm text-slate-500 hover:text-[#ea690c] transition-colors"
          >
            Staff login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-6 sm:pt-10 pb-12 px-4">
        {/* Hero */}
        <div className="text-center max-w-lg mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 tracking-tight">
            Track your parcel
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Enter the phone number linked to your parcel. No account needed.
          </p>
        </div>

        {/* Search card */}
        <Card className="w-full max-w-md border border-slate-200/90 bg-white shadow-md rounded-2xl overflow-hidden mb-6">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="track-phone" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
                    +233
                  </span>
                  <Input
                    id="track-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhoneNumber(v);
                      setError("");
                    }}
                    placeholder="550123456"
                    className="pl-14 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white py-3 text-base"
                    disabled={loading}
                    aria-describedby={error ? "track-error" : undefined}
                  />
                  <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Enter 9 digits without 0 (e.g. 550123456)</p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl py-3 text-base font-medium shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-5 h-5" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error (API or validation) */}
        {isApiError && (
          <div
            id="track-error"
            role="alert"
            className="w-full max-w-md mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm flex items-start gap-3"
          >
            <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* No results (friendly empty state) */}
        {isNoResults && (
          <Card className="w-full max-w-md border border-slate-200 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <PackageIcon className="w-7 h-7 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">No parcels found</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xs mx-auto">
                We couldn&apos;t find any parcels for this number. Check the number or try the one used when sending.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {searched && parcels.length > 0 && (
          <div className="w-full max-w-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                {parcels.length} parcel{parcels.length !== 1 ? "s" : ""} found
              </h2>
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber("");
                  setParcels([]);
                  setSearched(false);
                  setError("");
                }}
                className="text-sm text-[#ea690c] hover:underline font-medium"
              >
                New search
              </button>
            </div>
            <div className="space-y-3">
              {parcels.map((p) => (
                <Card
                  key={p.parcelId}
                  className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-neutral-800">
                            {p.receiverName || "—"}
                          </span>
                          {p.delivered ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <ClockIcon className="w-3.5 h-3.5" />
                              In progress
                            </span>
                          )}
                          {p.typeofParcel && (
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                              {p.typeofParcel}
                            </span>
                          )}
                        </div>
                        {p.parcelDescription && (
                          <p className="text-sm text-slate-600">{p.parcelDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          {p.shelfName && (
                            <span className="flex items-center gap-1.5">
                              <PackageIcon className="w-4 h-4 text-slate-400" />
                              Shelf: {p.shelfName}
                            </span>
                          )}
                          {p.senderName && (
                            <span className="flex items-center gap-1.5">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                              From: {p.senderName}
                            </span>
                          )}
                          {p.receiverAddress && (
                            <span className="flex items-center gap-1.5">
                              <MapPinIcon className="w-4 h-4 text-slate-400" />
                              {p.receiverAddress}
                            </span>
                          )}
                        </div>
                        {(p.createdAt != null || p.updatedAt != null) && (
                          <p className="text-xs text-slate-400">
                            Updated: {formatDate(p.updatedAt ?? p.createdAt)}
                          </p>
                        )}

                        {/* Amount to pay & cost breakdown */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <BanknoteIcon className="w-4 h-4 text-[#ea690c]" />
                            Amount to pay
                          </p>
                          {getAmountToPay(p) != null ? (
                            <>
                              <p className="text-xl font-bold text-[#ea690c]">
                                {formatCurrency(getAmountToPay(p))}
                              </p>
                              {(Number(p.inboundCost) > 0 || Number(p.deliveryCost) > 0 || Number(p.storageCost) > 0 || Number(p.pickUpCost) > 0) && (
                                <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                                  {Number(p.inboundCost) > 0 && (
                                    <li>Inbound: {formatCurrency(p.inboundCost)}</li>
                                  )}
                                  {Number(p.deliveryCost) > 0 && (
                                    <li>Delivery: {formatCurrency(p.deliveryCost)}</li>
                                  )}
                                  {Number(p.storageCost) > 0 && (
                                    <li>Storage: {formatCurrency(p.storageCost)}</li>
                                  )}
                                  {Number(p.pickUpCost) > 0 && (
                                    <li>Pick-up: {formatCurrency(p.pickUpCost)}</li>
                                  )}
                                </ul>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">Contact your branch for the amount to pay.</p>
                          )}
                          {p.paymentMethod && (
                            <p className="text-xs text-slate-500 mt-1.5">
                              Payment: {p.paymentMethod}
                            </p>
                          )}
                          {p.inboudPayed === true && (
                            <p className="text-xs text-emerald-600 mt-0.5">Inbound paid</p>
                          )}
                        </div>

                        {/* Receiver phone */}
                        {p.recieverPhoneNumber && (
                          <p className="text-xs text-slate-500 mt-1">
                            Receiver: {p.recieverPhoneNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 sm:text-right">
                        <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                          {p.parcelId.length > 10 ? `${p.parcelId.slice(0, 10)}…` : p.parcelId}
                        </p>
                        {p.homeDelivery && (
                          <span className="inline-block mt-1.5 text-xs text-slate-500">Home delivery</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-10 text-center">
          <p className="text-xs text-slate-500 max-w-sm">
            Use the receiver or sender phone number. For help, contact your branch.
          </p>
        </footer>
      </main>
    </div>
  );
};
