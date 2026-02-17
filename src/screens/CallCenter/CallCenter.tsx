import React, { useState, useEffect } from "react";
import { PhoneIcon, CheckCircleIcon, Clock, DollarSign, Loader, X, MapPin, Package, User, Truck } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { calculateTotalAmount, formatDateTime } from "../../utils/dataHelpers";
import { formatPhoneNumber } from "../../utils/dataHelpers";
import frontdeskService, { ParcelResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
export const CallCenter = (): JSX.Element => {
    const { currentUser } = useStation();
    const { showToast } = useToast();
    const [parcels, setParcels] = useState<ParcelResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
    });
    const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(null);
    const [expandedParcelId, setExpandedParcelId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [deliveryPreference, setDeliveryPreference] = useState<"pickup" | "delivery">("delivery");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryFee, setDeliveryFee] = useState("");
    const [preferredDate, setPreferredDate] = useState("");
    const [callNotes, setCallNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Load uncalled parcels on mount and when page changes
    useEffect(() => {
        const fetchUncalledParcels = async () => {
            setLoading(true);
            try {
                const response = await frontdeskService.getUncalledParcels(pagination.page, pagination.size);
                if (response.success && response.data) {
                    const data = response.data as any;
                    const parcelsArray = Array.isArray(data.content) ? data.content : [];
                    setParcels(parcelsArray);
                    setPagination({
                        page: data.number || 0,
                        size: data.size || pagination.size,
                        totalElements: data.totalElements || 0,
                        totalPages: data.totalPages || 0,
                    });
                } else {
                    showToast(response.message || "Failed to load uncalled parcels", "error");
                    setParcels([]);
                }
            } catch (error) {
                console.error("Failed to fetch uncalled parcels:", error);
                showToast("Failed to load uncalled parcels. Please try again.", "error");
                setParcels([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUncalledParcels();
    }, [pagination.page, pagination.size, showToast]);

    // Refresh parcels after updates
    const handleRefresh = async () => {
        setLoading(true);
        try {
            const response = await frontdeskService.getUncalledParcels(pagination.page, pagination.size);
            if (response.success && response.data) {
                const data = response.data as any;
                const parcelsArray = Array.isArray(data.content) ? data.content : [];
                setParcels(parcelsArray);
                setPagination({
                    page: data.number || 0,
                    size: data.size || pagination.size,
                    totalElements: data.totalElements || 0,
                    totalPages: data.totalPages || 0,
                });
            }
        } catch (error) {
            console.error("Failed to refresh uncalled parcels:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleParcelSelect = (parcel: ParcelResponse) => {
        setSelectedParcel(parcel);
        setExpandedParcelId(parcel.parcelId);
        setDeliveryAddress(parcel.receiverAddress || "");
        setDeliveryFee((parcel.deliveryCost || 0).toString());
        // Set delivery preference based on existing homeDelivery status, default to delivery
        setDeliveryPreference(parcel.homeDelivery === false ? "pickup" : "delivery");
        setCallNotes(parcel.parcelDescription || "");
    };

    const handleViewDetails = (parcel: ParcelResponse) => {
        handleParcelSelect(parcel);
        setShowDetailsModal(true);
    };

    const handleMarkAsCalled = (parcel: ParcelResponse) => {
        // Show the same details modal as View/Edit button
        handleParcelSelect(parcel);
        setShowDetailsModal(true);
    };

    const handleSavePreferences = async () => {
        if (!selectedParcel || !currentUser) return;

        if (deliveryPreference === "delivery" && (!deliveryAddress || !deliveryFee)) {
            showToast("Please fill in delivery address and fee for home delivery", "warning");
            return;
        }

        setUpdating(true);
        try {
            const updateData: any = {
                hasCalled: true, // Mark as contacted
                homeDelivery: deliveryPreference === "delivery", // Set homeDelivery: true for delivery, false for pickup
                receiverAddress: deliveryPreference === "delivery" ? deliveryAddress : selectedParcel.receiverAddress,
                deliveryCost: deliveryPreference === "delivery" ? parseFloat(deliveryFee) : 0, // Set to 0 for pickup
                parcelDescription: callNotes || undefined,
            };

            const response = await frontdeskService.updateParcel(selectedParcel.parcelId, updateData);

            if (response.success) {
                showToast(`Preferences saved for ${selectedParcel.receiverName || selectedParcel.parcelId}`, "success");
                // Refresh parcels list
                await handleRefresh();
                setSelectedParcel(null);
                setExpandedParcelId(null);
                setShowDetailsModal(false);
                setDeliveryAddress("");
                setDeliveryFee("");
                setPreferredDate("");
                setCallNotes("");
                setDeliveryPreference("delivery");
            } else {
                showToast(response.message || "Failed to save preferences", "error");
            }
        } catch (error) {
            console.error("Save preferences error:", error);
            showToast("Failed to save preferences. Please try again.", "error");
        } finally {
            setUpdating(false);
        }
    };

    // const { uncontacted: uncontactedCount, contacted: contactedCount, ready: readyCount } = stats;

    const totalToCollect = selectedParcel
        ? calculateTotalAmount(
            selectedParcel.inboundCost || 0,
            deliveryPreference === "delivery" ? parseFloat(deliveryFee || "0") : 0,
            deliveryPreference
        )
        : 0;

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        {/* <div>
                            <h1 className="text-xl font-bold text-neutral-800">Call Center</h1>
                            <p className="text-xs text-[#5d5d5d] mt-0.5">
                                Contact customers and manage delivery preferences
                            </p>
                        </div> */}
                    </div>

                    {/* Statistics Card */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm text-[#5d5d5d]">Uncontacted Parcels</p>
                                    <h3 className="text-3xl font-bold text-[#e22420]">{pagination.totalElements}</h3>
                                </div>
                                <CheckCircleIcon className="w-12 h-12 text-[#e22420] opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcels Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                </div>
                            ) : parcels.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm text-[#5d5d5d]">
                                        All parcels contacted!
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-[#d1d1d1]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Recipient
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                            {parcels.map((parcel) => {
                                                const isExpanded = expandedParcelId === parcel.parcelId;
                                                const isSelected = selectedParcel?.parcelId === parcel.parcelId;

                                                return (
                                                    <React.Fragment key={parcel.parcelId}>
                                                        <tr
                                                            className={`transition-colors hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : ''
                                                                }`}
                                                        >
                                                            <td className="py-3 px-4 whitespace-nowrap">
                                                                <div>
                                                                    <p className="font-semibold text-neutral-800 text-sm">
                                                                        {parcel.receiverName || "N/A"}
                                                                    </p>
                                                                    {parcel.senderName && (
                                                                        <p className="text-xs text-[#5d5d5d] mt-0.5">
                                                                            From: {parcel.senderName}
                                                                        </p>
                                                                    )}
                                                                    {parcel.createdAt !== null && parcel.createdAt !== undefined && (
                                                                        <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            Registered: {formatDateTime(new Date(parcel.createdAt).toISOString())}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 whitespace-nowrap">
                                                                <a
                                                                    href={`tel:${parcel.recieverPhoneNumber}`}
                                                                    className="text-[#ea690c] hover:underline font-medium text-sm"
                                                                >
                                                                    {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                                                                </a>
                                                            </td>
                                                            <td className="py-3 px-4 whitespace-nowrap">
                                                                {parcel.hasCalled ? (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        Contacted
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        Uncontacted
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 whitespace-nowrap text-center">
                                                                {!parcel.hasCalled ? (
                                                                    <Button
                                                                        onClick={() => handleMarkAsCalled(parcel)}
                                                                        disabled={updating}
                                                                        size="sm"
                                                                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs h-7 px-3"
                                                                    >
                                                                        {updating && isSelected ? (
                                                                            <>
                                                                                <Loader className="w-3 h-3 animate-spin mr-1" />
                                                                                Calling...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <PhoneIcon className="w-3 h-3 mr-1" />
                                                                                Mark as Called
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={() => handleViewDetails(parcel)}
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border border-[#ea690c] text-[#ea690c] hover:bg-orange-50 text-xs h-7 px-3"
                                                                    >
                                                                        View/Edit
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {/* Expanded Row with Form - Only for uncontacted parcels being marked as called */}
                                                        {isExpanded && !parcel.hasCalled && (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-6 bg-orange-50/30">
                                                                    <div className="max-w-4xl mx-auto space-y-6">
                                                                        {/* Parcel Info */}
                                                                        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-[#d1d1d1]">
                                                                            <div>
                                                                                <p className="text-xs text-[#5d5d5d] mb-1">Parcel ID</p>
                                                                                <p className="font-semibold text-sm text-neutral-800">{parcel.parcelId}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-[#5d5d5d] mb-1">Shelf</p>
                                                                                <p className="font-semibold text-sm text-neutral-800">{parcel.shelfName || parcel.shelfNumber || "N/A"}</p>
                                                                            </div>
                                                                            {parcel.parcelDescription && (
                                                                                <div className="col-span-2">
                                                                                    <p className="text-xs text-[#5d5d5d] mb-1">Item Description</p>
                                                                                    <p className="text-sm text-neutral-700">{parcel.parcelDescription}</p>
                                                                                </div>
                                                                            )}
                                                                            {parcel.inboundCost && parcel.inboundCost > 0 && (
                                                                                <div className="col-span-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <DollarSign className="w-4 h-4 text-[#ea690c]" />
                                                                                        <span className="text-sm font-semibold text-[#ea690c]">
                                                                                            GHC {parcel.inboundCost.toFixed(2)} to collect
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Delivery Preference & Form */}
                                                                        <div className="space-y-4 p-4 bg-white rounded-lg border border-[#d1d1d1]">
                                                                            <h3 className="font-semibold text-neutral-800 text-sm mb-3">
                                                                                Delivery Preference
                                                                            </h3>
                                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${deliveryPreference === "pickup"
                                                                                    ? "border-[#ea690c] bg-orange-50"
                                                                                    : "border-[#d1d1d1] hover:bg-gray-50"
                                                                                    }`}>
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={`delivery-${parcel.parcelId}`}
                                                                                        value="pickup"
                                                                                        checked={deliveryPreference === "pickup"}
                                                                                        onChange={(e) => setDeliveryPreference(e.target.value as "pickup")}
                                                                                        className="w-4 h-4 text-[#ea690c]"
                                                                                    />
                                                                                    <div className="ml-3">
                                                                                        <p className="font-medium text-neutral-800 text-sm">Customer Pickup</p>
                                                                                        <p className="text-xs text-[#5d5d5d]">No delivery fee</p>
                                                                                    </div>
                                                                                </label>

                                                                                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${deliveryPreference === "delivery"
                                                                                    ? "border-[#ea690c] bg-orange-50"
                                                                                    : "border-[#d1d1d1] hover:bg-gray-50"
                                                                                    }`}>
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={`delivery-${parcel.parcelId}`}
                                                                                        value="delivery"
                                                                                        checked={deliveryPreference === "delivery"}
                                                                                        onChange={(e) => setDeliveryPreference(e.target.value as "delivery")}
                                                                                        className="w-4 h-4 text-[#ea690c]"
                                                                                    />
                                                                                    <div className="ml-3">
                                                                                        <p className="font-medium text-neutral-800 text-sm">Home Delivery</p>
                                                                                        <p className="text-xs text-[#5d5d5d]">Delivery fee applies</p>
                                                                                    </div>
                                                                                </label>
                                                                            </div>

                                                                            {/* Delivery Form Fields */}
                                                                            <div className="space-y-4 pt-4 border-t border-[#d1d1d1]">
                                                                                {deliveryPreference === "delivery" && (
                                                                                    <>
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            <div>
                                                                                                <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                                                                    Delivery Address <span className="text-[#e22420]">*</span>
                                                                                                </Label>
                                                                                                <Input
                                                                                                    value={deliveryAddress}
                                                                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                                                                    placeholder="Enter delivery address"
                                                                                                    className="border border-[#d1d1d1]"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                                                                    Delivery Fee (GHC) <span className="text-[#e22420]">*</span>
                                                                                                </Label>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={deliveryFee}
                                                                                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                                                                                    placeholder="e.g., 15.00"
                                                                                                    className="border border-[#d1d1d1]"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                                                                Preferred Delivery Date
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="date"
                                                                                                value={preferredDate}
                                                                                                onChange={(e) => setPreferredDate(e.target.value)}
                                                                                                className="border border-[#d1d1d1]"
                                                                                            />
                                                                                        </div>
                                                                                    </>
                                                                                )}

                                                                                <div>
                                                                                    <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                                                        Call Notes
                                                                                    </Label>
                                                                                    <textarea
                                                                                        value={callNotes}
                                                                                        onChange={(e) => setCallNotes(e.target.value)}
                                                                                        placeholder="Record any special notes from the customer"
                                                                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                                                                        rows={3}
                                                                                    />
                                                                                </div>

                                                                                {/* Summary */}
                                                                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                                                    <p className="text-xs font-semibold text-[#5d5d5d] mb-2">
                                                                                        TOTAL TO COLLECT
                                                                                    </p>
                                                                                    <div className="flex items-baseline justify-between">
                                                                                        <span className="text-sm text-neutral-700">
                                                                                            {deliveryPreference === "delivery"
                                                                                                ? `Delivery + Item Value`
                                                                                                : "Item Value"}
                                                                                        </span>
                                                                                        <span className="text-2xl font-bold text-[#ea690c]">
                                                                                            GHC {totalToCollect.toFixed(2)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Action Buttons */}
                                                                                <div className="flex gap-3 pt-2">
                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            setExpandedParcelId(null);
                                                                                            setSelectedParcel(null);
                                                                                        }}
                                                                                        variant="outline"
                                                                                        className="flex-1 border border-[#d1d1d1]"
                                                                                    >
                                                                                        Cancel
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={handleSavePreferences}
                                                                                        disabled={
                                                                                            updating ||
                                                                                            (deliveryPreference === "delivery" &&
                                                                                                (!deliveryAddress || !deliveryFee))
                                                                                        }
                                                                                        className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                                                                    >
                                                                                        {updating ? (
                                                                                            <>
                                                                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                                                                Saving...
                                                                                            </>
                                                                                        ) : (
                                                                                            "Save & Mark Ready"
                                                                                        )}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                    <div className="text-sm text-neutral-700">
                                        Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} parcels
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                                            }}
                                            disabled={pagination.page === 0 || loading}
                                            variant="outline"
                                            size="sm"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                                            }}
                                            disabled={pagination.page >= pagination.totalPages - 1 || loading}
                                            variant="outline"
                                            size="sm"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Parcel Details & Edit Modal */}
            {selectedParcel && showDetailsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl border border-[#d1d1d1] bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-800">Parcel Details & Edit</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-1">Update delivery preferences and customer information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedParcel(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800 transition-colors p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-sm font-bold text-blue-900">Basic Information</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 mb-1">Parcel ID</p>
                                            <p className="font-bold text-sm text-blue-900 break-all">{selectedParcel.parcelId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 mb-1">Shelf Location</p>
                                            <p className="font-semibold text-sm text-blue-900">{selectedParcel.shelfName || selectedParcel.shelfNumber || "Not set"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 mb-1">Status</p>
                                            <Badge className={
                                                selectedParcel.delivered
                                                    ? "bg-green-100 text-green-800"
                                                    : selectedParcel.parcelAssigned
                                                        ? "bg-blue-100 text-blue-800"
                                                        : selectedParcel.pod
                                                            ? "bg-purple-100 text-purple-800"
                                                            : selectedParcel.hasCalled
                                                                ? "bg-orange-100 text-orange-800"
                                                                : "bg-gray-100 text-gray-800"
                                            }>
                                                {selectedParcel.delivered
                                                    ? "Delivered"
                                                    : selectedParcel.parcelAssigned
                                                        ? "Assigned"
                                                        : selectedParcel.pod
                                                            ? "POD"
                                                            : selectedParcel.hasCalled
                                                                ? "Contacted"
                                                                : "Registered"}
                                            </Badge>
                                        </div>
                                        {selectedParcel.fragile !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-blue-700 mb-1">Fragile</p>
                                                <Badge className={selectedParcel.fragile ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.fragile ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {selectedParcel.homeDelivery !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-blue-700 mb-1">Home Delivery</p>
                                                <Badge className={selectedParcel.homeDelivery ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.homeDelivery ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    {selectedParcel.parcelDescription && (
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <p className="text-xs font-medium text-blue-700 mb-1">Item Description</p>
                                            <p className="text-sm text-blue-900">{selectedParcel.parcelDescription}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Recipient Information */}
                                <div className="bg-white p-5 rounded-lg border border-[#d1d1d1] shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5 text-[#ea690c]" />
                                        <h4 className="text-sm font-bold text-neutral-800">Recipient Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-[#5d5d5d] mb-1">Recipient Name</p>
                                            <p className="font-semibold text-sm text-neutral-800">{selectedParcel.receiverName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-[#5d5d5d] mb-1">Phone Number</p>
                                            <a
                                                href={`tel:${selectedParcel.recieverPhoneNumber}`}
                                                className="text-[#ea690c] hover:underline font-semibold text-sm flex items-center gap-1"
                                            >
                                                <PhoneIcon className="w-4 h-4" />
                                                {selectedParcel.recieverPhoneNumber ? formatPhoneNumber(selectedParcel.recieverPhoneNumber) : "N/A"}
                                            </a>
                                        </div>
                                        {selectedParcel.receiverAddress && (
                                            <div className="col-span-1 md:col-span-2">
                                                <p className="text-xs font-medium text-[#5d5d5d] mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Delivery Address
                                                </p>
                                                <p className="text-sm text-neutral-700 bg-gray-50 p-2 rounded border border-gray-200">{selectedParcel.receiverAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sender Information */}
                                {(selectedParcel.senderName || selectedParcel.senderPhoneNumber) && (
                                    <div className="bg-white p-5 rounded-lg border border-[#d1d1d1] shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <h4 className="text-sm font-bold text-neutral-800">Sender Information</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedParcel.senderName && (
                                                <div>
                                                    <p className="text-xs font-medium text-[#5d5d5d] mb-1">Sender Name</p>
                                                    <p className="font-semibold text-sm text-neutral-800">{selectedParcel.senderName}</p>
                                                </div>
                                            )}
                                            {selectedParcel.senderPhoneNumber && (
                                                <div>
                                                    <p className="text-xs font-medium text-[#5d5d5d] mb-1">Sender Phone</p>
                                                    <a
                                                        href={`tel:${selectedParcel.senderPhoneNumber}`}
                                                        className="text-blue-600 hover:underline font-semibold text-sm flex items-center gap-1"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        {formatPhoneNumber(selectedParcel.senderPhoneNumber)}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Driver Information */}
                                {selectedParcel.driverName && (
                                    <div className="bg-white p-5 rounded-lg border border-[#d1d1d1] shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Truck className="w-5 h-5 text-green-600" />
                                            <h4 className="text-sm font-bold text-neutral-800">Driver Information</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-[#5d5d5d] mb-1">Driver Name</p>
                                                <p className="font-semibold text-sm text-neutral-800">{selectedParcel.driverName}</p>
                                            </div>
                                            {selectedParcel.driverPhoneNumber && (
                                                <div>
                                                    <p className="text-xs font-medium text-[#5d5d5d] mb-1">Driver Phone</p>
                                                    <a
                                                        href={`tel:${selectedParcel.driverPhoneNumber}`}
                                                        className="text-green-600 hover:underline font-semibold text-sm flex items-center gap-1"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        {formatPhoneNumber(selectedParcel.driverPhoneNumber)}
                                                    </a>
                                                </div>
                                            )}
                                            {selectedParcel.vehicleNumber && (
                                                <div>
                                                    <p className="text-xs font-medium text-[#5d5d5d] mb-1">Vehicle Number</p>
                                                    <p className="font-semibold text-sm text-neutral-800">{selectedParcel.vehicleNumber}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Costs Information */}
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <DollarSign className="w-5 h-5 text-[#ea690c]" />
                                        <h4 className="text-sm font-bold text-orange-900">Costs</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {selectedParcel.inboundCost !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-orange-700 mb-1">Inbound Cost</p>
                                                <p className="font-bold text-sm text-orange-900">GHC {selectedParcel.inboundCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {selectedParcel.pickUpCost !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-orange-700 mb-1">Pick Up Cost</p>
                                                <p className="font-bold text-sm text-orange-900">GHC {selectedParcel.pickUpCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {selectedParcel.deliveryCost !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-orange-700 mb-1">Delivery Cost</p>
                                                <p className="font-bold text-sm text-orange-900">GHC {selectedParcel.deliveryCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {selectedParcel.storageCost !== undefined && (
                                            <div>
                                                <p className="text-xs font-medium text-orange-700 mb-1">Storage Cost</p>
                                                <p className="font-bold text-sm text-orange-900">GHC {selectedParcel.storageCost.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Preference & Form */}
                                <div className="space-y-4 p-5 bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-[#ea690c]/20 shadow-md">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-[#ea690c]" />
                                        <h3 className="font-bold text-neutral-800 text-base">
                                            Delivery Preference & Details
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${deliveryPreference === "pickup"
                                            ? "border-[#ea690c] bg-orange-50 shadow-md"
                                            : "border-[#d1d1d1] hover:bg-gray-50 hover:border-gray-300"
                                            }`}>
                                            <input
                                                type="radio"
                                                name={`delivery-modal-${selectedParcel.parcelId}`}
                                                value="pickup"
                                                checked={deliveryPreference === "pickup"}
                                                onChange={(e) => setDeliveryPreference(e.target.value as "pickup")}
                                                className="w-5 h-5 text-[#ea690c] cursor-pointer"
                                            />
                                            <div className="ml-4">
                                                <p className="font-bold text-neutral-800 text-base">Customer Pickup</p>
                                                <p className="text-xs text-[#5d5d5d] mt-1">Customer will collect from station - No delivery fee</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${deliveryPreference === "delivery"
                                            ? "border-[#ea690c] bg-orange-50 shadow-md"
                                            : "border-[#d1d1d1] hover:bg-gray-50 hover:border-gray-300"
                                            }`}>
                                            <input
                                                type="radio"
                                                name={`delivery-modal-${selectedParcel.parcelId}`}
                                                value="delivery"
                                                checked={deliveryPreference === "delivery"}
                                                onChange={(e) => setDeliveryPreference(e.target.value as "delivery")}
                                                className="w-5 h-5 text-[#ea690c] cursor-pointer"
                                            />
                                            <div className="ml-4">
                                                <p className="font-bold text-neutral-800 text-base">Home Delivery</p>
                                                <p className="text-xs text-[#5d5d5d] mt-1">Deliver to customer address - Delivery fee applies</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Delivery Form Fields */}
                                    <div className="space-y-5 pt-5 border-t-2 border-[#d1d1d1]">
                                        {deliveryPreference === "delivery" && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-bold text-neutral-800 mb-2 block flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            Delivery Address <span className="text-[#e22420]">*</span>
                                                        </Label>
                                                        <Input
                                                            value={deliveryAddress}
                                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                                            placeholder="Enter complete delivery address"
                                                            className="border-2 border-[#d1d1d1] focus:border-[#ea690c] h-11"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-bold text-neutral-800 mb-2 block flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4" />
                                                            Delivery Fee (GHC) <span className="text-[#e22420]">*</span>
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={deliveryFee}
                                                            onChange={(e) => setDeliveryFee(e.target.value)}
                                                            placeholder="e.g., 15.00"
                                                            className="border-2 border-[#d1d1d1] focus:border-[#ea690c] h-11"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-bold text-neutral-800 mb-2 block flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Preferred Delivery Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={preferredDate}
                                                        onChange={(e) => setPreferredDate(e.target.value)}
                                                        className="border-2 border-[#d1d1d1] focus:border-[#ea690c] h-11"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <Label className="text-sm font-bold text-neutral-800 mb-2 block flex items-center gap-1">
                                                <PhoneIcon className="w-4 h-4" />
                                                Call Notes
                                            </Label>
                                            <textarea
                                                value={callNotes}
                                                onChange={(e) => setCallNotes(e.target.value)}
                                                placeholder="Record any special notes, instructions, or preferences from the customer..."
                                                className="w-full px-4 py-3 border-2 border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] resize-none"
                                                rows={4}
                                            />
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-5 rounded-xl border-2 border-orange-300 shadow-sm">
                                            <p className="text-xs font-bold text-orange-800 mb-3 uppercase tracking-wide">
                                                TOTAL TO COLLECT
                                            </p>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-medium text-orange-900">
                                                    {deliveryPreference === "delivery"
                                                        ? `Delivery Fee + Item Value`
                                                        : "Item Value Only"}
                                                </span>
                                                <span className="text-3xl font-bold text-[#ea690c]">
                                                    GHC {totalToCollect.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    setSelectedParcel(null);
                                                }}
                                                variant="outline"
                                                className="flex-1 border-2 border-[#d1d1d1] hover:bg-gray-50 h-11 font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSavePreferences}
                                                disabled={
                                                    updating ||
                                                    (deliveryPreference === "delivery" &&
                                                        (!deliveryAddress || !deliveryFee))
                                                }
                                                className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 h-11 font-semibold shadow-md hover:shadow-lg transition-shadow"
                                            >
                                                {updating ? (
                                                    <>
                                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                        Save & Mark Ready
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
