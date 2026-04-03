import { useState, useEffect, useCallback } from "react";
import {
    Loader, Home, MapPin, ChevronDown, RefreshCw,
    Package, X, PhoneCall, XCircle, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../components/ui/toast";
import { useLocation } from "../../../contexts/LocationContext";
import { formatPhoneNumber, formatDate, formatCurrency } from "../../../utils/dataHelpers";
import adminService from "../../../services/adminService";
import frontdeskService from "../../../services/frontdeskService";

interface Parcel {
    parcelId: string;
    receiverName?: string;
    recieverPhoneNumber?: string;
    receiverAddress?: string;
    parcelDescription?: string;
    inboundCost?: number;
    deliveryCost?: number;
    homeDelivery?: boolean;
    hasCalled?: boolean;
    createdAt?: number;
    shelfName?: string;
    officeId?: string | { name?: string };
}

export const HomeDeliveryWatchlist = () => {
    const { showToast } = useToast();
    const { stations } = useLocation();

    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 50, totalElements: 0, totalPages: 0 });

    // Cancel confirm modal
    const [cancelParcel, setCancelParcel] = useState<Parcel | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const fetchParcels = useCallback(async (page = 0) => {
        if (!selectedOfficeId) return;
        setLoading(true);
        try {
            // Fetch called parcels that are not yet assigned/delivered — filter homeDelivery client-side
            const response = await adminService.searchParcels({
                officeId: selectedOfficeId,
                isDelivered: false,
                isParcelAssigned: false,
                hasCalled: true,
                page,
                size: 50,
            });
            if (response.success && response.data) {
                const data = response.data as any;
                const all: Parcel[] = Array.isArray(data.content) ? data.content : [];
                const homeDeliveryParcels = all.filter(p => p.homeDelivery === true);
                setParcels(homeDeliveryParcels);
                setPagination({
                    page: data.number ?? page,
                    size: data.size ?? 50,
                    totalElements: homeDeliveryParcels.length,
                    totalPages: data.totalPages ?? 1,
                });
            } else {
                showToast(response.message || "Failed to load parcels", "error");
                setParcels([]);
            }
        } catch {
            showToast("Failed to load parcels", "error");
            setParcels([]);
        } finally {
            setLoading(false);
        }
    }, [selectedOfficeId, showToast]);

    useEffect(() => {
        if (selectedOfficeId) fetchParcels(0);
        else setParcels([]);
    }, [selectedOfficeId, fetchParcels]);

    const handleCancelDelivery = async () => {
        if (!cancelParcel) return;
        setCancelling(true);
        try {
            const response = await frontdeskService.updateParcel(cancelParcel.parcelId, {
                homeDelivery: false,
                deliveryCost: 0,
                receiverAddress: "",
            });
            if (response.success) {
                showToast("Home delivery cancelled", "success");
                setCancelParcel(null);
                setParcels(prev => prev.filter(p => p.parcelId !== cancelParcel.parcelId));
            } else {
                showToast(response.message || "Failed to cancel delivery", "error");
            }
        } catch {
            showToast("Failed to cancel delivery", "error");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header>
                    <h1 className="text-xl font-bold text-neutral-800">Home Delivery Watchlist</h1>
                    <p className="text-xs text-[#5d5d5d] mt-0.5">
                        Parcels with pending home delivery requests not yet assigned to a rider. Cancel if client changes their mind.
                    </p>
                </header>

                {/* Station selector */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <Label className="text-xs text-[#5d5d5d] mb-1.5 block">Select Station</Label>
                                <div className="relative">
                                    <select
                                        value={selectedOfficeId}
                                        onChange={e => setSelectedOfficeId(e.target.value)}
                                        className="w-full h-9 pl-3 pr-8 border border-[#d1d1d1] rounded-md text-sm bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#ea690c]"
                                    >
                                        <option value="">— Choose a station —</option>
                                        {stations.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <Button
                                onClick={() => fetchParcels(0)}
                                disabled={!selectedOfficeId || loading}
                                variant="outline"
                                size="sm"
                                className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 h-9"
                            >
                                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                {selectedOfficeId && !loading && parcels.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-[#ea690c]" />
                        <span className="text-gray-500">
                            <span className="font-semibold text-neutral-800">{parcels.length}</span> parcels awaiting home delivery
                        </span>
                    </div>
                )}

                {/* Table */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-0">
                        {!selectedOfficeId ? (
                            <div className="text-center py-16">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-[#5d5d5d]">Select a station to load the watchlist.</p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-16">
                                <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-3 animate-spin" />
                                <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                            </div>
                        ) : parcels.length === 0 ? (
                            <div className="text-center py-16">
                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-neutral-800">No pending home deliveries</p>
                                <p className="text-xs text-[#5d5d5d] mt-1">All home delivery requests have been assigned or delivered.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-[#d1d1d1]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Delivery Address</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Delivery Fee</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Shelf</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Registered</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                        {parcels.map(p => (
                                            <tr key={p.parcelId} className="hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-sm text-neutral-800">{p.receiverName || "N/A"}</p>
                                                    {p.parcelDescription && (
                                                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.parcelDescription}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <a href={`tel:${p.recieverPhoneNumber}`} className="text-[#ea690c] hover:underline text-sm font-medium">
                                                        {p.recieverPhoneNumber ? formatPhoneNumber(p.recieverPhoneNumber) : "N/A"}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px] truncate" title={p.receiverAddress}>
                                                    {p.receiverAddress || <span className="text-amber-500 text-xs">No address set</span>}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-neutral-800">
                                                    {p.deliveryCost ? formatCurrency(p.deliveryCost) : <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.shelfName || "—"}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`tel:${p.recieverPhoneNumber}`}
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                                            title="Call"
                                                        >
                                                            <PhoneCall className="w-4 h-4" />
                                                        </a>
                                                        <Button
                                                            onClick={() => setCancelParcel(p)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8 px-3"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                                            Cancel Delivery
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">Cancel Home Delivery?</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-0.5">{cancelParcel.receiverName || cancelParcel.parcelId}</p>
                                </div>
                                <button onClick={() => setCancelParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                    This will remove the home delivery request and set the parcel back to <span className="font-semibold">station pickup</span>. The delivery fee and address will be cleared. The parcel will remain marked as called.
                                </div>

                                {/* Parcel summary */}
                                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 border border-[#f0f0f0]">
                                    {cancelParcel.receiverAddress && <p>Address: <span className="font-medium text-neutral-800">{cancelParcel.receiverAddress}</span></p>}
                                    {cancelParcel.deliveryCost !== undefined && <p>Delivery Fee: <span className="font-medium text-neutral-800">{formatCurrency(cancelParcel.deliveryCost)}</span></p>}
                                    {cancelParcel.recieverPhoneNumber && (
                                        <p>Phone: <a href={`tel:${cancelParcel.recieverPhoneNumber}`} className="font-medium text-[#ea690c] hover:underline">{formatPhoneNumber(cancelParcel.recieverPhoneNumber)}</a></p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={() => setCancelParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={cancelling}>
                                        Keep Delivery
                                    </Button>
                                    <Button
                                        onClick={handleCancelDelivery}
                                        disabled={cancelling}
                                        className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {cancelling ? <><Loader className="w-4 h-4 animate-spin mr-2" />Cancelling...</> : "Yes, Cancel Delivery"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
