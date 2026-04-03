import React, { useState, useEffect, useCallback } from "react";
import {
    CheckCircleIcon, Loader, Package, PhoneOff, Truck,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { useLocation } from "../../contexts/LocationContext";
import { formatDate, formatPhoneNumber } from "../../utils/dataHelpers";
import { useToast } from "../../components/ui/toast";
import callCenterService, { type CallCenterStatsResponse } from "../../services/callCenterService";

// Real backend callOutCome values
type CallOutcome = "REACHED" | "UNREACHABLE" | "DELIVERED";

interface UncalledParcel {
    parcelId: string;
    receiverName?: string;
    recieverPhoneNumber?: string;
    receiverAddress?: string;
    senderName?: string;
    senderPhoneNumber?: string;
    officeName?: string;
    officeId?: string | { name?: string };
    createdAt?: number;
    updatedAt?: number;
    deliveryDate?: number;
    callOutCome?: CallOutcome | null;
    hasCallCenterSpokenToClient?: boolean;
    callCenterRemark?: string;
    parcelDescription?: string;
    delivered?: boolean;
    inboundCost?: number;
    deliveryCost?: number;
}

export type CallCenterView = "follow-up" | "all-deliveries" | "active-deliveries" | "history";

export interface CallCenterProps {
    view?: CallCenterView;
}

const OUTCOME_OPTIONS: { value: CallOutcome; label: string; color: string }[] = [
    { value: "REACHED", label: "Reached", color: "bg-green-100 text-green-800 border-green-300" },
    { value: "UNREACHABLE", label: "Unreachable", color: "bg-red-100 text-red-800 border-red-300" },
    { value: "DELIVERED", label: "Confirmed Delivered", color: "bg-blue-100 text-blue-800 border-blue-300" },
];

export const CallCenter: React.FC<CallCenterProps> = () => {
    const { stations } = useLocation();
    const { showToast } = useToast();

    // Active queue tab
    const [activeQueueTab, setActiveQueueTab] = useState<"pre-delivery" | "post-delivery">("post-delivery");

    // Pre-delivery queue
    const [preDeliveryParcels, setPreDeliveryParcels] = useState<UncalledParcel[]>([]);
    const [preDeliveryLoading, setPreDeliveryLoading] = useState(false);
    const [preDeliveryPagination, setPreDeliveryPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
    const [preDeliveryFilters, setPreDeliveryFilters] = useState({
        officeId: "",
        fromDate: "",
        toDate: "",
        parcelId: "",
        receiverName: "",
        receiverPhone: "",
    });

    // Post-delivery queue
    const [postDeliveryParcels, setPostDeliveryParcels] = useState<UncalledParcel[]>([]);
    const [postDeliveryLoading, setPostDeliveryLoading] = useState(false);
    const [postDeliveryPagination, setPostDeliveryPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
    const [postDeliveryFilters, setPostDeliveryFilters] = useState({
        officeId: "",
        fromDate: "",
        toDate: "",
        parcelId: "",
        receiverName: "",
        receiverPhone: "",
        followUpStatus: "PENDING" as "PENDING" | "FOLLOWED_UP" | "ALL",
    });

    // Stats
    const [stats, setStats] = useState<CallCenterStatsResponse | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Call outcome modal
    const [outcomeParcel, setOutcomeParcel] = useState<UncalledParcel | null>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>("REACHED");
    const [remark, setRemark] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchPreDelivery = useCallback(async (page = 0) => {
        setPreDeliveryLoading(true);
        try {
            const fromDate = preDeliveryFilters.fromDate
                ? new Date(preDeliveryFilters.fromDate).setHours(0, 0, 0, 0)
                : undefined;
            const toDate = preDeliveryFilters.toDate
                ? new Date(preDeliveryFilters.toDate).setHours(23, 59, 59, 999)
                : undefined;

            const response = await callCenterService.getNotDeliveredUncalled({
                page,
                size: preDeliveryPagination.size,
                officeId: preDeliveryFilters.officeId || undefined,
                fromDate,
                toDate,
                parcelId: preDeliveryFilters.parcelId || undefined,
                receiverName: preDeliveryFilters.receiverName || undefined,
                receiverPhone: preDeliveryFilters.receiverPhone || undefined,
            });

            if (response.success && response.data) {
                const data = response.data as any;
                const content: UncalledParcel[] = Array.isArray(data.content) ? data.content : [];
                setPreDeliveryParcels(content);
                setPreDeliveryPagination(prev => ({
                    ...prev,
                    page: data.number ?? page,
                    totalElements: data.totalElements ?? content.length,
                    totalPages: data.totalPages ?? 1,
                }));
            } else {
                showToast(response.message || "Failed to load pre-delivery parcels", "error");
                setPreDeliveryParcels([]);
            }
        } catch {
            showToast("Failed to load pre-delivery parcels. Please try again.", "error");
            setPreDeliveryParcels([]);
        } finally {
            setPreDeliveryLoading(false);
        }
    }, [preDeliveryFilters, preDeliveryPagination.size, showToast]);

    const fetchPostDelivery = useCallback(async (page = 0) => {
        setPostDeliveryLoading(true);
        try {
            const fromDate = postDeliveryFilters.fromDate
                ? new Date(postDeliveryFilters.fromDate).setHours(0, 0, 0, 0)
                : undefined;
            const toDate = postDeliveryFilters.toDate
                ? new Date(postDeliveryFilters.toDate).setHours(23, 59, 59, 999)
                : undefined;

            const response = await callCenterService.getDeliveredUncalled({
                page,
                size: postDeliveryPagination.size,
                officeId: postDeliveryFilters.officeId || undefined,
                fromDate,
                toDate,
                followUpStatus: postDeliveryFilters.followUpStatus === "ALL" ? undefined : postDeliveryFilters.followUpStatus,
                parcelId: postDeliveryFilters.parcelId || undefined,
                receiverName: postDeliveryFilters.receiverName || undefined,
                receiverPhone: postDeliveryFilters.receiverPhone || undefined,
            });

            if (response.success && response.data) {
                const data = response.data as any;
                const content: UncalledParcel[] = Array.isArray(data.content) ? data.content : [];
                setPostDeliveryParcels(content);
                setPostDeliveryPagination(prev => ({
                    ...prev,
                    page: data.number ?? page,
                    totalElements: data.totalElements ?? content.length,
                    totalPages: data.totalPages ?? 1,
                }));
            } else {
                showToast(response.message || "Failed to load post-delivery parcels", "error");
                setPostDeliveryParcels([]);
            }
        } catch {
            showToast("Failed to load post-delivery parcels. Please try again.", "error");
            setPostDeliveryParcels([]);
        } finally {
            setPostDeliveryLoading(false);
        }
    }, [postDeliveryFilters, postDeliveryPagination.size, showToast]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await callCenterService.getStats();
            if (response.success && response.data) setStats(response.data);
        } catch {
            // stats are non-critical
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreDelivery(0);
        fetchPostDelivery(0);
        fetchStats();
    }, [fetchPreDelivery, fetchPostDelivery, fetchStats]);


    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="space-y-1">
                    <h1 className="text-xl font-bold text-neutral-800">Call Center</h1>
                    <p className="text-xs text-[#5d5d5d]">
                        Pre-delivery and post-delivery call center operations — record outcomes after speaking with recipients.
                    </p>
                </header>

                <main className="flex-1 space-y-6">
                    {/* Stats from yesterday */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none bg-[#ffefe5]">
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[11px] font-medium text-[#8b4a1f] uppercase tracking-wide">Pre-Delivery Queue</p>
                                    <p className="mt-2 text-2xl font-bold text-[#ea690c]">
                                        {preDeliveryLoading ? "—" : preDeliveryPagination.totalElements}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#8b4a1f]">Awaiting first contact</p>
                                </div>
                                <Package className="w-8 h-8 text-[#f5a76a]" />
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-[#e5f6e9]">
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[11px] font-medium text-green-700 uppercase tracking-wide">Reached (Yesterday)</p>
                                    <p className="mt-2 text-2xl font-bold text-green-700">
                                        {statsLoading ? "—" : (stats?.reached ?? "—")}
                                    </p>
                                    <p className="mt-1 text-[11px] text-green-600">Successfully contacted</p>
                                </div>
                                <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-70" />
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-[#ffe5e8]">
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[11px] font-medium text-[#b3261e] uppercase tracking-wide">Unreachable (Yesterday)</p>
                                    <p className="mt-2 text-2xl font-bold text-[#b3261e]">
                                        {statsLoading ? "—" : (stats?.unreachable ?? "—")}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#b3261e]">Could not be reached</p>
                                </div>
                                <PhoneOff className="w-8 h-8 text-[#b3261e] opacity-70" />
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-[#e5f0ff]">
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">Post-Delivery Queue</p>
                                    <p className="mt-2 text-2xl font-bold text-blue-700">
                                        {postDeliveryLoading ? "—" : postDeliveryPagination.totalElements}
                                    </p>
                                    <p className="mt-1 text-[11px] text-blue-600">Follow-up needed</p>
                                </div>
                                <Truck className="w-8 h-8 text-blue-500 opacity-70" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Queue tabs and filters */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            {/* Tab Navigation */}
                            <div className="mb-6 flex gap-2 border-b border-[#d1d1d1]">
                                <button
                                    onClick={() => setActiveQueueTab("post-delivery")}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeQueueTab === "post-delivery"
                                            ? "border-[#ea690c] text-[#ea690c]"
                                            : "border-transparent text-[#5d5d5d] hover:text-neutral-800"
                                    }`}
                                >
                                    Post-Delivery Follow-Up
                                </button>
                                <button
                                    onClick={() => setActiveQueueTab("pre-delivery")}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeQueueTab === "pre-delivery"
                                            ? "border-[#ea690c] text-[#ea690c]"
                                            : "border-transparent text-[#5d5d5d] hover:text-neutral-800"
                                    }`}
                                >
                                    Pre-Delivery Queue
                                </button>
                            </div>

                            {/* Filters Section */}
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">Station</Label>
                                    <select
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.officeId : preDeliveryFilters.officeId}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, officeId: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, officeId: e.target.value }));
                                            }
                                        }}
                                        className="h-9 min-w-[140px] rounded border border-[#d1d1d1] px-2 text-sm"
                                    >
                                        <option value="">All stations</option>
                                        {stations.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">Parcel ID</Label>
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.parcelId : preDeliveryFilters.parcelId}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, parcelId: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, parcelId: e.target.value }));
                                            }
                                        }}
                                        className="h-9 w-32"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">Receiver Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.receiverName : preDeliveryFilters.receiverName}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, receiverName: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, receiverName: e.target.value }));
                                            }
                                        }}
                                        className="h-9 w-32"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">Phone Number</Label>
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.receiverPhone : preDeliveryFilters.receiverPhone}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, receiverPhone: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, receiverPhone: e.target.value }));
                                            }
                                        }}
                                        className="h-9 w-32"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">From Date</Label>
                                    <Input
                                        type="date"
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.fromDate : preDeliveryFilters.fromDate}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, fromDate: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, fromDate: e.target.value }));
                                            }
                                        }}
                                        className="h-9 w-32"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-[#5d5d5d] block mb-1">To Date</Label>
                                    <Input
                                        type="date"
                                        value={activeQueueTab === "post-delivery" ? postDeliveryFilters.toDate : preDeliveryFilters.toDate}
                                        onChange={(e) => {
                                            if (activeQueueTab === "post-delivery") {
                                                setPostDeliveryFilters((f) => ({ ...f, toDate: e.target.value }));
                                            } else {
                                                setPreDeliveryFilters((f) => ({ ...f, toDate: e.target.value }));
                                            }
                                        }}
                                        className="h-9 w-32"
                                    />
                                </div>
                                {activeQueueTab === "post-delivery" && (
                                    <div>
                                        <Label className="text-xs text-[#5d5d5d] block mb-1">Follow-up Status</Label>
                                        <select
                                            value={postDeliveryFilters.followUpStatus}
                                            onChange={(e) =>
                                                setPostDeliveryFilters((f) => ({
                                                    ...f,
                                                    followUpStatus: e.target.value as "PENDING" | "FOLLOWED_UP" | "ALL",
                                                }))
                                            }
                                            className="h-9 min-w-[100px] rounded border border-[#d1d1d1] px-2 text-sm"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="FOLLOWED_UP">Followed up</option>
                                            <option value="ALL">All</option>
                                        </select>
                                    </div>
                                )}
                                <Button
                                    onClick={() => (activeQueueTab === "post-delivery" ? fetchPostDelivery(0) : fetchPreDelivery(0))}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                >
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcel tables - context-aware */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-0">
                            <div className="px-4 py-3 border-b border-[#d1d1d1]">
                                <p className="text-sm font-semibold text-neutral-800">
                                    {activeQueueTab === "post-delivery" ? "Post-Delivery Follow-Up Queue" : "Pre-Delivery Queue"}
                                </p>
                            </div>

                            {activeQueueTab === "post-delivery" && postDeliveryLoading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                </div>
                            ) : activeQueueTab === "pre-delivery" && preDeliveryLoading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                </div>
                            ) : (activeQueueTab === "post-delivery" ? postDeliveryParcels : preDeliveryParcels).length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-sm font-semibold text-neutral-800">All caught up!</p>
                                    <p className="text-xs text-[#5d5d5d] mt-1">
                                        {activeQueueTab === "post-delivery" 
                                            ? "No parcels awaiting post-delivery follow-up."
                                            : "No parcels awaiting initial calls."}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-[#d1d1d1]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Parcel ID
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Recipient
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Address
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Station
                                                </th>
                                                {activeQueueTab === "post-delivery" && (
                                                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                        Delivered
                                                    </th>
                                                )}
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#d1d1d1]">
                                            {(activeQueueTab === "post-delivery" ? postDeliveryParcels : preDeliveryParcels).map((parcel) => (
                                                <tr key={parcel.parcelId} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <span className="font-semibold text-neutral-800 text-sm">{parcel.parcelId}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="text-sm text-neutral-800">{parcel.receiverName || "N/A"}</p>
                                                        {parcel.parcelDescription && (
                                                            <p className="text-xs text-gray-500 truncate">{parcel.parcelDescription}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <a
                                                            href={`tel:${parcel.recieverPhoneNumber}`}
                                                            className="text-[#ea690c] hover:underline font-medium text-sm"
                                                        >
                                                            {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                                                        </a>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-neutral-700 max-w-[200px] truncate">
                                                        {parcel.receiverAddress || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-neutral-700">
                                                        {typeof parcel.officeId === "object" && parcel.officeId
                                                            ? (parcel.officeId as any).name
                                                            : parcel.officeName || "N/A"}
                                                    </td>
                                                    {activeQueueTab === "post-delivery" && (
                                                        <td className="py-3 px-4 text-sm text-neutral-700">
                                                            {parcel.deliveryDate ? formatDate(new Date(parcel.deliveryDate).toISOString()) : "—"}
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center">
                                                            <Button
                                                                onClick={() => {
                                                                    setOutcomeParcel(parcel);
                                                                    setSelectedOutcome("REACHED");
                                                                    setRemark("");
                                                                }}
                                                                size="sm"
                                                                className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                            >
                                                                Record Outcome
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!((activeQueueTab === "post-delivery" ? postDeliveryLoading : preDeliveryLoading)) &&
                                (activeQueueTab === "post-delivery"
                                    ? postDeliveryPagination.totalPages
                                    : preDeliveryPagination.totalPages) > 1 && (
                                    <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                        <p className="text-sm text-neutral-700">
                                            Showing{" "}
                                            {(activeQueueTab === "post-delivery"
                                                ? postDeliveryPagination.page
                                                : preDeliveryPagination.page) * 20 + 1}
                                            –
                                            {Math.min(
                                                ((activeQueueTab === "post-delivery"
                                                    ? postDeliveryPagination.page
                                                    : preDeliveryPagination.page) +
                                                    1) *
                                                    20,
                                                activeQueueTab === "post-delivery"
                                                    ? postDeliveryPagination.totalElements
                                                    : preDeliveryPagination.totalElements
                                            )}{" "}
                                            of{" "}
                                            {activeQueueTab === "post-delivery"
                                                ? postDeliveryPagination.totalElements
                                                : preDeliveryPagination.totalElements}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() =>
                                                    activeQueueTab === "post-delivery"
                                                        ? fetchPostDelivery(postDeliveryPagination.page - 1)
                                                        : fetchPreDelivery(preDeliveryPagination.page - 1)
                                                }
                                                disabled={
                                                    (activeQueueTab === "post-delivery"
                                                        ? postDeliveryPagination.page
                                                        : preDeliveryPagination.page) === 0
                                                }
                                                variant="outline"
                                                size="sm"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    activeQueueTab === "post-delivery"
                                                        ? fetchPostDelivery(postDeliveryPagination.page + 1)
                                                        : fetchPreDelivery(preDeliveryPagination.page + 1)
                                                }
                                                disabled={
                                                    (activeQueueTab === "post-delivery"
                                                        ? postDeliveryPagination.page
                                                        : preDeliveryPagination.page) >=
                                                    (activeQueueTab === "post-delivery"
                                                        ? postDeliveryPagination.totalPages
                                                        : preDeliveryPagination.totalPages) -
                                                        1
                                                }
                                                variant="outline"
                                                size="sm"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </main>

                {/* Record Call Outcome Modal */}
                {outcomeParcel && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#d1d1d1]">
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-800">Record Call Outcome</h3>
                                        <p className="text-xs text-[#5d5d5d] mt-0.5">
                                            {outcomeParcel.receiverName || outcomeParcel.parcelId}
                                            {outcomeParcel.recieverPhoneNumber && (
                                                <span className="ml-2 text-[#ea690c]">{formatPhoneNumber(outcomeParcel.recieverPhoneNumber)}</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setOutcomeParcel(null)}
                                        className="text-[#9a9a9a] hover:text-neutral-800 p-1 hover:bg-gray-100 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                            Outcome <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <div className="space-y-2">
                                            {OUTCOME_OPTIONS.map((opt) => (
                                                <label
                                                    key={opt.value}
                                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedOutcome === opt.value
                                                            ? "border-[#ea690c] bg-orange-50"
                                                            : "border-[#d1d1d1] hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="callOutcome"
                                                        value={opt.value}
                                                        checked={selectedOutcome === opt.value}
                                                        onChange={() => setSelectedOutcome(opt.value)}
                                                        className="w-4 h-4 text-[#ea690c]"
                                                    />
                                                    <span className="ml-3 text-sm font-medium text-neutral-800">{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                            Remark <span className="text-xs font-normal text-gray-500">(optional)</span>
                                        </Label>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            placeholder="Add any notes from the call..."
                                            className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none text-sm"
                                            rows={3}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-[#5d5d5d] mt-1 text-right">{remark.length}/500</p>
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <Button
                                            onClick={() => setOutcomeParcel(null)}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1]"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={async () => {
                                                if (!outcomeParcel) return;
                                                setSubmitting(true);
                                                try {
                                                    const response = await callCenterService.updateCallOutcome(
                                                        outcomeParcel.parcelId,
                                                        selectedOutcome,
                                                        remark.trim() || undefined
                                                    );
                                                    if (response.success) {
                                                        setOutcomeParcel(null);
                                                        // Refresh the current queue
                                                        if (activeQueueTab === "post-delivery") {
                                                            fetchPostDelivery(postDeliveryPagination.page);
                                                        } else {
                                                            fetchPreDelivery(preDeliveryPagination.page);
                                                        }
                                                        // Refresh stats
                                                        fetchStats();
                                                    }
                                                } finally {
                                                    setSubmitting(false);
                                                }
                                            }}
                                            disabled={submitting}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</>
                                            ) : (
                                                "Save Outcome"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};
