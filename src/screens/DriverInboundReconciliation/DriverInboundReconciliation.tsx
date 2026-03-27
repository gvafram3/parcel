import { useState, useEffect, useCallback } from "react";
import {
    Loader, CheckCircleIcon, XIcon, PackageIcon,
    MapPinIcon, Phone, ChevronDownIcon, ChevronRightIcon,
    UserIcon, RefreshCw, BadgeCheck,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatCurrency, formatPhoneNumber } from "../../utils/dataHelpers";
import frontdeskService from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";

interface DriverParcel {
    parcelId: string | null;
    receiverName?: string;
    receiverPhoneNumber?: string;
    receiverAddress?: string;
    senderName?: string;
    parcelAmount: number;
    delivered: boolean;
    returned: boolean;
    pickedUp: boolean;
    paymentMethod?: string | null;
    inboundCost: number;
    deliveryCost: number;
    shelfName?: string;
    vehicleNumber?: string;
    inboudPayed: boolean;
}

interface DriverReconciliation {
    id: string;
    riderName: string;
    riderPhoneNumber: string;
    totalAmount: number;
    amountDelivered: number;
    payed: boolean;
    officeId: string;
    parcels: DriverParcel[];
}

export const DriverInboundReconciliation = () => {
    const { showToast } = useToast();

    const [records, setRecords]           = useState<DriverReconciliation[]>([]);
    const [loading, setLoading]           = useState(false);
    const [pagination, setPagination]     = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
    const [expandedIds, setExpandedIds]   = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
    const [payingId, setPayingId]         = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchUnpaid = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const response = await frontdeskService.getUnpaidDriverReconciliations(page, 20);
            if (response.success && response.data) {
                const data = response.data as any;
                const content: DriverReconciliation[] = Array.isArray(data.content) ? data.content : [];
                setRecords(content);
                setPagination({
                    page: data.number ?? page,
                    size: data.size ?? 20,
                    totalElements: data.totalElements ?? content.length,
                    totalPages: data.totalPages ?? 1,
                });
            } else {
                showToast(response.message || "Failed to load driver reconciliations", "error");
            }
        } catch {
            showToast("Failed to load driver reconciliations", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchUnpaid(0); }, [fetchUnpaid]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === records.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(records.map(r => r.id)));
        }
    };

    const handleMarkPaid = async (record: DriverReconciliation) => {
        setPayingId(record.id);
        try {
            const response = await frontdeskService.payDriverReconciliation(record.id);
            if (response.success) {
                showToast(`${record.riderName} marked as paid`, "success");
                setRecords(prev => prev.filter(r => r.id !== record.id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(record.id); return n; });
                setPagination(prev => ({ ...prev, totalElements: Math.max(0, prev.totalElements - 1) }));
                setShowConfirmModal(false);
            } else {
                showToast(response.message || "Failed to mark as paid", "error");
            }
        } catch {
            showToast("Failed to mark as paid", "error");
        } finally {
            setPayingId(null);
        }
    };

    const selectedRecords = records.filter(r => selectedIds.has(r.id));
    const totalOwed       = selectedRecords.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const totalParcels    = selectedRecords.reduce((s, r) => s + (r.parcels?.length || 0), 0);

    return (
        <div className={`w-full ${showConfirmModal ? "overflow-hidden" : ""}`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">

                    {/* Selected summary */}
                    {selectedIds.size > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-base font-semibold">
                            {selectedIds.size} Driver{selectedIds.size !== 1 ? "s" : ""} Selected
                        </Badge>
                    )}

                    {/* Summary card */}
                    {selectedIds.size > 0 && (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Drivers Selected</p>
                                            <p className="text-2xl font-bold text-[#ea690c]">{selectedIds.size}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Total Parcels</p>
                                            <p className="text-2xl font-bold text-blue-600">{totalParcels}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Total Amount Owed</p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalOwed)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={selectedIds.size === 0}
                                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        Mark Selected as Paid
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main table */}
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <CardContent className="p-0">
                            {/* Table header bar */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1]">
                                <p className="text-sm font-semibold text-neutral-800">Driver Tracker</p>
                                <Button
                                    onClick={() => fetchUnpaid(pagination.page)}
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                >
                                    {loading
                                        ? <Loader className="w-4 h-4 animate-spin" />
                                        : <><RefreshCw className="w-4 h-4 mr-1" />Refresh</>}
                                </Button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-neutral-700 font-semibold text-lg">Loading drivers...</p>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="text-center py-12">
                                    <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-neutral-800 font-semibold text-lg mb-2">No drivers found</p>
                                    <p className="text-sm text-gray-500">No unpaid driver inbound cash found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.size === records.length && records.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Driver</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Parcels</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Owed</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Delivered Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {records.map((record, groupIndex) => {
                                                const isSelected = selectedIds.has(record.id);
                                                const isExpanded = expandedIds.has(record.id);
                                                const deliveredParcels = record.parcels?.filter(p => p.delivered && !p.returned) ?? [];
                                                const failedParcels    = record.parcels?.filter(p => p.returned) ?? [];
                                                const allParcels       = record.parcels ?? [];

                                                return (
                                                    <>
                                                        {/* Driver row */}
                                                        <tr
                                                            key={record.id}
                                                            className={`hover:bg-gray-50 transition-colors ${groupIndex !== records.length - 1 ? "border-b border-gray-200" : ""} ${isSelected ? "bg-orange-50" : ""}`}
                                                        >
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelect(record.id)}
                                                                    className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4 border-r border-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => toggleExpand(record.id)}
                                                                        className="text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        {isExpanded
                                                                            ? <ChevronDownIcon className="w-4 h-4" />
                                                                            : <ChevronRightIcon className="w-4 h-4" />}
                                                                    </button>
                                                                    <div className="flex items-center gap-2">
                                                                        <UserIcon className="w-4 h-4 text-blue-500" />
                                                                        <div>
                                                                            <div className="text-sm font-semibold text-neutral-800">{record.riderName}</div>
                                                                            {record.riderPhoneNumber && (
                                                                                <a
                                                                                    href={`tel:${record.riderPhoneNumber}`}
                                                                                    className="text-xs text-[#ea690c] hover:underline flex items-center gap-1"
                                                                                >
                                                                                    <Phone className="w-3 h-3" />
                                                                                    {formatPhoneNumber(record.riderPhoneNumber)}
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <div className="text-sm font-semibold text-blue-600">
                                                                    {deliveredParcels.length} / {record.parcels?.length ?? 0}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Delivered / Total</div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <div className="text-sm font-bold text-[#ea690c]">
                                                                    {formatCurrency(record.totalAmount)}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <div className="text-sm font-bold text-green-600">
                                                                    {formatCurrency(record.amountDelivered)}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Badge className={record.payed
                                                                    ? "bg-green-100 text-green-800 border-green-200 text-xs"
                                                                    : "bg-red-100 text-red-800 border-red-200 text-xs"}>
                                                                    {record.payed ? "Paid" : "Unpaid"}
                                                                </Badge>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded parcels */}
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={6} className="px-0 py-0">
                                                                    <div className="bg-gray-50 border-t border-gray-200">
                                                                        <table className="w-full">
                                                                            <thead className="bg-gray-100">
                                                                                <tr>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Recipient</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Address</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Inbound Cost</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Payment</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {allParcels.map((parcel, idx) => {
                                                                                    let statusLabel = "Pending";
                                                                                    let statusClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                                                                                    if (parcel.returned) { statusLabel = "Returned"; statusClass = "bg-red-100 text-red-800 border-red-200"; }
                                                                                    else if (parcel.delivered) { statusLabel = "Delivered"; statusClass = "bg-green-100 text-green-800 border-green-200"; }
                                                                                    else if (parcel.pickedUp) { statusLabel = "Picked Up"; statusClass = "bg-blue-100 text-blue-800 border-blue-200"; }
                                                                                    return (
                                                                                    <tr
                                                                                        key={parcel.parcelId ?? idx}
                                                                                        className={`${idx !== allParcels.length - 1 ? "border-b border-gray-200" : ""}`}
                                                                                    >
                                                                                        <td className="px-4 py-3">
                                                                                            <div className="text-sm font-semibold text-neutral-800">{parcel.receiverName || "N/A"}</div>
                                                                                            {parcel.senderName && (
                                                                                                <div className="text-xs text-gray-500 truncate max-w-[150px]">From: {parcel.senderName}</div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                                            {parcel.receiverPhoneNumber ? (
                                                                                                <a href={`tel:${parcel.receiverPhoneNumber}`} className="text-sm text-[#ea690c] hover:underline font-medium">
                                                                                                    {formatPhoneNumber(parcel.receiverPhoneNumber)}
                                                                                                </a>
                                                                                            ) : <span className="text-sm text-gray-400">N/A</span>}
                                                                                        </td>
                                                                                        <td className="px-4 py-3">
                                                                                            {parcel.receiverAddress ? (
                                                                                                <div className="flex items-start gap-1">
                                                                                                    <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                                                    <span className="text-sm text-neutral-700 truncate max-w-[200px]" title={parcel.receiverAddress}>
                                                                                                        {parcel.receiverAddress}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : <span className="text-gray-400">N/A</span>}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                                            <div className="text-sm font-bold text-[#ea690c]">{formatCurrency(parcel.inboundCost)}</div>
                                                                                        </td>
                                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                                            <Badge className={`${parcel.paymentMethod === "cash" ? "bg-green-100 text-green-800" : parcel.paymentMethod === "momo" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"} border text-xs`}>
                                                                                                {parcel.paymentMethod || "N/A"}
                                                                                            </Badge>
                                                                                        </td>
                                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                                            <Badge className={`${statusClass} border text-xs`}>{statusLabel}</Badge>
                                                                                        </td>
                                                                                    </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>

                                                                        {/* Failed parcels */}
                                                                        {failedParcels.length > 0 && (
                                                                            <div className="border-t-2 border-red-300 bg-red-50 px-4 py-3">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-sm font-semibold text-red-800">
                                                                                        Returned parcels: {failedParcels.length}
                                                                                    </span>
                                                                                </div>
                                                                                <table className="w-full text-xs">
                                                                                    <thead className="bg-red-200 border-b-2 border-red-400">
                                                                                        <tr>
                                                                                            <th className="px-2 py-1.5 text-left font-semibold text-red-900">Recipient</th>
                                                                                            <th className="px-2 py-1.5 text-left font-semibold text-red-900">Phone</th>
                                                                                            <th className="px-2 py-1.5 text-left font-semibold text-red-900">Address</th>
                                                                                            <th className="px-2 py-1.5 text-right font-semibold text-red-900">Inbound Cost</th>
                                                                                            <th className="px-2 py-1.5 text-center font-semibold text-red-900">Status</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {failedParcels.map((parcel, idx) => (
                                                                                            <tr key={parcel.parcelId ?? idx} className="border-b border-red-200 bg-red-50/80 hover:bg-red-100/80">
                                                                                                <td className="px-2 py-1.5 text-red-900">{parcel.receiverName || "N/A"}</td>
                                                                                                <td className="px-2 py-1.5 text-red-900">{parcel.receiverPhoneNumber ? formatPhoneNumber(parcel.receiverPhoneNumber) : "N/A"}</td>
                                                                                                <td className="px-2 py-1.5 text-red-900 truncate max-w-[140px]">{parcel.receiverAddress || "N/A"}</td>
                                                                                                <td className="px-2 py-1.5 text-right text-red-900 font-medium">{formatCurrency(parcel.inboundCost)}</td>
                                                                                                <td className="px-2 py-1.5 text-center">
                                                                                                    <Badge className="bg-red-600 text-white border-0 text-[10px] font-semibold">Returned</Badge>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
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
                                        Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => fetchUnpaid(pagination.page - 1)} disabled={pagination.page === 0 || loading} variant="outline" size="sm" className="border border-[#d1d1d1]">Previous</Button>
                                        <Button onClick={() => fetchUnpaid(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1 || loading} variant="outline" size="sm" className="border border-[#d1d1d1]">Next</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Confirm modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="inline-flex items-center gap-2">
                                    <BadgeCheck className="w-6 h-6 text-[#ea690c]" />
                                    <h2 className="font-semibold text-[#ea690c] text-lg">Confirm Payment</h2>
                                </div>
                                <button onClick={() => setShowConfirmModal(false)} className="text-[#9a9a9a] hover:text-neutral-800">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">
                                        You are about to mark {selectedIds.size} driver(s) as paid
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <p className="text-sm text-blue-800">Total Parcels: <span className="font-bold">{totalParcels}</span></p>
                                        <p className="text-sm text-blue-800">Total Amount: <span className="font-bold">{formatCurrency(totalOwed)}</span></p>
                                    </div>
                                </div>

                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Driver</th>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Parcels</th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedRecords.map(r => (
                                                <tr key={r.id} className="border-b border-gray-100">
                                                    <td className="px-3 py-2 font-semibold">{r.riderName}</td>
                                                    <td className="px-3 py-2">{r.parcels?.length ?? 0} parcels</td>
                                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(r.totalAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1 border border-[#d1d1d1]">Cancel</Button>
                                    <Button
                                        onClick={async () => {
                                            for (const r of selectedRecords) {
                                                await handleMarkPaid(r);
                                            }
                                        }}
                                        disabled={!!payingId}
                                        className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {payingId
                                            ? <><Loader className="w-4 h-4 animate-spin mr-2" />Processing...</>
                                            : "Confirm Payment"}
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
