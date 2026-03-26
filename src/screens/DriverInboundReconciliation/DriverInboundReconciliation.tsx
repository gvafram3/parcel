import { useState, useEffect, useCallback } from "react";
import {
    Loader, Truck, ChevronDown, ChevronRight, CheckCircle2,
    Package, Phone, RefreshCw, BadgeCheck, Clock,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { formatCurrency, formatPhoneNumber } from "../../utils/dataHelpers";
import frontdeskService from "../../services/frontdeskService";

interface DriverParcel {
    parcelId: string | null;
    receiverName?: string;
    receiverPhoneNumber?: string;
    receiverAddress?: string;
    senderName?: string;
    senderPhoneNumber?: string;
    parcelAmount: number;
    payed: boolean;
    returned: boolean;
    delivered: boolean;
    paymentMethod?: string | null;
    inboundCost: number;
    deliveryCost: number;
    storageCost: number;
    pickUpCost: number;
    pickedUp: boolean;
    homeDelivery: boolean;
    vehicleNumber?: string;
    driverName?: string;
    driverPhoneNumber?: string;
    driverId?: string;
    shelfName?: string;
    inboudPayed: boolean;
    typeofParcel?: string;
    POD?: boolean;
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

    const [records, setRecords] = useState<DriverReconciliation[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [payingId, setPayingId] = useState<string | null>(null);

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

    const handleMarkPaid = async (record: DriverReconciliation) => {
        setPayingId(record.id);
        try {
            const response = await frontdeskService.payDriverReconciliation(record.id);
            if (response.success) {
                showToast(`${record.riderName} marked as paid`, "success");
                setRecords(prev => prev.filter(r => r.id !== record.id));
                setPagination(prev => ({ ...prev, totalElements: Math.max(0, prev.totalElements - 1) }));
            } else {
                showToast(response.message || "Failed to mark as paid", "error");
            }
        } catch {
            showToast("Failed to mark as paid", "error");
        } finally {
            setPayingId(null);
        }
    };

    // Summary stats
    const totalOwed = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalDrivers = records.length;
    const totalParcels = records.reduce((sum, r) => sum + (r.parcels?.length || 0), 0);

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-800">Driver Inbound Reconciliation</h1>
                        <p className="text-xs text-[#5d5d5d] mt-0.5">
                            Drivers with unpaid inbound cash — review parcels and mark as settled.
                        </p>
                    </div>
                    <Button
                        onClick={() => fetchUnpaid(pagination.page)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 flex-shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </header>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="border-none bg-[#ffefe5]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-[#8b4a1f] uppercase tracking-wide">Total Owed</p>
                                <p className="mt-1 text-xl font-bold text-[#ea690c]">{formatCurrency(totalOwed)}</p>
                            </div>
                            <Truck className="w-7 h-7 text-[#f5a76a]" />
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-[#ffe5e8]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-[#b3261e] uppercase tracking-wide">Drivers Pending</p>
                                <p className="mt-1 text-xl font-bold text-[#b3261e]">{pagination.totalElements}</p>
                            </div>
                            <Clock className="w-7 h-7 text-[#b3261e] opacity-60" />
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-[#e5f0ff]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">Total Parcels</p>
                                <p className="mt-1 text-xl font-bold text-blue-700">{totalParcels}</p>
                            </div>
                            <Package className="w-7 h-7 text-blue-400" />
                        </CardContent>
                    </Card>
                </div>

                {/* Main list */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-16">
                            <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-[#5d5d5d]">Loading driver reconciliations...</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-16">
                            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-neutral-800">All settled!</p>
                            <p className="text-xs text-[#5d5d5d] mt-1">No unpaid driver inbound cash found.</p>
                        </div>
                    ) : (
                        records.map(record => {
                            const isExpanded = expandedIds.has(record.id);
                            const isPaying = payingId === record.id;
                            const readyParcels = record.parcels?.filter(p => p.pickedUp || p.delivered) ?? [];
                            const pendingParcels = record.parcels?.filter(p => !p.pickedUp && !p.delivered) ?? [];

                            return (
                                <Card key={record.id} className="border border-[#d1d1d1] bg-white overflow-hidden">
                                    {/* Driver header row */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleExpand(record.id)}
                                    >
                                        <button className="text-gray-400 flex-shrink-0">
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4" />
                                                : <ChevronRight className="w-4 h-4" />
                                            }
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-neutral-800">{record.riderName}</span>
                                                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                                    Unpaid
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <a
                                                    href={`tel:${record.riderPhoneNumber}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="text-xs text-[#ea690c] hover:underline"
                                                >
                                                    {formatPhoneNumber(record.riderPhoneNumber)}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                                            <span>{record.parcels?.length ?? 0} parcels</span>
                                            <span className="text-green-600 font-medium">{readyParcels.length} ready</span>
                                            <span className="text-amber-600 font-medium">{pendingParcels.length} pending</span>
                                        </div>

                                        {/* Amount + pay button */}
                                        <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Total Owed</p>
                                                <p className="text-base font-bold text-[#ea690c]">{formatCurrency(record.totalAmount)}</p>
                                            </div>
                                            <Button
                                                onClick={() => handleMarkPaid(record)}
                                                disabled={isPaying}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"
                                            >
                                                {isPaying
                                                    ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                                    : <><BadgeCheck className="w-3.5 h-3.5 mr-1" />Mark Paid</>
                                                }
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded parcels table */}
                                    {isExpanded && (
                                        <div className="border-t border-[#d1d1d1]">
                                            {/* Mobile stats */}
                                            <div className="sm:hidden flex gap-4 px-4 py-2 bg-gray-50 text-xs text-gray-500 border-b border-[#d1d1d1]">
                                                <span>{record.parcels?.length ?? 0} parcels</span>
                                                <span className="text-green-600 font-medium">{readyParcels.length} ready</span>
                                                <span className="text-amber-600 font-medium">{pendingParcels.length} pending</span>
                                            </div>

                                            {!record.parcels?.length ? (
                                                <p className="text-xs text-gray-400 px-4 py-4">No parcel details available.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-gray-50 border-b border-[#d1d1d1]">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wide">Receiver</th>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wide">Shelf</th>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wide">Inbound</th>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wide">Vehicle</th>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#f0f0f0]">
                                                            {record.parcels.map((parcel, idx) => {
                                                                const isReady = parcel.pickedUp || parcel.delivered;
                                                                const isReturned = parcel.returned;

                                                                return (
                                                                    <tr key={parcel.parcelId ?? idx} className="hover:bg-gray-50">
                                                                        <td className="px-4 py-2.5">
                                                                            <p className="font-medium text-neutral-800">{parcel.receiverName || "N/A"}</p>
                                                                            {parcel.receiverPhoneNumber && (
                                                                                <a
                                                                                    href={`tel:${parcel.receiverPhoneNumber}`}
                                                                                    className="text-[#ea690c] hover:underline"
                                                                                >
                                                                                    {formatPhoneNumber(parcel.receiverPhoneNumber)}
                                                                                </a>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-gray-600">
                                                                            {parcel.shelfName || "—"}
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span className="font-semibold text-[#ea690c]">
                                                                                {formatCurrency(parcel.inboundCost)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-gray-600">
                                                                            {parcel.vehicleNumber || "—"}
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            {isReturned ? (
                                                                                <Badge className="bg-red-100 text-red-700 border-red-200">Returned</Badge>
                                                                            ) : isReady ? (
                                                                                <Badge className="bg-green-100 text-green-700 border-green-200">Ready</Badge>
                                                                            ) : (
                                                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50 border-t-2 border-[#d1d1d1]">
                                                            <tr>
                                                                <td colSpan={2} className="px-4 py-2.5 font-semibold text-gray-700">Total</td>
                                                                <td className="px-4 py-2.5 font-bold text-[#ea690c]">
                                                                    {formatCurrency(record.parcels.reduce((s, p) => s + (p.inboundCost || 0), 0))}
                                                                </td>
                                                                <td colSpan={2} />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-500">
                            {pagination.page * pagination.size + 1}–{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => fetchUnpaid(pagination.page - 1)}
                                disabled={pagination.page === 0 || loading}
                                variant="outline" size="sm"
                            >Previous</Button>
                            <Button
                                onClick={() => fetchUnpaid(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages - 1 || loading}
                                variant="outline" size="sm"
                            >Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
