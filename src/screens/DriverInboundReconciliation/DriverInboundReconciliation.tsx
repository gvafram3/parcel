import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Loader, CheckCircleIcon, XIcon, PackageIcon,
    Phone, ChevronDownIcon, ChevronRightIcon,
    UserIcon, RefreshCw, BadgeCheck, Truck, Clock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatCurrency, formatPhoneNumber, formatDate } from "../../utils/dataHelpers";
import frontdeskService from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";

interface ParcelInfo {
    parcelId: string;
    receiverName?: string;
    receiverPhoneNumber?: string;
    receiverAddress?: string;
    senderName?: string;
    shelfName?: string;
    vehicleNumber?: string;
    inboundCost: number;
    deliveryCost: number;
    pickUpCost: number;
    storageCost: number;
    pickedUp: boolean;
    delivered: boolean;
    returned: boolean;
    paymentMethod?: string | null;
    inboudPayed: boolean;
}

interface DriverAssignment {
    id: string;
    driverName: string;
    driverPhoneNumber: string;
    parcelInfo: ParcelInfo;
    payed: boolean;
    amount: number;
    delivered: boolean;
    createdAt: number;
}

interface DriverGroup {
    key: string;
    driverName: string;
    driverPhoneNumber: string;
    vehicleNumber: string;
    assignments: DriverAssignment[];
    totalAmount: number;
    readyCount: number;
}

