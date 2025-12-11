import { useState, useEffect } from "react";
import {
    TruckIcon,
    PackageIcon,
    CameraIcon,
    AlertCircleIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightIcon,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";
import { getAssignedParcelsForRider, getAllActiveDeliveries, updateParcelStatus, mockRiders } from "../../data/mockData";
import { Parcel, ParcelStatus, STATUS_CONFIG } from "../../types";
import { formatPhoneNumber, formatDateTime, calculateTotalAmount, formatCurrency } from "../../utils/dataHelpers";

export const ActiveDeliveries = (): JSX.Element => {
    const { currentUser, userRole } = useStation();
    const [deliveries, setDeliveries] = useState<Parcel[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ParcelStatus | "all">("all");
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showFailedModal, setShowFailedModal] = useState(false);
    const [amountCollected, setAmountCollected] = useState("");
    const [failureReason, setFailureReason] = useState("");

    // Get rider ID - if user is a rider, use their ID; otherwise show all (for managers/admins)
    const riderId = userRole === "rider" ? currentUser?.id : undefined;

    useEffect(() => {
        if (riderId) {
            const assigned = getAssignedParcelsForRider(riderId);
            setDeliveries(assigned);
        } else if (userRole === "admin" || userRole === "station-manager") {
            // For managers/admins, show all active deliveries
            const active = getAllActiveDeliveries(
                userRole === "station-manager" ? currentUser?.stationId : undefined
            );
            setDeliveries(active);
        }
    }, [riderId, userRole, currentUser]);

    const filteredDeliveries = deliveries.filter((delivery) => {
        const matchesSearch =
            !searchQuery ||
            delivery.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            delivery.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            delivery.recipientPhone.includes(searchQuery);
        
        const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = (parcelId: string, newStatus: ParcelStatus) => {
        if (!currentUser) return;

        if (newStatus === "delivered") {
            setSelectedParcel(deliveries.find((p) => p.id === parcelId) || null);
            setShowDeliveryModal(true);
        } else if (newStatus === "delivery-failed") {
            setSelectedParcel(deliveries.find((p) => p.id === parcelId) || null);
            setShowFailedModal(true);
        } else {
            updateParcelStatus(parcelId, newStatus, currentUser.id);
            // Refresh deliveries
            if (riderId) {
                const assigned = getAssignedParcelsForRider(riderId);
                setDeliveries(assigned);
            }
        }
    };

    const handleDeliveryComplete = () => {
        if (!selectedParcel || !currentUser || !amountCollected) return;

        const collected = parseFloat(amountCollected);
        const expectedTotal = calculateTotalAmount(
            selectedParcel.itemValue || 0,
            selectedParcel.deliveryFee || 0,
            selectedParcel.deliveryPreference || "delivery"
        );

        const updateData: Partial<Parcel> = {
            status: "delivered",
            deliveredDate: new Date().toISOString(),
            amountCollected: collected,
            deliveryFeeCollected: selectedParcel.deliveryFee || 0,
            itemValueCollected: selectedParcel.itemValue || 0,
        };

        updateParcelStatus(selectedParcel.id, "delivered", currentUser.id, updateData);

        // Update rider earnings (delivery fee goes to rider)
        if (selectedParcel.assignedRiderId) {
            const rider = mockRiders.find((r) => r.id === selectedParcel.assignedRiderId);
            if (rider) {
                rider.totalEarned += selectedParcel.deliveryFee || 0;
                rider.outstandingBalance += selectedParcel.deliveryFee || 0;
                rider.deliveriesCompleted += 1;
                rider.paymentStatus = "pending";
            }
        }

        // Refresh deliveries
        if (riderId) {
            const assigned = getAssignedParcelsForRider(riderId);
            setDeliveries(assigned);
        }

        setShowDeliveryModal(false);
        setSelectedParcel(null);
        setAmountCollected("");
        
        if (collected !== expectedTotal) {
            alert(`Delivery completed! Note: Collected GHC ${collected.toFixed(2)} (Expected: GHC ${expectedTotal.toFixed(2)})`);
        } else {
            alert("Delivery completed successfully!");
        }
    };

    const handleDeliveryFailed = () => {
        if (!selectedParcel || !currentUser || !failureReason.trim()) return;

        updateParcelStatus(
            selectedParcel.id,
            "delivery-failed",
            currentUser.id,
            {
                deliveryFailedDate: new Date().toISOString(),
                failureReason: failureReason,
            }
        );

        // Refresh deliveries
        if (riderId) {
            const assigned = getAssignedParcelsForRider(riderId);
            setDeliveries(assigned);
        }

        setShowFailedModal(false);
        setSelectedParcel(null);
        setFailureReason("");
        alert("Delivery failure recorded");
    };

    // Calculate statistics
    const activeCount = deliveries.filter(
        (d) => d.status === "picked-up" || d.status === "out-for-delivery"
    ).length;
    const pendingCount = deliveries.filter((d) => d.status === "assigned").length;
    const expectedCollections = deliveries
        .filter((d) => d.status !== "delivered" && d.status !== "delivery-failed")
        .reduce((sum, d) => {
            return sum + calculateTotalAmount(d.itemValue || 0, d.deliveryFee || 0, d.deliveryPreference || "delivery");
        }, 0);
    const failedCount = deliveries.filter((d) => d.status === "delivery-failed").length;

    const getStatusBadge = (status: ParcelStatus) => {
        const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    const getNextStatusAction = (parcel: Parcel) => {
        switch (parcel.status) {
            case "assigned":
                return { label: "Mark Picked Up", status: "picked-up" as ParcelStatus, color: "bg-blue-600" };
            case "picked-up":
                return { label: "Out for Delivery", status: "out-for-delivery" as ParcelStatus, color: "bg-indigo-600" };
            case "out-for-delivery":
                return { label: "Mark Delivered", status: "delivered" as ParcelStatus, color: "bg-green-600" };
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">Active Deliveries</h1>
                        <p className="text-sm text-[#5d5d5d] mt-1">
                            {userRole === "rider" ? "Your assigned deliveries" : "All active deliveries"}
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="[font-family:'Lato',Helvetica] font-bold text-green-600 text-3xl">
                                            {activeCount}
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                                            Currently making deliveries
                                        </span>
                                    </div>
                                    <PackageIcon className="w-8 h-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="[font-family:'Lato',Helvetica] font-bold text-blue-600 text-3xl">
                                            {pendingCount}
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                                            Pending pickup
                                        </span>
                                    </div>
                                    <PackageIcon className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-3xl">
                                            {formatCurrency(expectedCollections)}
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                                            Expected collections
                                        </span>
                                    </div>
                                    <CameraIcon className="w-8 h-8 text-[#ea690c]" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="[font-family:'Lato',Helvetica] font-bold text-red-600 text-3xl">
                                            {failedCount}
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                                            Requires follow-up
                                        </span>
                                    </div>
                                    <AlertCircleIcon className="w-8 h-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filter */}
                    <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
                            <div className="flex-1 relative">
                                <Input
                                    type="text"
                                    placeholder="Search by Tracking ID or Recipient name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ea690c]" />
                            </div>

                            <div className="flex items-center gap-2">
                                <FilterIcon className="w-5 h-5 text-[#5d5d5d]" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as ParcelStatus | "all")}
                                    className="rounded border border-[#d1d1d1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="picked-up">Picked Up</option>
                                    <option value="out-for-delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="delivery-failed">Failed</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery List */}
                    <div className="flex flex-col gap-4">
                        {filteredDeliveries.length === 0 ? (
                            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                                <CardContent className="p-12 text-center">
                                    <PackageIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                    <p className="text-neutral-700 font-medium">
                                        {userRole === "rider" ? "No deliveries assigned" : "No active deliveries"}
                                    </p>
                                    <p className="text-sm text-[#5d5d5d] mt-2">
                                        {userRole === "rider"
                                            ? "Check back later for new assignments"
                                            : "Assign parcels to riders to see active deliveries"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredDeliveries.map((delivery) => {
                                const nextAction = getNextStatusAction(delivery);
                                const totalAmount = calculateTotalAmount(
                                    delivery.itemValue || 0,
                                    delivery.deliveryFee || 0,
                                    delivery.deliveryPreference || "delivery"
                                );

                                return (
                                    <Card
                                        key={delivery.id}
                                        className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex flex-col lg:flex-row gap-4">
                                                {/* Left Column - Receiver and Address */}
                                                <div className="flex-1 flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                                                            {delivery.id}
                                                        </Badge>
                                                        {getStatusBadge(delivery.status)}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                        <div className="flex flex-col">
                                                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                                                {delivery.recipientName}
                                                            </span>
                                                            <a
                                                                href={`tel:${delivery.recipientPhone}`}
                                                                className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs hover:text-[#ea690c]"
                                                            >
                                                                {formatPhoneNumber(delivery.recipientPhone)}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {delivery.deliveryPreference === "delivery" && delivery.deliveryAddress && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                                                {delivery.deliveryAddress}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {delivery.deliveryPreference === "pickup" && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                                                Shelf: <strong>{delivery.shelfLocation}</strong> (Customer Pickup)
                                                            </span>
                                                        </div>
                                                    )}

                                                    {delivery.assignedDate && (
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                                                Assigned: {formatDateTime(delivery.assignedDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Middle Column - Amount Breakdown */}
                                                <div className="flex-1 flex flex-col gap-3">
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-[#5d5d5d] mb-2">Amount to Collect</p>
                                                        <div className="space-y-1">
                                                            {delivery.itemValue > 0 && (
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-neutral-700">Item Value:</span>
                                                                    <span className="font-semibold">GHC {delivery.itemValue.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {delivery.deliveryFee && delivery.deliveryFee > 0 && (
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-neutral-700">Delivery Fee:</span>
                                                                    <span className="font-semibold">GHC {delivery.deliveryFee.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between pt-1 border-t border-[#d1d1d1]">
                                                                <span className="text-sm font-bold text-neutral-800">Total:</span>
                                                                <span className="text-lg font-bold text-[#ea690c]">
                                                                    {formatCurrency(totalAmount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {delivery.itemDescription && (
                                                        <p className="text-xs text-neutral-700">
                                                            <strong>Item:</strong> {delivery.itemDescription}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Right Column - Actions */}
                                                <div className="flex flex-col items-end gap-3">
                                                    {nextAction && (
                                                        <Button
                                                            onClick={() => handleStatusUpdate(delivery.id, nextAction.status)}
                                                            className={`${nextAction.color} text-white hover:opacity-90`}
                                                        >
                                                            {nextAction.label}
                                                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                                                        </Button>
                                                    )}

                                                    {delivery.status === "out-for-delivery" && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleStatusUpdate(delivery.id, "delivery-failed")}
                                                                variant="outline"
                                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                            >
                                                                <XCircleIcon className="w-4 h-4 mr-2" />
                                                                Mark Failed
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {delivery.status === "delivered" && (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                            Delivered
                                                        </Badge>
                                                    )}

                                                    {delivery.status === "delivery-failed" && (
                                                        <Badge className="bg-red-100 text-red-800">
                                                            <XCircleIcon className="w-3 h-3 mr-1" />
                                                            Failed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            {/* Delivery Confirmation Modal */}
            {showDeliveryModal && selectedParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800">Confirm Delivery</h3>
                                <button
                                    onClick={() => {
                                        setShowDeliveryModal(false);
                                        setSelectedParcel(null);
                                        setAmountCollected("");
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                                    <p className="font-semibold text-neutral-800">{selectedParcel.recipientName}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Parcel ID</p>
                                    <p className="font-semibold text-neutral-800">{selectedParcel.id}</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-[#5d5d5d] mb-2">Expected Amount</p>
                                    <p className="text-2xl font-bold text-[#ea690c]">
                                        {formatCurrency(
                                            calculateTotalAmount(
                                                selectedParcel.itemValue || 0,
                                                selectedParcel.deliveryFee || 0,
                                                selectedParcel.deliveryPreference || "delivery"
                                            )
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Amount Collected (GHC) <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={amountCollected}
                                        onChange={(e) => setAmountCollected(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => {
                                            setShowDeliveryModal(false);
                                            setSelectedParcel(null);
                                            setAmountCollected("");
                                        }}
                                        variant="outline"
                                        className="flex-1 border border-[#d1d1d1]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeliveryComplete}
                                        disabled={!amountCollected}
                                        className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                    >
                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                        Confirm Delivery
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delivery Failed Modal */}
            {showFailedModal && selectedParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800">Delivery Failed</h3>
                                <button
                                    onClick={() => {
                                        setShowFailedModal(false);
                                        setSelectedParcel(null);
                                        setFailureReason("");
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                                    <p className="font-semibold text-neutral-800">{selectedParcel.recipientName}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Parcel ID</p>
                                    <p className="font-semibold text-neutral-800">{selectedParcel.id}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Failure Reason <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <textarea
                                        value={failureReason}
                                        onChange={(e) => setFailureReason(e.target.value)}
                                        placeholder="Enter reason for delivery failure..."
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => {
                                            setShowFailedModal(false);
                                            setSelectedParcel(null);
                                            setFailureReason("");
                                        }}
                                        variant="outline"
                                        className="flex-1 border border-[#d1d1d1]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeliveryFailed}
                                        disabled={!failureReason.trim()}
                                        className="flex-1 bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <XCircleIcon className="w-4 h-4 mr-2" />
                                        Mark as Failed
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
