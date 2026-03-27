import React, { useState, useEffect, useCallback } from "react";
import {
    PhoneIcon, CheckCircleIcon, Clock, Loader, X, Package,
    PhoneCall, MessageSquare, PhoneOff, Truck, PieChart, BuildingIcon,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";
import { useLocation } from "../../contexts/LocationContext";
import { formatDate } from "../../utils/dataHelpers";
import { formatPhoneNumber } from "../../utils/dataHelpers";
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

export const CallCenter: React.FC<CallCenterProps> = ({ view = "follow-up" }) => {
    const { currentUser } = useStation();
    const { stations } = useLocation();
    const { showToast } = useToast();

    // Station selector — auto-select user's own office or first station
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");

    // Auto-select on mount: prefer user's own office, else first station
    useEffect(() => {
        if (selectedOfficeId) return; // already set
        const userOfficeId = (currentUser as any)?.office?.id || (currentUser as any)?.stationId;
        if (userOfficeId) {
            setSelectedOfficeId(userOfficeId);
        } else if (stations.length > 0) {
            setSelectedOfficeId(stations[0].id);
        }
    }, [stations, currentUser, selectedOfficeId]);

    // Uncalled parcels queue
    const [parcels, setParcels] = useState<UncalledParcel[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

    // Stats
    const [stats, setStats] = useState<CallCenterStatsResponse | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Call outcome modal
    const [outcomeParcel, setOutcomeParcel] = useState<UncalledParcel | null>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>("REACHED");
    const [remark, setRemark] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchParcels = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const response = await callCenterService.getUncalledParcels(selectedOfficeId || undefined);
            if (response.success && response.data) {
                const data = response.data as any;
                const content: UncalledParcel[] = Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : [];
                setParcels(content);
                setPagination(prev => ({
                    ...prev,
                    page: data.number ?? page,
                    totalElements: data.totalElements ?? content.length,
                    totalPages: data.totalPages ?? 1,
                }));
            } else {
                showToast(response.message || "Failed to load parcels", "error");
                setParcels([]);
            }
        } catch {
            showToast("Failed to load parcels. Please try again.", "error");
            setParcels([]);
        } finally {
            setLoading(false);
        }
    }, [showToast, selectedOfficeId]);

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
        if (!selectedOfficeId) return;
        fetchParcels(0);
        fetchStats();
    }, [fetchParcels, fetchStats, selectedOfficeId]);

    const openOutcomeModal = (parcel: UncalledParcel) => {
        setOutcomeParcel(parcel);
        setSelectedOutcome("REACHED");
        setRemark("");
    };

    const handleSubmitOutcome = async () => {
        if (!outcomeParcel) return;
        setSubmitting(true);
        try {
            const response = await callCenterService.updateCallOutcome(
                outcomeParcel.parcelId,
                selectedOutcome,
                remark.trim() || undefined
            );
            if (response.success) {
                showToast(`Outcome recorded: ${selectedOutcome}`, "success");
                setOutcomeParcel(null);
                // Remove from uncalled list since it's now been called
                setParcels(prev => prev.filter(p => p.parcelId !== outcomeParcel.parcelId));
                setPagination(prev => ({ ...prev, totalElements: Math.max(0, prev.totalElements - 1) }));
                fetchStats();
            } else {
                showToast(response.message || "Failed to record outcome", "error");
            }
        } catch {
            showToast("Failed to record outcome. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const getOfficeName = (p: UncalledParcel) =>
        typeof p.officeId === "object" && p.officeId ? (p.officeId as { name?: string }).name : p.officeName ?? "N/A";

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-neutral-800">Call Center</h1>
                            <p className="text-xs text-[#5d5d5d]">
                                Parcels awaiting call center follow-up — record outcomes after speaking with recipients.
                            </p>
                        </div>
                        {/* Station selector */}
                        <div className="flex items-center gap-2">
                            <BuildingIcon className="w-4 h-4 text-[#5d5d5d] flex-shrink-0" />
                            <select
                                value={selectedOfficeId}
                                onChange={e => setSelectedOfficeId(e.target.value)}
                                className="px-3 py-2 border border-[#d1d1d1] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c] min-w-[180px]"
                            >
                                <option value="">All Stations</option>
                                {stations.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                <main className="flex-1 space-y-6">
                    {/* Stats from yesterday */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none bg-[#ffefe5]">
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[11px] font-medium text-[#8b4a1f] uppercase tracking-wide">Uncalled Queue</p>
                                    <p className="mt-2 text-2xl font-bold text-[#ea690c]">
                                        {loading ? "—" : pagination.totalElements}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#8b4a1f]">Parcels not yet called</p>
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
                                    <p className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">Delivered (Yesterday)</p>
                                    <p className="mt-2 text-2xl font-bold text-blue-700">
                                        {statsLoading ? "—" : (stats?.totalDeliveredYesterday ?? "—")}
                                    </p>
                                    <p className="mt-1 text-[11px] text-blue-600">Total delivered yesterday</p>
                                </div>
                                <Truck className="w-8 h-8 text-blue-500 opacity-70" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Uncalled parcels table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1]">
                                <p className="text-sm font-semibold text-neutral-800">Uncalled Parcels</p>
                                <Button
                                    onClick={() => fetchParcels(pagination.page)}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                    disabled={loading}
                                >
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Refresh"}
                                </Button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                </div>
                            ) : parcels.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-sm font-semibold text-neutral-800">All caught up!</p>
                                    <p className="text-xs text-[#5d5d5d] mt-1">No parcels awaiting call center follow-up.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-[#d1d1d1]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Address</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Station</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Registered</th>
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                            {parcels.map((p) => (
                                                <tr key={p.parcelId} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <p className="font-semibold text-neutral-800 text-sm">{p.receiverName || "N/A"}</p>
                                                        {p.parcelDescription && (
                                                            <p className="text-xs text-gray-500 truncate max-w-[160px]">{p.parcelDescription}</p>
                                                        )}
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
                                                    <td className="py-3 px-4 text-sm text-neutral-700">{getOfficeName(p)}</td>
                                                    <td className="py-3 px-4 text-sm text-neutral-700">
                                                        {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "N/A"}
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
                                                                onClick={() => openOutcomeModal(p)}
                                                                size="sm"
                                                                className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
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

                            {!loading && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                    <p className="text-sm text-neutral-700">
                                        Showing {pagination.page * pagination.size + 1}–
                                        {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => fetchParcels(pagination.page - 1)}
                                            disabled={pagination.page === 0 || loading}
                                            variant="outline" size="sm"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => fetchParcels(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages - 1 || loading}
                                            variant="outline" size="sm"
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
                                    <X className="w-5 h-5" />
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
                                                <Badge className={`ml-auto text-xs border ${opt.color}`}>{opt.value}</Badge>
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
                                        onClick={handleSubmitOutcome}
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
    );
};
