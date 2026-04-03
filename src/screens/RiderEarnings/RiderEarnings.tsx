import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader, DollarSignIcon, TrendingUpIcon, CalendarIcon, ChevronDown, ChevronUp, ClockIcon } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { formatCurrency } from "../../utils/dataHelpers";
import riderService, { RiderAssignmentResponse } from "../../services/riderService";
import { useToast } from "../../components/ui/toast";

const RIDER_SHARE = 0.6;

export const RiderEarnings = (): JSX.Element => {
    const { showToast } = useToast();
    const [assignments, setAssignments] = useState<RiderAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await riderService.getAssignments(0, 100);
            if (response.success && response.data) {
                const data = response.data as any;
                let list: RiderAssignmentResponse[] = [];
                if (data.content && Array.isArray(data.content)) list = data.content;
                else if (Array.isArray(data)) list = data;
                else if (Array.isArray(response.data)) list = response.data;
                setAssignments(list);
            } else {
                showToast(response.message || "Failed to load earnings", "error");
            }
        } catch {
            showToast("Failed to load earnings. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

    // Rider earns 60% of deliveryCost only — no share of inboundCost (that belongs to the driver)
    const getRiderEarning = (a: RiderAssignmentResponse) => {
        const p = a.parcel;
        return (p.deliveryCost || 0) * RIDER_SHARE;
    };

    const getAmount = (a: RiderAssignmentResponse) => {
        const p = a.parcel;
        return (p.deliveryCost || 0) + (p.pickUpCost || 0) + (p.inboundCost || 0) + (p.storageCost || 0);
    };

    const getDate = (a: RiderAssignmentResponse) =>
        a.completedAt ? new Date(a.completedAt) : a.assignedAt ? new Date(a.assignedAt) : null;

    const deliveredAssignments = useMemo(() =>
        assignments.filter(a => a.parcel?.delivered), [assignments]);

    const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
    const todayEnd = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; }, []);

    const todayAssignments = useMemo(() =>
        deliveredAssignments.filter(a => {
            const d = getDate(a);
            return d && d >= todayStart && d <= todayEnd;
        }), [deliveredAssignments, todayStart, todayEnd]);

    const todayTotal = useMemo(() =>
        todayAssignments.reduce((s, a) => s + getRiderEarning(a), 0), [todayAssignments]);

    const overallTotal = useMemo(() =>
        deliveredAssignments.reduce((s, a) => s + getRiderEarning(a), 0), [deliveredAssignments]);

    const filteredAssignments = useMemo(() => {
        if (!startDate && !endDate) return deliveredAssignments;
        return deliveredAssignments.filter(a => {
            const d = getDate(a);
            if (!d) return false;
            if (startDate && d < new Date(startDate)) return false;
            const end = endDate ? new Date(endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
            return true;
        });
    }, [deliveredAssignments, startDate, endDate]);

    const groupedByDate = useMemo(() => {
        const groups: Record<string, RiderAssignmentResponse[]> = {};
        filteredAssignments.forEach(a => {
            const d = getDate(a);
            const key = d ? d.toDateString() : "Unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(a);
        });
        const sortedDates = Object.keys(groups).sort((a, b) => {
            if (a === "Unknown") return 1;
            if (b === "Unknown") return -1;
            return new Date(b).getTime() - new Date(a).getTime();
        });
        return { groups, sortedDates };
    }, [filteredAssignments]);

    const toggleCollapse = (key: string) => {
        setCollapsedDates(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };

    const formatDateHeader = (key: string) => {
        if (key === "Unknown") return "Unknown Date";
        const d = new Date(key);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
        return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-10">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">My Earnings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">You earn 60% of the delivery cost per parcel</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Today's Earnings</p>
                                    <p className="text-xl font-bold text-[#ea690c]">{formatCurrency(todayTotal)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{todayAssignments.length} deliveries</p>
                                </div>
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                                    <DollarSignIcon className="w-5 h-5 text-[#ea690c]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                                    <p className="text-xl font-bold text-green-600">{formatCurrency(overallTotal)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{deliveredAssignments.length} deliveries</p>
                                </div>
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                    <TrendingUpIcon className="w-5 h-5 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Date Filter */}
                <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">From</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="pl-9 text-sm border-gray-200"
                                        max={endDate || new Date().toISOString().split("T")[0]} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">To</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                        className="pl-9 text-sm border-gray-200"
                                        min={startDate} max={new Date().toISOString().split("T")[0]} />
                                </div>
                            </div>
                            {(startDate || endDate) && (
                                <div className="flex items-end">
                                    <button onClick={() => { setStartDate(""); setEndDate(""); }}
                                        className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Earnings History */}
                {loading ? (
                    <Card className="rounded-xl border-0 bg-white shadow-sm">
                        <CardContent className="p-12 text-center">
                            <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-gray-500">Loading earnings...</p>
                        </CardContent>
                    </Card>
                ) : filteredAssignments.length === 0 ? (
                    <Card className="rounded-xl border-0 bg-white shadow-sm">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSignIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">No earnings found</p>
                            <p className="text-xs text-gray-400 mt-1">Completed deliveries will appear here</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Deliveries</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Total Amount</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Your Earnings (60% of delivery)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {groupedByDate.sortedDates.map(dateKey => {
                                        const items = groupedByDate.groups[dateKey];
                                        const dayTotal = items.reduce((s, a) => s + getAmount(a), 0);
                                        return (
                                            <tr key={dateKey} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-neutral-800">{formatDateHeader(dateKey)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge className="bg-orange-100 text-[#ea690c] border-0 text-xs font-semibold">{items.length}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(dayTotal)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-sm text-[#ea690c]">{formatCurrency(items.reduce((s, a) => s + getRiderEarning(a), 0))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                                        <td className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                                        <td className="px-4 py-2.5 text-center text-sm font-semibold text-gray-700">{filteredAssignments.length}</td>
                                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-700">{formatCurrency(filteredAssignments.reduce((s, a) => s + getAmount(a), 0))}</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-green-600">{formatCurrency(filteredAssignments.reduce((s, a) => s + getRiderEarning(a), 0))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
