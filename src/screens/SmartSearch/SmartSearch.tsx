import { useState } from "react";
import { SearchIcon, Loader, Eye, X, CheckCircle, ChevronDown } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { searchParcelsByPhone, type CustomerParcel } from "../../services/customerService";
import frontdeskService from "../../services/frontdeskService";
import { formatPhoneNumber, validatePhoneNumber, normalizePhoneNumber } from "../../utils/dataHelpers";
import { useToast } from "../../components/ui/toast";

type Tab = "all" | "pending" | "pickedup" | "delivered";

function getStatusLabel(p: CustomerParcel): string {
    if (p.delivered)           return "Delivered";
    if ((p as any).pickedUp)   return "Picked Up";
    if (p.pod)                 return "POD";
    if (p.parcelAssigned)      return "Assigned";
    if ((p as any).hasCalled)  return "Called";
    return "Registered";
}

function getStatusColor(label: string): string {
    if (label === "Delivered")  return "bg-green-100 text-green-800";
    if (label === "Picked Up")  return "bg-orange-100 text-orange-800";
    if (label === "Assigned")   return "bg-blue-100 text-blue-800";
    if (label === "POD")        return "bg-purple-100 text-purple-800";
    if (label === "Called")     return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
}

export const SmartSearch = (): JSX.Element => {
    const { showToast } = useToast();
    const [phoneInput, setPhoneInput]   = useState("");
    const [loading, setLoading]         = useState(false);
    const [parcels, setParcels]         = useState<CustomerParcel[]>([]);
    const [searched, setSearched]       = useState(false);
    const [error, setError]             = useState("");
    const [selectedParcel, setSelectedParcel] = useState<CustomerParcel | null>(null);
    const [deliveryParcel, setDeliveryParcel] = useState<CustomerParcel | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCost, setDeliveryCost] = useState("");
    const [pickupCost, setPickupCost] = useState("");
    const [savingDelivery, setSavingDelivery] = useState(false);
    const [showCosts, setShowCosts] = useState(false);
    const [showDeliveryFees, setShowDeliveryFees] = useState(false);
    const [activeTab, setActiveTab]     = useState<Tab>("all");
    const [markPickupLoading, setMarkPickupLoading] = useState(false);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [pickupIsOwner, setPickupIsOwner] = useState(true);
    const [pickupName, setPickupName] = useState("");
    const [pickupPhone, setPickupPhone] = useState("");

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const q = phoneInput.trim();
        if (!q) { setError("Please enter a phone number."); return; }
        setError(""); setParcels([]); setSelectedParcel(null); setSearched(false); setLoading(true);
        try {
            const res = await searchParcelsByPhone(q);
            setSearched(true);
            if (res.success && res.data) {
                setParcels(res.data);
                if (res.data.length === 0) setError("No parcels found for this number.");
            } else {
                setError(res.message || "Search failed. Please try again.");
            }
        } catch {
            setSearched(true);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPickedUp = async () => {
        if (!selectedParcel) return;
        setMarkPickupLoading(true);
        try {
            const name  = pickupIsOwner ? (selectedParcel.receiverName || "") : pickupName.trim();
            const phone = pickupIsOwner ? (selectedParcel.recieverPhoneNumber || "") : normalizePhoneNumber(pickupPhone.trim());
            const res = await frontdeskService.markParcelPickedUp(selectedParcel.parcelId, name || undefined, phone || undefined);
            if (res.success) {
                showToast("Parcel marked as picked up", "success");
                const updated = { ...selectedParcel, pickedUp: true, hasCalled: true } as any;
                setParcels(prev => prev.map(p => p.parcelId === selectedParcel.parcelId ? updated : p));
                setSelectedParcel(updated);
                setShowPickupModal(false);
            } else {
                showToast(res.message || "Failed to update parcel", "error");
            }
        } catch {
            showToast("Failed to update parcel. Please try again.", "error");
        } finally {
            setMarkPickupLoading(false);
        }
    };

    const handleRequestDelivery = async () => {
        if (!deliveryParcel) return;
        if (!deliveryAddress.trim()) { showToast("Please enter a delivery address", "warning"); return; }
        setSavingDelivery(true);
        try {
            const res = await frontdeskService.updateParcel(deliveryParcel.parcelId, {
                homeDelivery: true,
                hasCalled: true,
                receiverAddress: deliveryAddress.trim(),
                deliveryCost: parseFloat(deliveryCost) || 0,
                pickUpCost: parseFloat(pickupCost) || 0,
            });
            if (res.success) {
                showToast("Home delivery requested successfully", "success");
                const updated = { ...deliveryParcel, homeDelivery: true, receiverAddress: deliveryAddress } as any;
                setParcels(prev => prev.map(p => p.parcelId === deliveryParcel.parcelId ? updated : p));
                setDeliveryParcel(null);
                setSelectedParcel(updated);
            } else {
                showToast(res.message || "Failed to request delivery", "error");
            }
        } catch {
            showToast("Failed to request delivery", "error");
        } finally {
            setSavingDelivery(false);
        }
    };

    const tabParcels: Record<Tab, CustomerParcel[]> = {
        all:       parcels,
        pending:   parcels.filter(p => !p.delivered && !(p as any).pickedUp),
        pickedup:  parcels.filter(p => (p as any).pickedUp && !p.delivered),
        delivered: parcels.filter(p => p.delivered),
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "all",       label: `All (${parcels.length})` },
        { key: "pending",   label: `Pending (${tabParcels.pending.length})` },
        { key: "pickedup",  label: `Picked Up (${tabParcels.pickedup.length})` },
        { key: "delivered", label: `Delivered (${tabParcels.delivered.length})` },
    ];

    const visibleParcels = tabParcels[activeTab];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">

                    {/* Search bar — identical to ParcelSearch */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-3 sm:p-4">
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-[#5d5d5d]" />
                                    <Input
                                        placeholder="Search by receiver or sender phone number..."
                                        value={phoneInput}
                                        onChange={e => { setPhoneInput(e.target.value); setError(""); }}
                                        className="pl-10 border border-[#d1d1d1]"
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                                >
                                    {loading
                                        ? <><Loader className="w-4 h-4 animate-spin" />Searching...</>
                                        : <><SearchIcon className="w-4 h-4" />Search</>}
                                </Button>
                            </form>
                            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                        </CardContent>
                    </Card>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-8">
                            <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                            <p className="text-sm text-neutral-700">Searching parcels...</p>
                        </div>
                    )}

                    {/* Empty state before search */}
                    {!searched && !loading && (
                        <div className="text-center py-16">
                            <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-[#5d5d5d]">Enter a phone number above to find parcels.</p>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && searched && parcels.length > 0 && (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-0 border-b border-[#d1d1d1]">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => { setActiveTab(tab.key); setSelectedParcel(null); }}
                                        className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                            activeTab === tab.key
                                                ? "border-[#ea690c] text-[#ea690c]"
                                                : "border-transparent text-[#5d5d5d] hover:text-neutral-800"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Count */}
                            <div className="flex items-center justify-between text-xs text-[#5d5d5d] -mt-4">
                                <span>Showing {visibleParcels.length} of {parcels.length} parcel(s)</span>
                                <button
                                    onClick={() => { setPhoneInput(""); setParcels([]); setSearched(false); setError(""); setSelectedParcel(null); setActiveTab("all"); }}
                                    className="text-[#ea690c] hover:underline font-medium"
                                >
                                    New search
                                </button>
                            </div>

                            {/* Table */}
                            <Card className="border border-[#d1d1d1] bg-white overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                                        <table className="w-full divide-y divide-[#d1d1d1] text-xs">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Recipient</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Address</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Sender</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Shelf</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Date</th>
                                                    <th className="py-2 px-2 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Status</th>
                                                    <th className="py-2 px-2 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                {visibleParcels.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="py-8 px-4 text-center">
                                                            <p className="text-xs text-neutral-700">No parcels in this category.</p>
                                                        </td>
                                                    </tr>
                                                ) : visibleParcels.map((parcel, index) => {
                                                    const statusLabel = getStatusLabel(parcel);
                                                    const statusColor = getStatusColor(statusLabel);
                                                    return (
                                                        <tr
                                                            key={parcel.parcelId}
                                                            className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} align-middle`}
                                                        >
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <p className="font-medium text-neutral-800 text-xs">{parcel.receiverName || "N/A"}</p>
                                                                {parcel.senderName && (
                                                                    <p className="text-[#5d5d5d] text-[10px] mt-0.5">From: {parcel.senderName}</p>
                                                                )}
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <div className="text-neutral-700 text-xs">
                                                                    {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 px-2">
                                                                <div className="text-neutral-700 text-xs max-w-[180px] truncate">
                                                                    {parcel.receiverAddress || "—"}
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <div className="text-neutral-700 text-xs">{parcel.senderName || "—"}</div>
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <span className="text-neutral-700 text-xs">{parcel.shelfName || "—"}</span>
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <div className="text-neutral-700 text-xs">
                                                                    {parcel.createdAt ? new Date(parcel.createdAt).toLocaleString() : "—"}
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap">
                                                                <Badge className={`${statusColor} text-[10px] px-1.5 py-0.5`}>
                                                                    {statusLabel}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-1.5 px-2 whitespace-nowrap text-center">
                                                                <Button
                                                                    onClick={() => { setSelectedParcel(parcel); setShowCosts(false); }}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border border-[#ea690c] text-[#ea690c] hover:bg-orange-50 h-7 px-2 text-xs"
                                                                >
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    <span className="hidden sm:inline">View</span>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* No results */}
                    {!loading && searched && parcels.length === 0 && !error && (
                        <div className="text-center py-8">
                            <p className="text-xs text-neutral-700">No parcels found for this phone number.</p>
                        </div>
                    )}

                </main>
            </div>

            {/* Parcel Details Modal — identical structure to ParcelSearch */}
            {selectedParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                                <button onClick={() => setSelectedParcel(null)} className="text-[#9a9a9a] hover:text-neutral-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">

                                {/* Basic Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Parcel ID</p>
                                            <p className="font-semibold text-neutral-800 text-sm">{selectedParcel.parcelId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Status</p>
                                            <Badge className={getStatusColor(getStatusLabel(selectedParcel))}>
                                                {getStatusLabel(selectedParcel)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Shelf Location</p>
                                            <p className="font-semibold text-neutral-800 text-sm">{selectedParcel.shelfName || "Not set"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Type</p>
                                            <p className="font-semibold text-neutral-800 text-sm">{selectedParcel.typeofParcel || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recipient Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Recipient Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Recipient Name</p>
                                            <p className="font-semibold text-neutral-800 text-sm">{selectedParcel.receiverName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Phone Number</p>
                                            <p className="font-semibold text-neutral-800 text-sm">
                                                {selectedParcel.recieverPhoneNumber ? formatPhoneNumber(selectedParcel.recieverPhoneNumber) : "N/A"}
                                            </p>
                                        </div>
                                        {(selectedParcel as any).alternativePhoneNumber && (
                                            <div>
                                                <p className="text-xs text-[#5d5d5d] mb-1">Alternative Phone</p>
                                                <p className="font-semibold text-neutral-800 text-sm">
                                                    {formatPhoneNumber((selectedParcel as any).alternativePhoneNumber)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedParcel.receiverAddress && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-[#5d5d5d] mb-1">Delivery Address</p>
                                                <p className="text-sm text-neutral-700">{selectedParcel.receiverAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sender Information */}
                                {(selectedParcel.senderName || selectedParcel.senderPhoneNumber) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Sender Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedParcel.senderName && (
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d] mb-1">Sender Name</p>
                                                    <p className="font-semibold text-neutral-800 text-sm">{selectedParcel.senderName}</p>
                                                </div>
                                            )}
                                            {selectedParcel.senderPhoneNumber && (
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d] mb-1">Sender Phone</p>
                                                    <p className="font-semibold text-neutral-800 text-sm">{formatPhoneNumber(selectedParcel.senderPhoneNumber)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Inbound & Storage — always visible */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Costs</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedParcel.inboundCost != null && (
                                            <div>
                                                <p className="text-xs text-[#5d5d5d] mb-1">Inbound Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">GHC {selectedParcel.inboundCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {selectedParcel.storageCost != null && (
                                            <div>
                                                <p className="text-xs text-[#5d5d5d] mb-1">Storage Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">GHC {selectedParcel.storageCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery & Pickup — collapsible */}
                                <div className="border border-[#d1d1d1] rounded-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowCosts(prev => !prev)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <h4 className="text-sm font-semibold text-neutral-800">Delivery & Pickup Fees</h4>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCosts ? "rotate-180" : ""}`} />
                                    </button>
                                    {showCosts && (
                                        <div className="grid grid-cols-2 gap-4 p-4">
                                            {selectedParcel.deliveryCost != null && (
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d] mb-1">Delivery Fee</p>
                                                    <p className="font-semibold text-[#ea690c] text-sm">GHC {selectedParcel.deliveryCost.toFixed(2)}</p>
                                                </div>
                                            )}
                                            {selectedParcel.pickUpCost != null && (
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d] mb-1">Pickup Cost</p>
                                                    <p className="font-semibold text-[#ea690c] text-sm">GHC {selectedParcel.pickUpCost.toFixed(2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Item Description */}
                                {selectedParcel.parcelDescription && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Item Description</h4>
                                        <p className="text-sm text-neutral-700">{selectedParcel.parcelDescription}</p>
                                    </div>
                                )}

                                {/* Additional Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Additional Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Has Called</p>
                                            <Badge className={(selectedParcel as any).hasCalled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                {(selectedParcel as any).hasCalled ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] mb-1">Inbound Paid</p>
                                            <Badge className={(selectedParcel as any).inboudPayed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                {(selectedParcel as any).inboudPayed ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        {selectedParcel.homeDelivery != null && (
                                            <div>
                                                <p className="text-xs text-[#5d5d5d] mb-1">Home Delivery</p>
                                                <Badge className={selectedParcel.homeDelivery ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.homeDelivery ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {selectedParcel.createdAt && (
                                            <div>
                                                <p className="text-xs text-[#5d5d5d] mb-1">Registered Date</p>
                                                <p className="font-semibold text-neutral-800 text-sm">
                                                    {new Date(selectedParcel.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pickup status + action */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {(selectedParcel as any).pickedUp ? (
                                            <Badge className="bg-green-100 text-green-800">Picked Up</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">Not Picked Up</Badge>
                                        )}
                                        <span className="text-sm text-[#5d5d5d]">
                                            Has Called: {(selectedParcel as any).hasCalled ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    {!(selectedParcel as any).pickedUp && (
                                        <Button
                                            onClick={() => { setPickupIsOwner(true); setPickupName(""); setPickupPhone(""); setShowPickupModal(true); }}
                                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />Mark Picked Up
                                        </Button>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-[#d1d1d1] flex gap-3">
                                    {!selectedParcel.delivered && !selectedParcel.homeDelivery && (
                                        <Button
                                            onClick={() => {
                                                setDeliveryParcel(selectedParcel);
                                                setDeliveryAddress(selectedParcel.receiverAddress || "");
                                                setDeliveryCost(selectedParcel.deliveryCost ? String(selectedParcel.deliveryCost) : "");
                                                setPickupCost("");
                                                setShowDeliveryFees(false);
                                            }}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a]"
                                        >
                                            Request Home Delivery
                                        </Button>
                                    )}
                                    <Button onClick={() => setSelectedParcel(null)} variant="outline" className="flex-1 border border-[#d1d1d1]">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Pickup Modal */}
            {showPickupModal && selectedParcel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">Mark as Picked Up</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-0.5">{selectedParcel.receiverName || selectedParcel.parcelId}</p>
                                </div>
                                <button onClick={() => setShowPickupModal(false)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${pickupIsOwner ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                        <input type="radio" checked={pickupIsOwner} onChange={() => setPickupIsOwner(true)} className="w-4 h-4 text-[#ea690c]" />
                                        <div>
                                            <p className="text-sm font-medium text-neutral-800">Owner</p>
                                            <p className="text-xs text-gray-400">Receiver picked up</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${!pickupIsOwner ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                        <input type="radio" checked={!pickupIsOwner} onChange={() => setPickupIsOwner(false)} className="w-4 h-4 text-[#ea690c]" />
                                        <div>
                                            <p className="text-sm font-medium text-neutral-800">Someone Else</p>
                                            <p className="text-xs text-gray-400">Third party pickup</p>
                                        </div>
                                    </label>
                                </div>
                                {pickupIsOwner && (
                                    <div className="bg-gray-50 rounded-lg p-3 border border-[#f0f0f0] space-y-1 text-xs text-gray-600">
                                        <p>Name: <span className="font-medium text-neutral-800">{selectedParcel.receiverName || "N/A"}</span></p>
                                        <p>Phone: <span className="font-medium text-neutral-800">{selectedParcel.recieverPhoneNumber || "N/A"}</span></p>
                                    </div>
                                )}
                                {!pickupIsOwner && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Full Name <span className="text-[#e22420]">*</span></label>
                                            <Input value={pickupName} onChange={e => setPickupName(e.target.value)} placeholder="Name of person picking up" className="border-[#d1d1d1] focus:border-[#ea690c]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Phone Number <span className="text-[#e22420]">*</span></label>
                                            <Input
                                                value={pickupPhone}
                                                onChange={e => setPickupPhone(e.target.value)}
                                                placeholder="e.g. 0541234567"
                                                className={`border focus:border-[#ea690c] ${pickupPhone && !validatePhoneNumber(pickupPhone) ? "border-red-400" : "border-[#d1d1d1]"}`}
                                            />
                                            {pickupPhone && !validatePhoneNumber(pickupPhone) && (
                                                <p className="text-xs text-red-500 mt-1">Enter a valid Ghana phone number (e.g. 0541234567)</p>
                                            )}
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-3 pt-1">
                                    <Button onClick={() => setShowPickupModal(false)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={markPickupLoading}>Cancel</Button>
                                    <Button
                                        onClick={handleMarkPickedUp}
                                        disabled={markPickupLoading || (!pickupIsOwner && (!pickupName.trim() || !validatePhoneNumber(pickupPhone)))}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {markPickupLoading ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Confirm Pickup"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Request Delivery Modal */}
            {deliveryParcel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">Request Home Delivery</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-0.5">{deliveryParcel.receiverName || deliveryParcel.parcelId}</p>
                                </div>
                                <button onClick={() => setDeliveryParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                                        Delivery Address <span className="text-[#e22420]">*</span>
                                    </label>
                                    <Input
                                        value={deliveryAddress}
                                        onChange={e => setDeliveryAddress(e.target.value)}
                                        placeholder="Enter full delivery address"
                                        className="border-[#d1d1d1] focus:border-[#ea690c]"
                                    />
                                </div>

                                {/* Collapsible fees */}
                                <div className="border border-[#d1d1d1] rounded-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeliveryFees(prev => !prev)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-neutral-700"
                                    >
                                        <span>Fees & Costs</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDeliveryFees ? "rotate-180" : ""}`} />
                                    </button>
                                    {showDeliveryFees && (
                                        <div className="p-4 space-y-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Delivery Fee (GHC)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={deliveryCost}
                                                    onChange={e => setDeliveryCost(e.target.value)}
                                                    placeholder="e.g. 15.00"
                                                    className="border-[#d1d1d1] focus:border-[#ea690c]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Pickup Cost (GHC)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={pickupCost}
                                                    onChange={e => setPickupCost(e.target.value)}
                                                    placeholder="e.g. 10.00"
                                                    className="border-[#d1d1d1] focus:border-[#ea690c]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={() => setDeliveryParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={savingDelivery}>Cancel</Button>
                                    <Button
                                        onClick={handleRequestDelivery}
                                        disabled={savingDelivery || !deliveryAddress.trim()}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {savingDelivery ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Confirm Request"}
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
