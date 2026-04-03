import { useState, useEffect, useCallback } from "react";
import {
    Loader, PhoneCall, X, CheckCircle2,
    RefreshCw, MessageSquare, MapPin, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../components/ui/toast";
import { useLocation } from "../../../contexts/LocationContext";
import { formatPhoneNumber, formatDate } from "../../../utils/dataHelpers";
import callCenterService from "../../../services/callCenterService";

type CallOutcome = "REACHED" | "UNREACHABLE" | "DELIVERED";

interface UncalledParcel {
    parcelId: string;
    receiverName?: string;
    recieverPhoneNumber?: string;
    receiverAddress?: string;
    parcelDescription?: string;
    officeName?: string;
    officeId?: string | { name?: string };
    createdAt?: number;
}

const OUTCOME_OPTIONS: { value: CallOutcome; label: string; desc: string; color: string }[] = [
    { value: "REACHED", label: "Reached", desc: "Successfully spoke with recipient", color: "border-green-300 bg-green-50 text-green-800" },
    { value: "UNREACHABLE", label: "Unreachable", desc: "Could not get through", color: "border-red-300 bg-red-50 text-red-800" },
    { value: "DELIVERED", label: "Confirmed Delivered", desc: "Recipient confirmed receipt", color: "border-blue-300 bg-blue-50 text-blue-800" },
];

export const PostDeliveryFollowUp = () => {
    const { showToast } = useToast();
    const { stations } = useLocation();

    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [parcels, setParcels] = useState<UncalledParcel[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

    // Modal
    const [outcomeParcel, setOutcomeParcel] = useState<UncalledParcel | null>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>("REACHED");
    const [remark, setRemark] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchParcels = useCallback(async (page = 0) => {
        if (!selectedOfficeId) return;
        setLoading(true);
        try {
            const response = await callCenterService.getDeliveredUncalled({
                page,
                size: 20,
                officeId: selectedOfficeId,
                followUpStatus: "PENDING",
            });
            if (response.success && response.data) {
                const data = response.data as any;
                const content: UncalledParcel[] = Array.isArray(data.content) ? data.content : [];
                setParcels(content);
                setPagination({
                    page: data.number ?? page,
                    size: data.size ?? 20,
                    totalElements: data.totalElements ?? content.length,
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

    const openModal = (parcel: UncalledParcel) => {
        setOutcomeParcel(parcel);
        setSelectedOutcome("REACHED");
        setRemark("");
    };

    const handleSubmit = async () => {
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
                setParcels(prev => prev.filter(p => p.parcelId !== outcomeParcel.parcelId));
                setPagination(prev => ({ ...prev, totalElements: Math.max(0, prev.totalElements - 1) }));
            } else {
                showToast(response.message || "Failed to record outcome", "error");
            }
        } catch {
            showToast("Failed to record outcome", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header>
                    <h1 className="text-xl font-bold text-neutral-800">Post-Delivery Follow-Up</h1>
                    <p className="text-xs text-[#5d5d5d] mt-0.5">
                        Call delivered parcel recipients and record the outcome.
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

                {selectedOfficeId && !loading && (
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-neutral-800">{pagination.totalElements}</span> parcels awaiting follow-up
                    </p>
                )}

                {/* Table */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1]">
                            <p className="text-sm font-semibold text-neutral-800">Uncalled Parcels</p>
                        </div>

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
                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-neutral-800">All caught up!</p>
                                <p className="text-xs text-[#5d5d5d] mt-1">No parcels awaiting follow-up.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-[#d1d1d1]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Address</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Registered</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                        {parcels.map(p => (
                                            <tr key={p.parcelId} className="hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-sm text-neutral-800">{p.receiverName || "N/A"}</p>
                                                    {p.parcelDescription && <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.parcelDescription}</p>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <a href={`tel:${p.recieverPhoneNumber}`} className="text-[#ea690c] hover:underline text-sm font-medium">
                                                        {p.recieverPhoneNumber ? formatPhoneNumber(p.recieverPhoneNumber) : "N/A"}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px] truncate" title={p.receiverAddress}>
                                                    {p.receiverAddress || "—"}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a href={`tel:${p.recieverPhoneNumber}`} className="inline-flex items-center justify-center h-8 w-8 rounded border border-[#ea690c] text-[#ea690c] hover:bg-orange-50" title="Call">
                                                            <PhoneCall className="w-4 h-4" />
                                                        </a>
                                                        <Button onClick={() => openModal(p)} size="sm" className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3">
                                                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                                            Record
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
                                    <Button onClick={() => fetchParcels(pagination.page - 1)} disabled={pagination.page === 0} variant="outline" size="sm">Previous</Button>
                                    <Button onClick={() => fetchParcels(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1} variant="outline" size="sm">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Outcome Modal */}
            {outcomeParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">Record Call Outcome</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-0.5">{outcomeParcel.receiverName || outcomeParcel.parcelId}</p>
                                    {outcomeParcel.recieverPhoneNumber && (
                                        <a href={`tel:${outcomeParcel.recieverPhoneNumber}`} className="text-xs text-[#ea690c] hover:underline">
                                            {formatPhoneNumber(outcomeParcel.recieverPhoneNumber)}
                                        </a>
                                    )}
                                </div>
                                <button onClick={() => setOutcomeParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2 block">Outcome <span className="text-[#e22420]">*</span></Label>
                                    <div className="space-y-2">
                                        {OUTCOME_OPTIONS.map(opt => (
                                            <label key={opt.value} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${selectedOutcome === opt.value ? opt.color + " border-current" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                                <input type="radio" name="outcome" value={opt.value} checked={selectedOutcome === opt.value} onChange={() => setSelectedOutcome(opt.value)} className="w-4 h-4 text-[#ea690c]" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-800">{opt.label}</p>
                                                    <p className="text-xs text-gray-500">{opt.desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">
                                        Remark <span className="text-xs font-normal text-gray-400">(optional)</span>
                                    </Label>
                                    <textarea
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                        placeholder="Any notes from the call..."
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none text-sm"
                                        rows={3}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-400 text-right mt-0.5">{remark.length}/500</p>
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={() => setOutcomeParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={submitting}>Cancel</Button>
                                    <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50">
                                        {submitting ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Outcome"}
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