export const DriverInboundReconciliation = () => {
    const { showToast } = useToast();

    const [assignments, setAssignments]       = useState<DriverAssignment[]>([]);
    const [loading, setLoading]               = useState(false);
    const PAGE_SIZE = 500;
    const [pagination, setPagination]         = useState({ page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 });
    const [expandedKeys, setExpandedKeys]     = useState<Set<string>>(new Set());
    const [selectedKeys, setSelectedKeys]     = useState<Set<string>>(new Set());
    const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
    const [payingIds, setPayingIds]           = useState<Set<string>>(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchAssignments = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const response = await frontdeskService.getUnpaidDriverAssignments(page, PAGE_SIZE);
            if (response.success && response.data) {
                const data = response.data as any;
                setAssignments(Array.isArray(data.content) ? data.content : []);
                setPagination({ page: data.number ?? page, size: data.size ?? PAGE_SIZE, totalElements: data.totalElements ?? 0, totalPages: data.totalPages ?? 1 });
            } else {
                showToast(response.message || "Failed to load", "error");
            }
        } catch { showToast("Failed to load assignments", "error"); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchAssignments(0); }, [fetchAssignments]);

    const groups = useMemo<DriverGroup[]>(() => {
        const map = new Map<string, DriverGroup>();
        assignments.forEach(a => {
            const vehicle = a.parcelInfo?.vehicleNumber || "Unknown";
            const key = `${a.driverPhoneNumber}__${vehicle}`;
            if (!map.has(key)) map.set(key, { key, driverName: a.driverName, driverPhoneNumber: a.driverPhoneNumber, vehicleNumber: vehicle, assignments: [], totalAmount: 0, readyCount: 0 });
            const g = map.get(key)!;
            g.assignments.push(a);
            g.totalAmount += a.amount || 0;
            if (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) g.readyCount++;
        });
        return Array.from(map.values()).sort((a, b) => a.driverPhoneNumber.localeCompare(b.driverPhoneNumber));
    }, [assignments]);

    const toggleExpand = (key: string) => setExpandedKeys(prev => {
        const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const toggleSelect = (key: string) => setSelectedKeys(prev => {
        const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleSelectAll = () => {
        const fullyReadyGroups = groups.filter(g => g.assignments.length > 0 && g.assignments.every(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned));
        setSelectedKeys(selectedKeys.size === fullyReadyGroups.length && fullyReadyGroups.length > 0 ? new Set() : new Set(fullyReadyGroups.map(g => g.key)));
    };

    const toggleParcel = (assignmentId: string) => setSelectedParcelIds(prev => {
        const n = new Set(prev); n.has(assignmentId) ? n.delete(assignmentId) : n.add(assignmentId); return n;
    });

    // Select/deselect all ready parcels in a group
    const toggleGroupParcels = (group: DriverGroup) => {
        const readyIds = group.assignments
            .filter(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned)
            .map(a => a.id);
        const allSelected = readyIds.every(id => selectedParcelIds.has(id));
        setSelectedParcelIds(prev => {
            const n = new Set(prev);
            readyIds.forEach(id => allSelected ? n.delete(id) : n.add(id));
            return n;
        });
    };

    // Pay a single assignment
    const handlePaySingle = async (assignmentId: string, label: string) => {
        setPayingIds(prev => new Set(prev).add(assignmentId));
        try {
            const res = await frontdeskService.payDriverAssignments([assignmentId]);
            if (res.success) {
                showToast(`${label} marked as paid`, "success");
                setAssignments(prev => prev.filter(a => a.id !== assignmentId));
            } else {
                showToast(res.message || "Failed", "error");
            }
        } catch { showToast("Failed to mark as paid", "error"); }
        finally { setPayingIds(prev => { const n = new Set(prev); n.delete(assignmentId); return n; }); }
    };

    // Pay all ready assignments for selected groups OR individually checked parcels
    const handlePaySelected = async () => {
        const groupIds = selectedGroups.flatMap(g =>
            g.assignments.filter(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned).map(a => a.id)
        );
        // Merge group-selected + individually checked, deduplicate
        const ids = [...new Set([...groupIds, ...Array.from(selectedParcelIds)])];
        if (!ids.length) return;
        ids.forEach(id => setPayingIds(prev => new Set(prev).add(id)));
        try {
            const res = await frontdeskService.payDriverAssignments(ids);
            if (res.success) {
                showToast(`${ids.length} parcel(s) marked as paid`, "success");
                setAssignments(prev => prev.filter(a => !ids.includes(a.id)));
                setSelectedKeys(new Set());
                setSelectedParcelIds(new Set());
                setShowConfirmModal(false);
            } else {
                showToast(res.message || "Failed", "error");
            }
        } catch { showToast("Failed to mark as paid", "error"); }
        finally { ids.forEach(id => setPayingIds(prev => { const n = new Set(prev); n.delete(id); return n; })); }
    };

    const selectedGroups  = groups.filter(g => selectedKeys.has(g.key));
    const selectedTotal   = selectedGroups.reduce((s, g) => s + g.totalAmount, 0);
    const selectedReady   = selectedGroups.reduce((s, g) => s + g.readyCount, 0);
    // All IDs that will be paid (group-selected ready + individually checked)
    const allSelectedIds  = new Set([
        ...selectedGroups.flatMap(g => g.assignments.filter(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned).map(a => a.id)),
        ...Array.from(selectedParcelIds),
    ]);
    const totalSelectedCount = allSelectedIds.size;
    const totalSelectedAmount = groups.flatMap(g => g.assignments).filter(a => allSelectedIds.has(a.id)).reduce((s, a) => s + (a.parcelInfo?.inboundCost || a.amount), 0);

    return (
        <div className={`w-full ${showConfirmModal ? "overflow-hidden" : ""}`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">

                    {/* Selected badge */}
                    {(selectedKeys.size > 0 || selectedParcelIds.size > 0) && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-base font-semibold">
                            {totalSelectedCount} Parcel{totalSelectedCount !== 1 ? "s" : ""} Selected
                        </Badge>
                    )}

                    {/* Summary card */}
                    {(selectedKeys.size > 0 || selectedParcelIds.size > 0) && (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Groups Selected</p>
                                            <p className="text-2xl font-bold text-[#ea690c]">{selectedKeys.size}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Parcels to Pay</p>
                                            <p className="text-2xl font-bold text-blue-600">{totalSelectedCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSelectedAmount)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={totalSelectedCount === 0}
                                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        Pay Selected ({totalSelectedCount})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main table */}
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <CardContent className="p-0">
                            {/* Table toolbar */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1]">
                                <p className="text-sm font-semibold text-neutral-800">Driver Tracker</p>
                                <Button onClick={() => fetchAssignments(pagination.page)} variant="outline" size="sm" disabled={loading} className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50">
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1" />Refresh</>}
                                </Button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-neutral-700 font-semibold text-lg">Loading drivers...</p>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-12">
                                    <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-neutral-800 font-semibold text-lg mb-2">No unpaid assignments</p>
                                    <p className="text-sm text-gray-500">All driver inbound cash has been settled.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedKeys.size === groups.length && groups.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Driver</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Vehicle</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Parcels</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Owed</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {groups.map((group, gi) => {
                                                const isSelected = selectedKeys.has(group.key);
                                                const isExpanded = expandedKeys.has(group.key);
                                                const readyAssignments    = group.assignments.filter(a => a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered);
                                                const pendingAssignments  = group.assignments.filter(a => !a.parcelInfo?.pickedUp && !a.parcelInfo?.delivered && !a.delivered && !a.parcelInfo?.returned);
                                                const returnedAssignments = group.assignments.filter(a => a.parcelInfo?.returned);

                                                return (
                                                    <>
                                                        {/* Group row */}
                                                        <tr
                                                            key={group.key}
                                                            className={`hover:bg-gray-50 transition-colors ${gi !== groups.length - 1 ? "border-b border-gray-200" : ""} ${isSelected ? "bg-orange-50" : ""}`}
                                                        >
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                {(() => {
                                                                    const allReady = group.assignments.length > 0 && group.assignments.every(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned);
                                                                    return (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedKeys.has(group.key)}
                                                                            onChange={() => allReady && toggleSelect(group.key)}
                                                                            disabled={!allReady}
                                                                            title={!allReady ? "All parcels must be picked up or delivered" : "Select group"}
                                                                            className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c] disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        />
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="px-4 py-4 border-r border-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => toggleExpand(group.key)} className="text-gray-500 hover:text-gray-700">
                                                                        {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                                                    </button>
                                                                    <UserIcon className="w-4 h-4 text-blue-500" />
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-neutral-800">{group.driverName}</div>
                                                                        <a href={`tel:${group.driverPhoneNumber}`} className="text-xs text-[#ea690c] hover:underline flex items-center gap-1 mt-0.5">
                                                                            <Phone className="w-3 h-3" />{formatPhoneNumber(group.driverPhoneNumber)}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                                                    <Truck className="w-3 h-3 mr-1" />{group.vehicleNumber}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <div className="text-sm font-semibold text-blue-600">{readyAssignments.length} / {group.assignments.length}</div>
                                                                <div className="text-xs text-gray-500">Ready / Total</div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                                <div className="text-sm font-bold text-[#ea690c]">{formatCurrency(group.totalAmount)}</div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {readyAssignments.length > 0 && <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">{readyAssignments.length} Ready</Badge>}
                                                                    {pendingAssignments.length > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{pendingAssignments.length} Pending</Badge>}
                                                                    {returnedAssignments.length > 0 && <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">{returnedAssignments.length} Returned</Badge>}
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded parcel rows */}
                                                        {isExpanded && (
                                                            <tr key={`${group.key}-exp`}>
                                                                <td colSpan={6} className="px-0 py-0">
                                                                    <div className="bg-gray-50 border-t border-gray-200">
                                                                        <table className="w-full">
                                                                            <thead className="bg-gray-100">
                                                                                <tr>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                                                                        {(() => {
                                                                                            const readyIds = group.assignments.filter(a => (a.parcelInfo?.pickedUp || a.parcelInfo?.delivered || a.delivered) && !a.parcelInfo?.returned).map(a => a.id);
                                                                                            const allReady = readyIds.length === group.assignments.length && group.assignments.length > 0;
                                                                                            const allChecked = readyIds.length > 0 && readyIds.every(id => selectedParcelIds.has(id));
                                                                                            return (
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    onChange={() => toggleGroupParcels(group)}
                                                                                                    checked={allChecked}
                                                                                                    disabled={!allReady}
                                                                                                    title={!allReady ? "All parcels must be picked up or delivered to select all" : "Select all"}
                                                                                                    className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c] disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                />
                                                                                            );
                                                                                        })()}
                                                                                    </th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Recipient</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Shelf</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Inbound</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                                                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                                                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Pay</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {group.assignments.map((a, ai) => {
                                                                                    const p = a.parcelInfo;
                                                                                    const isReady    = p?.pickedUp || p?.delivered || a.delivered;
                                                                                    const isReturned = p?.returned;
                                                                                    const isPaying   = payingIds.has(a.id);

                                                                                    return (
                                                                                        <tr key={a.id} className={`${ai !== group.assignments.length - 1 ? "border-b border-gray-200" : ""}`}>
                                                                                            <td className="px-4 py-3">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={isReady && !isReturned ? selectedParcelIds.has(a.id) : false}
                                                                                                    onChange={() => isReady && !isReturned && toggleParcel(a.id)}
                                                                                                    disabled={!isReady || isReturned}
                                                                                                    title={isReturned ? "Returned parcel" : !isReady ? "Not yet picked up or delivered" : ""}
                                                                                                    className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c] disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                />
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <div className="text-sm font-semibold text-neutral-800">{p?.receiverName || "N/A"}</div>
                                                                                                {p?.senderName && <div className="text-xs text-gray-500 truncate max-w-[150px]">From: {p.senderName}</div>}
                                                                                            </td>
                                                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                                                {p?.receiverPhoneNumber
                                                                                                    ? <a href={`tel:${p.receiverPhoneNumber}`} className="text-sm text-[#ea690c] hover:underline font-medium">{formatPhoneNumber(p.receiverPhoneNumber)}</a>
                                                                                                    : <span className="text-sm text-gray-400">N/A</span>
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-sm text-gray-600">{p?.shelfName || "—"}</td>
                                                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                                                <div className="text-sm font-bold text-[#ea690c]">{formatCurrency(p?.inboundCost || a.amount)}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                                                {a.createdAt ? formatDate(new Date(a.createdAt).toISOString()) : "—"}
                                                                                            </td>
                                                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                                                {isReturned
                                                                                                    ? <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Returned</Badge>
                                                                                                    : isReady
                                                                                                        ? <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">{p?.delivered || a.delivered ? "Delivered" : "Picked Up"}</Badge>
                                                                                                        : <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                                                {isReady && !isReturned && (
                                                                                                    <Button
                                                                                                        onClick={() => handlePaySingle(a.id, p?.receiverName || "Parcel")}
                                                                                                        disabled={isPaying || payingIds.size > 0}
                                                                                                        variant="outline"
                                                                                                        size="sm"
                                                                                                        className="border-green-300 text-green-700 hover:bg-green-50 text-xs px-2.5 py-1.5"
                                                                                                    >
                                                                                                        {isPaying ? <Loader className="w-3.5 h-3.5 animate-spin" /> : "Pay"}
                                                                                                    </Button>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
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
                                        <Button onClick={() => fetchAssignments(pagination.page - 1)} disabled={pagination.page === 0 || loading} variant="outline" size="sm" className="border border-[#d1d1d1]">Previous</Button>
                                        <Button onClick={() => fetchAssignments(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1 || loading} variant="outline" size="sm" className="border border-[#d1d1d1]">Next</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Confirm Payment Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="inline-flex items-center gap-2">
                                    <CheckCircleIcon className="w-6 h-6 text-[#ea690c]" />
                                    <h2 className="font-semibold text-[#ea690c] text-lg">Confirm Payment</h2>
                                </div>
                                <button onClick={() => setShowConfirmModal(false)} className="text-[#9a9a9a] hover:text-neutral-800">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">
                                        You are about to pay {totalSelectedCount} parcel(s) across {selectedKeys.size} driver group(s)
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <p className="text-sm text-blue-800">Parcels: <span className="font-bold">{totalSelectedCount}</span></p>
                                        <p className="text-sm text-blue-800">Total Amount: <span className="font-bold">{formatCurrency(totalSelectedAmount)}</span></p>
                                    </div>
                                </div>

                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Driver</th>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Vehicle</th>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Ready</th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedGroups.map(g => (
                                                <tr key={g.key} className="border-b border-gray-100">
                                                    <td className="px-3 py-2 font-semibold">{g.driverName}</td>
                                                    <td className="px-3 py-2 text-gray-600">{g.vehicleNumber}</td>
                                                    <td className="px-3 py-2">{g.readyCount} parcels</td>
                                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(g.totalAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1 border border-[#d1d1d1]">Cancel</Button>
                                    <Button
                                        onClick={handlePaySelected}
                                        disabled={payingIds.size > 0}
                                        className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {payingIds.size > 0
                                            ? <><Loader className="w-4 h-4 animate-spin mr-2" />Processing...</>
                                            : "Confirm Payment"
                                        }
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
