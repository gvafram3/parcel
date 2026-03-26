import { useState, useEffect, useCallback, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
    DollarSign, TrendingUp, CreditCard, AlertCircle, Package,
    Loader, Building2, CalendarIcon, BarChart3,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { useLocation } from "../../../contexts/LocationContext";
import { useToast } from "../../../components/ui/toast";
import adminService from "../../../services/adminService";
import { formatCurrency } from "../../../utils/dataHelpers";

const COLORS = ["#ea690c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

interface DayStats {
    date: string;
    gross: number;
    collected: number;
    failed: number;
    deliveries: number;
    cash: number;
    momo: number;
    pod: number;
    nonPod: number;
}

interface RiderStat {
    riderId: string;
    riderName: string;
    delivered: number;
    failed: number;
    gross: number;
    reconciled: number;
    outstanding: number;
}

export const AdminFinancialDashboard = (): JSX.Element => {
    const { stations, loading: stationsLoading, refreshLocations } = useLocation();

    useEffect(() => { if (stations.length === 0) refreshLocations(); }, []);
    const { showToast } = useToast();

    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [rawAssignments, setRawAssignments] = useState<any[]>([]);
    const [activeChart, setActiveChart] = useState<"revenue" | "payment" | "parcel" | "trend">("revenue");

    useEffect(() => {
        if (!selectedOfficeId && stations.length > 0) setSelectedOfficeId(stations[0].id);
    }, [stations, selectedOfficeId]);

    const fetchData = useCallback(async (officeId: string) => {
        if (!officeId) return;
        setLoading(true);
        const all: any[] = [];
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // fetch each day in range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStart = new Date(d);
                dayStart.setHours(0, 0, 0, 0);
                const res = await adminService.getOfficeReconciliationsByDate(officeId, dayStart.getTime());
                if (res.success && res.data) {
                    const data = res.data as any;
                    const content = Array.isArray(data) ? data : data.content || [];
                    content.forEach((a: any) => all.push({ ...a, _fetchDate: dayStart.toISOString().split("T")[0] }));
                }
            }
            setRawAssignments(all);
        } catch {
            showToast("Failed to load financial data", "error");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, showToast]);

    useEffect(() => {
        if (selectedOfficeId) fetchData(selectedOfficeId);
    }, [selectedOfficeId, fetchData]);

    // ── Derived stats ──────────────────────────────────────────────────────────
    const { summary, dayStats, riderStats, paymentBreakdown, parcelTypeBreakdown } = useMemo(() => {
        let grossRevenue = 0, totalCollected = 0, totalFailed = 0,
            totalDeliveries = 0, totalReturns = 0,
            cashTotal = 0, momoTotal = 0,
            podTotal = 0, nonPodTotal = 0;

        const dayMap: Record<string, DayStats> = {};
        const riderMap: Record<string, RiderStat> = {};

        rawAssignments.forEach((a: any) => {
            const dateKey = a._fetchDate || new Date(a.completedAt || a.assignedAt || Date.now()).toISOString().split("T")[0];
            if (!dayMap[dateKey]) dayMap[dateKey] = { date: dateKey, gross: 0, collected: 0, failed: 0, deliveries: 0, cash: 0, momo: 0, pod: 0, nonPod: 0 };

            const riderId = a.riderInfo?.riderId || a.riderId || "unknown";
            const riderName = a.riderInfo?.riderName || a.riderName || "Unknown";
            if (!riderMap[riderId]) riderMap[riderId] = { riderId, riderName, delivered: 0, failed: 0, gross: 0, reconciled: 0, outstanding: 0 };

            const parcels: any[] = a.parcels || [];
            parcels.forEach((p: any) => {
                const amount = Number(p.parcelAmount ?? p.amount ?? 0);
                const delivered = p.delivered === true && p.returned !== true;
                const returned = p.returned === true;
                const method = (p.paymentMethod || "").toLowerCase();
                const isPod = !!p.pod;

                if (delivered) {
                    grossRevenue += amount;
                    totalDeliveries++;
                    dayMap[dateKey].gross += amount;
                    dayMap[dateKey].deliveries++;
                    riderMap[riderId].delivered++;
                    riderMap[riderId].gross += amount;

                    if (method === "cash") { cashTotal += amount; dayMap[dateKey].cash += amount; }
                    else if (method === "momo") { momoTotal += amount; dayMap[dateKey].momo += amount; }

                    if (isPod) { podTotal += amount; dayMap[dateKey].pod += amount; }
                    else { nonPodTotal += amount; dayMap[dateKey].nonPod += amount; }
                }
                if (returned) {
                    totalFailed++;
                    totalReturns += amount;
                    dayMap[dateKey].failed++;
                    riderMap[riderId].failed++;
                }
            });

            // reconciliation
            const amtPayed = Number(a.amountPayed ?? 0);
            if (a.payed && amtPayed > 0) {
                totalCollected += amtPayed;
                dayMap[dateKey].collected += amtPayed;
                riderMap[riderId].reconciled += amtPayed;
            }
        });

        // outstanding per rider
        Object.values(riderMap).forEach(r => { r.outstanding = Math.max(0, r.gross - r.reconciled); });

        const outstanding = grossRevenue - totalCollected;
        const successRate = (totalDeliveries + totalFailed) > 0
            ? Math.round((totalDeliveries / (totalDeliveries + totalFailed)) * 100) : 0;

        const dayStats: DayStats[] = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))
            .map(d => ({ ...d, date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));

        const riderStats: RiderStat[] = Object.values(riderMap).sort((a, b) => b.gross - a.gross);

        const paymentBreakdown = [
            { name: "Cash", value: cashTotal },
            { name: "Mobile Money", value: momoTotal },
            { name: "Other", value: Math.max(0, grossRevenue - cashTotal - momoTotal) },
        ].filter(x => x.value > 0);

        const parcelTypeBreakdown = [
            { name: "POD", value: podTotal },
            { name: "Non-POD", value: nonPodTotal },
        ].filter(x => x.value > 0);

        return {
            summary: { grossRevenue, totalCollected, outstanding, totalDeliveries, totalFailed, successRate, totalReturns },
            dayStats, riderStats, paymentBreakdown, parcelTypeBreakdown,
        };
    }, [rawAssignments]);

    const selectedOfficeName = stations.find(s => s.id === selectedOfficeId)?.name || "All Stations";

    const summaryCards = [
        { label: "Gross Revenue", value: formatCurrency(summary.grossRevenue), icon: DollarSign, color: "text-[#ea690c]", bg: "bg-orange-50" },
        { label: "Collected", value: formatCurrency(summary.totalCollected), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Outstanding", value: formatCurrency(summary.outstanding), icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
        { label: "Deliveries", value: summary.totalDeliveries, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Failed", value: summary.totalFailed, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Success Rate", value: `${summary.successRate}%`, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    const chartTabs = [
        { key: "revenue", label: "Revenue Trend" },
        { key: "payment", label: "Payment Methods" },
        { key: "parcel", label: "POD vs Non-POD" },
        { key: "trend", label: "Deliveries vs Failed" },
    ] as const;

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Financial Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedOfficeName} — revenue, collections & rider payouts</p>
                </div>

                {/* Filters */}
                <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Office</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select value={selectedOfficeId} onChange={e => setSelectedOfficeId(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                                        {stationsLoading ? (
                                            <option value="">Loading offices...</option>
                                        ) : stations.length === 0 ? (
                                            <option value="">No offices found</option>
                                        ) : (
                                            stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">From</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">To</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} max={new Date().toISOString().split("T")[0]}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]" />
                                </div>
                            </div>
                            <button onClick={() => fetchData(selectedOfficeId)} disabled={loading || !selectedOfficeId}
                                className="px-4 py-2 bg-[#ea690c] text-white text-sm font-semibold rounded-lg hover:bg-[#d45e0a] disabled:opacity-50 transition-colors flex items-center gap-2">
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                                {loading ? "Loading..." : "Apply"}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {summaryCards.map(card => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="border border-gray-200 bg-white shadow-sm">
                                <CardContent className="p-4">
                                    <div className={`w-8 h-8 ${card.bg} rounded-full flex items-center justify-center mb-2`}>
                                        <Icon className={`w-4 h-4 ${card.color}`} />
                                    </div>
                                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts */}
                <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                        {/* Chart tabs */}
                        <div className="flex gap-2 flex-wrap mb-6">
                            {chartTabs.map(tab => (
                                <button key={tab.key} onClick={() => setActiveChart(tab.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeChart === tab.key ? "bg-[#ea690c] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader className="w-8 h-8 text-[#ea690c] animate-spin" />
                            </div>
                        ) : dayStats.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data for selected range</div>
                        ) : (
                            <>
                                {activeChart === "revenue" && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dayStats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₵${v}`} />
                                            <Tooltip formatter={(v: any) => formatCurrency(v)} />
                                            <Legend />
                                            <Bar dataKey="gross" name="Gross Revenue" fill="#ea690c" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}

                                {activeChart === "trend" && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={dayStats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="deliveries" name="Delivered" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}

                                {activeChart === "payment" && (
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        {paymentBreakdown.length === 0 ? (
                                            <p className="text-sm text-gray-400 mx-auto">No payment data</p>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                            {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="space-y-3 min-w-[160px]">
                                                    {paymentBreakdown.map((item, i) => (
                                                        <div key={item.name} className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                                <span className="text-sm text-gray-600">{item.name}</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-neutral-800">{formatCurrency(item.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeChart === "parcel" && (
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        {parcelTypeBreakdown.length === 0 ? (
                                            <p className="text-sm text-gray-400 mx-auto">No data</p>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={parcelTypeBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                            {parcelTypeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="space-y-3 min-w-[160px]">
                                                    {parcelTypeBreakdown.map((item, i) => (
                                                        <div key={item.name} className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                                <span className="text-sm text-gray-600">{item.name}</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-neutral-800">{formatCurrency(item.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Rider Payout Table */}
                <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <h2 className="text-base font-bold text-neutral-800 mb-4">Rider Payout Liability</h2>
                        {riderStats.length === 0 ? (
                            <p className="text-sm text-gray-400 py-8 text-center">No rider data for selected range</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {["Rider", "Delivered", "Failed", "Gross Earned", "Reconciled", "Outstanding", "Status"].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {riderStats.map(r => (
                                            <tr key={r.riderId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-800">{r.riderName}</td>
                                                <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{r.delivered}</td>
                                                <td className="px-4 py-3 text-sm text-red-500 font-semibold">{r.failed}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-[#ea690c]">{formatCurrency(r.gross)}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 font-semibold">{formatCurrency(r.reconciled)}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-red-500">{formatCurrency(r.outstanding)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={r.outstanding === 0 ? "bg-green-100 text-green-800 border-0" : r.reconciled > 0 ? "bg-yellow-100 text-yellow-800 border-0" : "bg-red-100 text-red-800 border-0"}>
                                                        {r.outstanding === 0 ? "Settled" : r.reconciled > 0 ? "Partial" : "Pending"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                                            <td className="px-4 py-2.5 text-sm font-bold text-neutral-800">Total</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-blue-600">{riderStats.reduce((s, r) => s + r.delivered, 0)}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-red-500">{riderStats.reduce((s, r) => s + r.failed, 0)}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-[#ea690c]">{formatCurrency(riderStats.reduce((s, r) => s + r.gross, 0))}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-green-600">{formatCurrency(riderStats.reduce((s, r) => s + r.reconciled, 0))}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-red-500">{formatCurrency(riderStats.reduce((s, r) => s + r.outstanding, 0))}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Daily breakdown table */}
                <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <h2 className="text-base font-bold text-neutral-800 mb-4">Daily Breakdown</h2>
                        {dayStats.length === 0 ? (
                            <p className="text-sm text-gray-400 py-8 text-center">No data for selected range</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {["Date", "Deliveries", "Failed", "Gross", "Collected", "Cash", "Mobile Money"].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dayStats.map(d => (
                                            <tr key={d.date} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-800">{d.date}</td>
                                                <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{d.deliveries}</td>
                                                <td className="px-4 py-3 text-sm text-red-500 font-semibold">{d.failed}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-[#ea690c]">{formatCurrency(d.gross)}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 font-semibold">{formatCurrency(d.collected)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(d.cash)}</td>
                                                <td className="px-4 py-3 text-sm text-purple-600">{formatCurrency(d.momo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
