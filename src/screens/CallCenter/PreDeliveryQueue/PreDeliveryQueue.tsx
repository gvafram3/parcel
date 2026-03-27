import { useState, useEffect, useCallback } from "react";
import {
    Loader, PhoneCall, X, Package, MapPin, Home, Store,
    RefreshCw, ChevronDown, User, Phone, PhoneOff,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
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
    senderName?: string;
    parcelDescription?: string;
    inboundCost?: number;
    deliveryCost?: number;
    hasCalled?: boolean;
    homeDelivery?: boolean;
    createdAt?: number;
    shelfName?: string;
}

type QueueTab = "uncalled" | "called-pickup";

export const PreDeliveryQueue = () => {
    const { showToast } = useToast();
    const { stations } = useLocation();

    const [tab, setTab] = useState<QueueTab>("uncalled");
    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

    // Edit modal
    const [editParcel, setEditParcel] = useState<Parcel | null>(null);
    const [homeDelivery, setHomeDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCost, setDeliveryCost] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchParcels = useCallback(async (page = 0, currentTab: QueueTab = tab) => {
        if (!selectedOfficeId) return;
        setLoading(true);
        try {
            const response = await adminService.searchParcels({
                officeId: selectedOfficeId,
                isDelivered: false,
                isParcelAssigned: false,
                hasCalled: currentTab === "uncalled" ? false : true,
                page,
                size: 20,
            });
            if (response.success && response.data) {
                const data = response.data as any;
                let content: Parcel[] = Array.isArray(data.content) ? data.content : [];
                // For called-pickup tab, exclude parcels that have homeDelivery=true (those are in watchlist)
                if (currentTab === "called-pickup") {
                    content = content.filter(p => !p.homeDelivery);
                }
                setParcels(content);
                setPagination({
                    page: data.number ?? page,
                    size: data.size ?? 20,
                    totalElements: content.length,
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
    }, [selectedOfficeId, tab, showToast]);

    useEffect(() => {
        if (selectedOfficeId) fetchParcels(0, tab);
        else setParcels([]);
    }, [selectedOfficeId, tab]);

    const handleTabChange = (newTab: QueueTab) => {
        setTab(newTab);
        setParcels([]);
    };

    const openEdit = (parcel: Parcel) => {
        setEditParcel(parcel);
        setHomeDelivery(parcel.homeDelivery ?? false);
        setDeliveryAddress(parcel.receiverAddress ?? "");
        setDeliveryCost(parcel.deliveryCost ? String(parcel.deliveryCost) : "");
    };

    const handleSave = async () => {
        if (!editParcel) return;
        if (homeDelivery && !deliveryAddress.trim()) {
            showToast("Please enter a delivery address", "warning");
            return;
        }
        setSaving(true);
        try {
            const response = await frontdeskService.updateParcel(editParcel.parcelId, {
                hasCalled: true,
                homeDelivery,
                receiverAddress: deliveryAddress.trim() || undefined,
                deliveryCost: homeDelivery ? parseFloat(deliveryCost) || 0 : 0,
            });
            if (response.success) {
                showToast("Parcel updated successfully", "success");
                setEditParcel(null);
                // Remove from current list — it will move to watchlist if homeDelivery=true
                setParcels(prev => prev.filter(p => p.parcelId !== editParcel.parcelId));
            } else {
                showToast(response.message || "Failed to update parcel", "error");
            }
        } catch {
            showToast("Failed to update parcel", "error");
        } finally {
            setSaving(false);
        }
    };

    const tabs: { key: QueueTab; label: string; desc: string }[] = [
        { key: "uncalled", label: "Not Called", desc: "Registered parcels awaiting first contact" },
        { key: "called-pickup", label: "Called – Station Pickup", desc: "Already called, client chose station pickup" },
    ];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header>
                    <h1 className="text-xl font-bold text-neutral-800">Pre-Delivery Queue</h1>
                    <p className="text-xs text-[#5d5d5d] mt-0.5">
                        Call registered clients, confirm delivery preference, and update parcel details.
                    </p>
                </header>

                {/* Tab toggle */}
                <div className="flex gap-2 border-b border-[#d1d1d1]">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.key
                                    ? "border-[#ea690c] text-[#ea690c]"
                                    : "border-transparent text-gray-500 hover:text-neutral-800"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <p className="text-xs text-[#5d5d5d] -mt-2">
                    {tabs.find(t => t.key === tab)?.desc}
                </p>

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
                                onClick={() => fetchParcels(0, tab)}
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

                {/* Stats */}
                {selectedOfficeId && !loading && (
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-neutral-800">{pagination.totalElements}</span> parcels in this view
                    </p>
                )}

                {/* Table */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-0">
                        {!selectedOfficeId ? (
                            <div className="text-center py-16">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-[#5d5d5d]">Select a station to load the queue.</p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-16">
                                <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-3 animate-spin" />
                                <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                            </div>
                        ) : parcels.length === 0 ? (
                            <div className="text-center py-16">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-neutral-800">No parcels found</p>
                                <p className="text-xs text-[#5d5d5d] mt-1">
                                    {tab === "uncalled" ? "All parcels at this station have been called." : "No called station-pickup parcels at this station."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-[#d1d1d1]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Shelf</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Inbound</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Registered</th>
                                            {tab === "called-pickup" && (
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Status</th>
                                            )}
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
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.shelfName || "—"}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-neutral-800">
                                                    {p.inboundCost ? formatCurrency(p.inboundCost) : "—"}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "—"}
                                                </td>
                                                {tab === "called-pickup" && (
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Station Pickup</Badge>
                                                    </td>
                                                )}
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
                                                            onClick={() => openEdit(p)}
                                                            size="sm"
                                                            className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                        >
                                                            {tab === "called-pickup" ? "Request Delivery" : "Update"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading && pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-[#d1d1d1] flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    {pagination.page * pagination.size + 1}–{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => fetchParcels(pagination.page - 1, tab)} disabled={pagination.page === 0} variant="outline" size="sm">Previous</Button>
                                    <Button onClick={() => fetchParcels(pagination.page + 1, tab)} disabled={pagination.page >= pagination.totalPages - 1} variant="outline" size="sm">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Update / Request Delivery Modal */}
            {editParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">
                                        {tab === "called-pickup" ? "Request Home Delivery" : "Update Delivery Preference"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-600">{editParcel.receiverName || "N/A"}</span>
                                        {editParcel.recieverPhoneNumber && (
                                            <>
                                                <Phone className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                                <a href={`tel:${editParcel.recieverPhoneNumber}`} className="text-xs text-[#ea690c] hover:underline">
                                                    {formatPhoneNumber(editParcel.recieverPhoneNumber)}
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setEditParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2 block">Delivery Preference</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${!homeDelivery ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                            <input type="radio" checked={!homeDelivery} onChange={() => setHomeDelivery(false)} className="w-4 h-4 text-[#ea690c]" />
                                            <div className="flex items-center gap-1.5">
                                                <Store className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-neutral-800">Station Pickup</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${homeDelivery ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                            <input type="radio" checked={homeDelivery} onChange={() => setHomeDelivery(true)} className="w-4 h-4 text-[#ea690c]" />
                                            <div className="flex items-center gap-1.5">
                                                <Home className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-neutral-800">Home Delivery</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {homeDelivery && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">
                                                Delivery Address <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter full delivery address"
                                                className="h-9 border-[#d1d1d1] focus:border-[#ea690c]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Delivery Fee (GHC)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={deliveryCost}
                                                onChange={e => setDeliveryCost(e.target.value)}
                                                placeholder="e.g. 15.00"
                                                className="h-9 border-[#d1d1d1] focus:border-[#ea690c]"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 border border-[#f0f0f0]">
                                    {editParcel.shelfName && <p>Shelf: <span className="font-medium text-neutral-800">{editParcel.shelfName}</span></p>}
                                    {editParcel.inboundCost !== undefined && <p>Inbound Cost: <span className="font-medium text-neutral-800">{formatCurrency(editParcel.inboundCost)}</span></p>}
                                    {editParcel.senderName && <p>Sender: <span className="font-medium text-neutral-800">{editParcel.senderName}</span></p>}
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <Button onClick={() => setEditParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={saving}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || (homeDelivery && !deliveryAddress.trim())}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {saving ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save"}
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
