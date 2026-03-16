import React, { useState, useEffect } from "react";
import { PhoneIcon, CheckCircleIcon, Clock, Loader, X, Package, PhoneCall, MessageSquare, DollarSign, MapPin, User, Truck } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { useLocation } from "../../contexts/LocationContext";
import { calculateTotalAmount, formatDateTime, formatDate } from "../../utils/dataHelpers";
import { formatPhoneNumber } from "../../utils/dataHelpers";
import frontdeskService, { ParcelResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";

const REMARK_OPTIONS = [
    { value: "NO_COMMENT", label: "No comment" },
    { value: "NOT_REACHABLE", label: "Not reachable" },
    { value: "UNANSWERED", label: "Unanswered" },
    { value: "HIGH_COST", label: "High cost" },
    { value: "RIDER_RUDE", label: "Rider was rude" },
    { value: "DID_NOT_RECEIVE", label: "Did not receive any package" },
    { value: "WRONG_CONTACT", label: "Wrong contact" },
    { value: "OTHER", label: "Other" },
] as const;

// Detect demo mode (when using the /call-center-demo route)
const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith("/call-center-demo");

// Dummy delivered parcels for demo mode (post-delivery tab)
const DEMO_DELIVERED_PARCELS: ParcelResponse[] = [
    {
        parcelId: "PK-DEMO-001",
        receiverName: "John Doe",
        recieverPhoneNumber: "+233541234567",
        receiverAddress: "Accra Main, UCC Campus",
        deliveryDate: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        officeName: "Accra Main Center",
        followUpStatus: "PENDING",
        followUpRemarkType: undefined,
        followUpAt: undefined,
        createdAt: Date.now() - 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
        parcelId: "PK-DEMO-002",
        receiverName: "Ama Kwame",
        recieverPhoneNumber: "+233542345678",
        receiverAddress: "Kumasi VIP Station",
        deliveryDate: Date.now() - 26 * 60 * 60 * 1000, // yesterday
        officeName: "Kumasi VIP Station",
        followUpStatus: "FOLLOWED_UP",
        followUpRemarkType: "HIGH_COST",
        followUpAt: Date.now() - 3 * 60 * 60 * 1000,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 26 * 60 * 60 * 1000,
    },
    {
        parcelId: "PK-DEMO-003",
        receiverName: "Kwesi Mensah",
        recieverPhoneNumber: "+233543456789",
        receiverAddress: "Spintex Road, Accra",
        deliveryDate: Date.now() - 4 * 60 * 60 * 1000,
        officeName: "Spintex Branch",
        followUpStatus: "PENDING",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 4 * 60 * 60 * 1000,
    },
];

const CALL_CENTER_TABS = [
    { id: "follow-up", label: "Follow-Up" },
    { id: "all-deliveries", label: "All Deliveries" },
    { id: "active-deliveries", label: "Active Deliveries" },
    { id: "reconciliation", label: "Reconciliation" },
    { id: "history", label: "History" },
] as const;

type CallCenterTabId = (typeof CALL_CENTER_TABS)[number]["id"];

export const CallCenter = (): JSX.Element => {
    const { currentUser } = useStation();
    const { stations } = useLocation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<CallCenterTabId>("follow-up");
    const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [deliveryPreference, setDeliveryPreference] = useState<"pickup" | "delivery">("delivery");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryFee, setDeliveryFee] = useState("");
    const [preferredDate, setPreferredDate] = useState("");
    const [callNotes, setCallNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Post-delivery follow-up
    const [deliveredParcels, setDeliveredParcels] = useState<ParcelResponse[]>([]);
    const [deliveredLoading, setDeliveredLoading] = useState(false);
    const [deliveredPagination, setDeliveredPagination] = useState({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
    });
    const [deliveredFilters, setDeliveredFilters] = useState<{
        officeId: string;
        fromDate: string;
        toDate: string;
        followUpStatus: "PENDING" | "FOLLOWED_UP" | "ALL";
    }>({
        officeId: "",
        fromDate: "",
        toDate: "",
        followUpStatus: "PENDING",
    });
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpParcel, setFollowUpParcel] = useState<ParcelResponse | null>(null);
    const [remarkType, setRemarkType] = useState<string>("NO_COMMENT");
    const [remarkOther, setRemarkOther] = useState("");
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Load delivered parcels for post-delivery tabs
    useEffect(() => {
        if (activeTab !== "follow-up" && activeTab !== "all-deliveries") return;

        // Demo mode: use local dummy data and skip backend
        if (isDemoMode) {
            setDeliveredLoading(false);
            setDeliveredParcels(DEMO_DELIVERED_PARCELS);
            setDeliveredPagination((prev) => ({
                ...prev,
                totalElements: DEMO_DELIVERED_PARCELS.length,
                totalPages: 1,
                page: 0,
            }));
            return;
        }

        const fetchDelivered = async () => {
            setDeliveredLoading(true);
            try {
                const fromDate = deliveredFilters.fromDate
                    ? new Date(deliveredFilters.fromDate).setHours(0, 0, 0, 0)
                    : undefined;
                const toDate = deliveredFilters.toDate
                    ? new Date(deliveredFilters.toDate).setHours(23, 59, 59, 999)
                    : undefined;

                const response = await frontdeskService.getDeliveredParcels({
                    page: deliveredPagination.page,
                    size: deliveredPagination.size,
                    officeId: deliveredFilters.officeId || undefined,
                    fromDate,
                    toDate,
                    followUpStatus:
                        deliveredFilters.followUpStatus === "ALL" ? undefined : deliveredFilters.followUpStatus,
                });

                if (response.success && response.data) {
                    const data = response.data as any;
                    const list = Array.isArray(data.content) ? data.content : [];
                    setDeliveredParcels(list);
                    setDeliveredPagination((prev) => ({
                        ...prev,
                        totalElements: data.totalElements ?? 0,
                        totalPages: data.totalPages ?? 0,
                        page: data.number ?? prev.page,
                    }));
                } else {
                    showToast(response.message || "Failed to load delivered parcels", "error");
                    setDeliveredParcels([]);
                }
            } catch (error) {
                console.error("Failed to fetch delivered parcels:", error);
                showToast("Failed to load delivered parcels. Please try again.", "error");
                setDeliveredParcels([]);
            } finally {
                setDeliveredLoading(false);
            }
        };

        fetchDelivered();
    }, [
        activeTab,
        deliveredPagination.page,
        deliveredPagination.size,
        deliveredFilters.officeId,
        deliveredFilters.fromDate,
        deliveredFilters.toDate,
        deliveredFilters.followUpStatus,
        showToast,
    ]);

    const handleRefreshDelivered = async () => {
        if (isDemoMode) {
            setDeliveredParcels(DEMO_DELIVERED_PARCELS);
            return;
        }

        setDeliveredLoading(true);
        try {
            const fromDate = deliveredFilters.fromDate
                ? new Date(deliveredFilters.fromDate).setHours(0, 0, 0, 0)
                : undefined;
            const toDate = deliveredFilters.toDate
                ? new Date(deliveredFilters.toDate).setHours(23, 59, 59, 999)
                : undefined;

            const response = await frontdeskService.getDeliveredParcels({
                page: deliveredPagination.page,
                size: deliveredPagination.size,
                officeId: deliveredFilters.officeId || undefined,
                fromDate,
                toDate,
                followUpStatus:
                    deliveredFilters.followUpStatus === "ALL" ? undefined : deliveredFilters.followUpStatus,
            });

            if (response.success && response.data) {
                const data = response.data as any;
                const list = Array.isArray(data.content) ? data.content : [];
                setDeliveredParcels(list);
                setDeliveredPagination((prev) => ({
                    ...prev,
                    totalElements: data.totalElements ?? 0,
                    totalPages: data.totalPages ?? 0,
                    page: data.number ?? prev.page,
                }));
            }
        } catch (error) {
            console.error("Failed to refresh delivered parcels:", error);
        } finally {
            setDeliveredLoading(false);
        }
    };

    const openFollowUpModal = (parcel: ParcelResponse) => {
        setFollowUpParcel(parcel);
        setRemarkType("NO_COMMENT");
        setRemarkOther("");
        setShowFollowUpModal(true);
    };

    const handleSubmitFollowUp = async () => {
        if (!followUpParcel) return;
        if (remarkType === "OTHER" && !remarkOther.trim()) {
            showToast("Please provide details when selecting 'Other'", "warning");
            return;
        }

        setSubmittingFollowUp(true);
        try {
            const response = await frontdeskService.createFollowUp(
                followUpParcel.parcelId,
                remarkType,
                remarkType === "OTHER" ? remarkOther : undefined
            );
            if (response.success) {
                showToast("Follow-up recorded successfully", "success");
                setShowFollowUpModal(false);
                setFollowUpParcel(null);
                handleRefreshDelivered();
            } else {
                showToast(response.message || "Failed to record follow-up", "error");
            }
        } catch (error) {
            console.error("Submit follow-up error:", error);
            showToast("Failed to record follow-up. Please try again.", "error");
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    const handleTabChange = (tabId: CallCenterTabId) => {
        setActiveTab(tabId);

        if (tabId === "follow-up") {
            setDeliveredFilters((f) => ({ ...f, followUpStatus: "PENDING" }));
        } else if (tabId === "all-deliveries") {
            setDeliveredFilters((f) => ({ ...f, followUpStatus: "ALL" }));
        }
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
                hasCalled: true,
                homeDelivery: deliveryPreference === "delivery",
                receiverAddress: deliveryPreference === "delivery" ? deliveryAddress : selectedParcel.receiverAddress,
                deliveryCost: deliveryPreference === "delivery" ? parseFloat(deliveryFee || "0") : 0,
                parcelDescription: callNotes || undefined,
            };

            const response = await frontdeskService.updateParcel(selectedParcel.parcelId, updateData);

            if (response.success) {
                showToast(`Preferences saved for ${selectedParcel.receiverName || selectedParcel.parcelId}`, "success");
                setShowDetailsModal(false);
                setSelectedParcel(null);
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

    const totalQueue = deliveredParcels.length;
    const followedUpCount = deliveredParcels.filter((p) => p.followUpStatus === "FOLLOWED_UP").length;
    const pendingCount = deliveredParcels.filter((p) => p.followUpStatus !== "FOLLOWED_UP").length;
    const unreachableCount = deliveredParcels.filter(
        (p) =>
            p.followUpStatus === "FOLLOWED_UP" &&
            (p.followUpRemarkType === "NOT_REACHABLE" ||
                p.followUpRemarkType === "UNANSWERED" ||
                p.followUpRemarkType === "WRONG_CONTACT")
    ).length;

    const activeTabLabel =
        CALL_CENTER_TABS.find((t) => t.id === activeTab)?.label ?? "Follow-Up";

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
                    <header className="space-y-1">
                        <h1 className="text-xl font-bold text-neutral-800">Call Center – {activeTabLabel}</h1>
                        <p className="text-xs text-[#5d5d5d]">
                            Delivered parcels and post-delivery follow-up across all stations.
                        </p>
                    </header>

                    {/* Call Center Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-[#d1d1d1] pb-1">
                        {CALL_CENTER_TABS.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                                        isActive
                                            ? "bg-white border border-[#d1d1d1] border-b-0 -mb-px text-[#ea690c]"
                                            : "text-[#5d5d5d] hover:bg-gray-50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Post-Delivery Follow-Up */}
                    {(activeTab === "follow-up" || activeTab === "all-deliveries") && (
                        <>
                            {/* Summary cards */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Card className="border-none bg-[#ffefe5]">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-xs font-medium text-[#8b4a1f]">
                                                {activeTab === "follow-up" ? "Total Queue" : "Total Parcels"}
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-[#ea690c]">
                                                {deliveredPagination.totalElements || totalQueue}
                                            </p>
                                        </div>
                                        <Package className="w-8 h-8 text-[#f5a76a]" />
                                    </CardContent>
                                </Card>
                                <Card className="border-none bg-[#e5f6e9]">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-xs font-medium text-green-700">Followed Up</p>
                                            <p className="mt-2 text-2xl font-bold text-green-700">{followedUpCount}</p>
                                        </div>
                                        <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-70" />
                                    </CardContent>
                                </Card>
                                <Card className="border-none bg-[#e5f0ff]">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Pending</p>
                                            <p className="mt-2 text-2xl font-bold text-blue-700">{pendingCount}</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-blue-500 opacity-70" />
                                    </CardContent>
                                </Card>
                                <Card className="border-none bg-[#ffe5e8]">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-xs font-medium text-[#b3261e]">Unreachable</p>
                                            <p className="mt-2 text-2xl font-bold text-[#b3261e]">
                                                {unreachableCount}
                                            </p>
                                        </div>
                                        <PhoneIcon className="w-8 h-8 text-[#b3261e] opacity-70" />
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex flex-wrap items-end gap-4">
                                        <div>
                                            <Label className="text-xs text-[#5d5d5d] block mb-1">Station</Label>
                                            <select
                                                value={deliveredFilters.officeId}
                                                onChange={(e) =>
                                                    setDeliveredFilters((f) => ({ ...f, officeId: e.target.value }))
                                                }
                                                className="h-9 min-w-[180px] rounded border border-[#d1d1d1] px-3 text-sm"
                                            >
                                                <option value="">All stations</option>
                                                {stations.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-[#5d5d5d] block mb-1">From date</Label>
                                            <Input
                                                type="date"
                                                value={deliveredFilters.fromDate}
                                                onChange={(e) =>
                                                    setDeliveredFilters((f) => ({ ...f, fromDate: e.target.value }))
                                                }
                                                className="h-9 w-40"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-[#5d5d5d] block mb-1">To date</Label>
                                            <Input
                                                type="date"
                                                value={deliveredFilters.toDate}
                                                onChange={(e) =>
                                                    setDeliveredFilters((f) => ({ ...f, toDate: e.target.value }))
                                                }
                                                className="h-9 w-40"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-[#5d5d5d] block mb-1">Follow-up status</Label>
                                            <select
                                                value={deliveredFilters.followUpStatus}
                                                onChange={(e) =>
                                                    setDeliveredFilters((f) => ({
                                                        ...f,
                                                        followUpStatus: e.target.value as "PENDING" | "FOLLOWED_UP" | "ALL",
                                                    }))
                                                }
                                                className="h-9 min-w-[140px] rounded border border-[#d1d1d1] px-3 text-sm"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="FOLLOWED_UP">Followed up</option>
                                                <option value="ALL">All</option>
                                            </select>
                                        </div>
                                        <Button
                                            onClick={handleRefreshDelivered}
                                            variant="outline"
                                            size="sm"
                                            className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-0">
                                    {deliveredLoading ? (
                                        <div className="text-center py-12">
                                            <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                            <p className="text-sm text-[#5d5d5d]">Loading delivered parcels...</p>
                                        </div>
                                    ) : deliveredParcels.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package className="w-16 h-16 text-[#5d5d5d] mx-auto mb-4 opacity-50" />
                                            <p className="text-sm text-[#5d5d5d]">No delivered parcels found.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full divide-y divide-[#d1d1d1]">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Destination</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Delivery Date</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Station</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Follow-up</th>
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                    {deliveredParcels.map((p) => {
                                                        const officeName = typeof p.officeId === "object" && p.officeId
                                                            ? (p.officeId as { name?: string }).name
                                                            : p.officeName ?? "N/A";
                                                        const deliveryTs = p.deliveryDate ?? p.updatedAt ?? p.createdAt;
                                                        const isFollowedUp = p.followUpStatus === "FOLLOWED_UP";

                                                        return (
                                                            <tr key={p.parcelId} className="hover:bg-gray-50">
                                                                <td className="py-3 px-4">
                                                                    <p className="font-semibold text-neutral-800 text-sm">{p.receiverName || "N/A"}</p>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <a
                                                                        href={`tel:${p.recieverPhoneNumber}`}
                                                                        className="text-[#ea690c] hover:underline font-medium text-sm"
                                                                    >
                                                                        {p.recieverPhoneNumber ? formatPhoneNumber(p.recieverPhoneNumber) : "N/A"}
                                                                    </a>
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-neutral-700 max-w-[200px] truncate" title={p.receiverAddress}>
                                                                    {p.receiverAddress || "N/A"}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-neutral-700">
                                                                    {deliveryTs ? formatDate(new Date(deliveryTs).toISOString()) : "N/A"}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-neutral-700">{officeName}</td>
                                                                <td className="py-3 px-4">
                                                                    {isFollowedUp ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            {p.followUpRemarkType ? p.followUpRemarkType.replace(/_/g, " ") : "Followed up"}
                                                                            {p.followUpAt && (
                                                                                <span className="ml-1 text-green-600">
                                                                                    ({formatDate(new Date(p.followUpAt).toISOString())})
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                            Pending
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <a
                                                                            href={`tel:${p.recieverPhoneNumber}`}
                                                                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                                                            title="Call"
                                                                        >
                                                                            <PhoneCall className="w-4 h-4" />
                                                                        </a>
                                                                        <Button
                                                                            onClick={() => openFollowUpModal(p)}
                                                                            size="sm"
                                                                            className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                                        >
                                                                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                                                            {isFollowedUp ? "Add note" : "Record follow-up"}
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {!deliveredLoading && deliveredPagination.totalPages > 1 && (
                                        <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                            <div className="text-sm text-neutral-700">
                                                Showing {deliveredPagination.page * deliveredPagination.size + 1} to{" "}
                                                {Math.min(
                                                    (deliveredPagination.page + 1) * deliveredPagination.size,
                                                    deliveredPagination.totalElements
                                                )}{" "}
                                                of {deliveredPagination.totalElements} parcels
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() =>
                                                        setDeliveredPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                                                    }
                                                    disabled={deliveredPagination.page === 0 || deliveredLoading}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border border-[#d1d1d1]"
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        setDeliveredPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                                                    }
                                                    disabled={
                                                        deliveredPagination.page >= deliveredPagination.totalPages - 1 ||
                                                        deliveredLoading
                                                    }
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
                        </>
                    )}

                    {activeTab === "active-deliveries" && (
                        <Card className="border border-dashed border-[#d1d1d1] bg-white">
                            <CardContent className="p-6 text-sm text-[#5d5d5d]">
                                Active deliveries insights for the call center will be added here. For now, use the main{" "}
                                <span className="font-semibold">Active Deliveries</span> screen from the sidebar.
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "reconciliation" && (
                        <Card className="border border-dashed border-[#d1d1d1] bg-white">
                            <CardContent className="p-6 text-sm text-[#5d5d5d]">
                                Reconciliation summaries for follow-up calls will appear here in a future update.
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "history" && (
                        <Card className="border border-dashed border-[#d1d1d1] bg-white">
                            <CardContent className="p-6 text-sm text-[#5d5d5d]">
                                Call history and detailed follow-up records will be surfaced here.
                            </CardContent>
                        </Card>
                    )}
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

            {/* Record Follow-Up Modal */}
            {showFollowUpModal && followUpParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-800">Record Follow-Up</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-1">
                                        {followUpParcel.receiverName || followUpParcel.parcelId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowFollowUpModal(false);
                                        setFollowUpParcel(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800 transition-colors p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                        Remark <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <div className="space-y-2">
                                        {REMARK_OPTIONS.map((opt) => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    remarkType === opt.value
                                                        ? "border-[#ea690c] bg-orange-50"
                                                        : "border-[#d1d1d1] hover:bg-gray-50"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="remarkType"
                                                    value={opt.value}
                                                    checked={remarkType === opt.value}
                                                    onChange={() => setRemarkType(opt.value)}
                                                    className="w-4 h-4 text-[#ea690c]"
                                                />
                                                <span className="ml-3 text-sm font-medium text-neutral-800">
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {remarkType === "OTHER" && (
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                            Details <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <textarea
                                            value={remarkOther}
                                            onChange={(e) => setRemarkOther(e.target.value)}
                                            placeholder="Enter additional details..."
                                            className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                            rows={3}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-[#5d5d5d] mt-1">{remarkOther.length}/500</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => {
                                            setShowFollowUpModal(false);
                                            setFollowUpParcel(null);
                                        }}
                                        variant="outline"
                                        className="flex-1 border border-[#d1d1d1]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmitFollowUp}
                                        disabled={
                                            submittingFollowUp ||
                                            (remarkType === "OTHER" && !remarkOther.trim())
                                        }
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {submittingFollowUp ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save"
                                        )}
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
