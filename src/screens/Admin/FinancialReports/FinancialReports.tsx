import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { calculateFinancialSummary, getStationPerformance, mockStations } from "../../../data/mockData";
import { formatCurrency } from "../../../utils/dataHelpers";

export const FinancialReports = (): JSX.Element => {
    const [dateRange, setDateRange] = useState({
        from: "",
        to: "",
    });
    const [reportType, setReportType] = useState<"daily" | "station" | "driver">("station");
    const [systemSummary, setSystemSummary] = useState(calculateFinancialSummary());
    const [stationPerformance, setStationPerformance] = useState(getStationPerformance());
    const [chartType, setChartType] = useState<"bar" | "pie">("bar");
    const [expandedMetrics, setExpandedMetrics] = useState<string | null>(null);

    useEffect(() => {
        const summary = calculateFinancialSummary(undefined, dateRange.from && dateRange.to ? {
            from: dateRange.from,
            to: dateRange.to,
        } : undefined);
        setSystemSummary(summary);
        setStationPerformance(getStationPerformance());
    }, [dateRange]);

    const handleExport = (format: "csv" | "pdf") => {
        if (format === "csv") {
            const headers = ["Station", "Delivery Earnings", "Item Collections", "Driver Payments", "Net Revenue", "Success Rate"];
            const rows = stationPerformance.map((station) => [
                station.stationName,
                formatCurrency(station.deliveryEarnings),
                formatCurrency(systemSummary.totalItemCollections / stationPerformance.length),
                formatCurrency(station.driverPaymentsOwed),
                formatCurrency(station.deliveryEarnings - station.driverPaymentsOwed),
                `${station.successRate}%`,
            ]);

            const csv = [
                headers.join(","),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `financial-report-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        } else if (format === "pdf") {
            alert("PDF export coming soon!");
        }
    };

    const calculateMetrics = () => {
        const totalParcels = stationPerformance.reduce((sum, s) => sum + (s.totalParcels || 0), 0);
        const avgSuccessRate = stationPerformance.length > 0
            ? Math.round(stationPerformance.reduce((sum, s) => sum + s.successRate, 0) / stationPerformance.length)
            : 0;
        const profitMargin = systemSummary.totalDeliveryEarnings > 0
            ? Math.round((systemSummary.netRevenue / systemSummary.totalDeliveryEarnings) * 100)
            : 0;

        return { totalParcels, avgSuccessRate, profitMargin };
    };

    const metrics = calculateMetrics();

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Financial Reports</h1>
                            <p className="text-sm text-[#5d5d5d] mt-2">System-wide revenue and payment analysis</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleExport("csv")}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                            >
                                <Download size={18} />
                                Export CSV
                            </Button>
                            <Button
                                onClick={() => handleExport("pdf")}
                                variant="outline"
                                className="border border-[#d1d1d1] flex items-center gap-2"
                            >
                                <Download size={18} />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Date Range & Filter Controls */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        From Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        To Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Report Type
                                    </Label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value as any)}
                                        className="w-full border border-[#d1d1d1] rounded px-3 py-2 text-sm"
                                    >
                                        <option value="station">By Station</option>
                                        <option value="driver">By Driver</option>
                                        <option value="daily">By Day</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Chart Type
                                    </Label>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value as any)}
                                        className="w-full border border-[#d1d1d1] rounded px-3 py-2 text-sm"
                                    >
                                        <option value="bar">Bar Chart</option>
                                        <option value="pie">Pie Chart</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={() => setDateRange({ from: "", to: "" })}
                                        variant="outline"
                                        className="w-full border border-[#d1d1d1]"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Key Metrics Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Delivery Earnings</p>
                                        <h3 className="text-2xl font-bold text-green-700">
                                            {formatCurrency(systemSummary.totalDeliveryEarnings)}
                                        </h3>
                                        <p className="text-xs text-green-600">↑ 12% from last month</p>
                                    </div>
                                    <div className="p-3 bg-green-200 rounded-lg">
                                        <DollarSign className="w-8 h-8 text-green-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Item Collections</p>
                                        <h3 className="text-2xl font-bold text-blue-700">
                                            {formatCurrency(systemSummary.totalItemCollections)}
                                        </h3>
                                        <p className="text-xs text-blue-600">From {metrics.totalParcels} parcels</p>
                                    </div>
                                    <div className="p-3 bg-blue-200 rounded-lg">
                                        <TrendingUp className="w-8 h-8 text-blue-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-gradient-to-br from-orange-50 to-orange-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Driver Payments Owed</p>
                                        <h3 className="text-2xl font-bold text-orange-700">
                                            {formatCurrency(systemSummary.totalDriverPayments)}
                                        </h3>
                                        <p className="text-xs text-orange-600">Pending disbursement</p>
                                    </div>
                                    <div className="p-3 bg-orange-200 rounded-lg">
                                        <TrendingDown className="w-8 h-8 text-orange-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Net Revenue</p>
                                        <h3 className="text-2xl font-bold text-purple-700">
                                            {formatCurrency(systemSummary.netRevenue)}
                                        </h3>
                                        <p className="text-xs text-purple-600">{metrics.profitMargin}% profit margin</p>
                                    </div>
                                    <div className="p-3 bg-purple-200 rounded-lg">
                                        <BarChart3 className="w-8 h-8 text-purple-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setExpandedMetrics(expandedMetrics === "success" ? null : "success")}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#5d5d5d]">Avg Success Rate</p>
                                        <h3 className="text-3xl font-bold text-[#ea690c]">{metrics.avgSuccessRate}%</h3>
                                        <p className="text-xs text-[#5d5d5d] mt-2">Across all stations</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 h-16 rounded-full border-4 border-[#ea690c] flex items-center justify-center">
                                            <span className="text-sm font-bold text-[#ea690c]">{metrics.avgSuccessRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setExpandedMetrics(expandedMetrics === "parcels" ? null : "parcels")}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#5d5d5d]">Total Parcels</p>
                                        <h3 className="text-3xl font-bold text-blue-600">{metrics.totalParcels}</h3>
                                        <p className="text-xs text-[#5d5d5d] mt-2">Registered in system</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-600">📦</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setExpandedMetrics(expandedMetrics === "margin" ? null : "margin")}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#5d5d5d]">Profit Margin</p>
                                        <h3 className="text-3xl font-bold text-green-600">{metrics.profitMargin}%</h3>
                                        <p className="text-xs text-[#5d5d5d] mt-2">Revenue after payments</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                            <span className="text-lg font-bold text-green-600">💹</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart Visualization Section */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-neutral-800">Revenue by Station</h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant={chartType === "bar" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartType("bar")}
                                        className="flex items-center gap-1"
                                    >
                                        <BarChart3 size={16} />
                                        Bar
                                    </Button>
                                    <Button
                                        variant={chartType === "pie" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartType("pie")}
                                        className="flex items-center gap-1"
                                    >
                                        <PieChartIcon size={16} />
                                        Pie
                                    </Button>
                                </div>
                            </div>

                            {/* Chart Placeholder - Replace with actual charting library */}
                            {chartType === "bar" ? (
                                <div className="bg-gray-50 rounded-lg p-8">
                                    <div className="flex items-end justify-around gap-4 h-64">
                                        {stationPerformance.map((station, index) => {
                                            const maxEarnings = Math.max(...stationPerformance.map(s => s.deliveryEarnings));
                                            const height = (station.deliveryEarnings / maxEarnings) * 100;
                                            return (
                                                <div key={station.stationId} className="flex flex-col items-center gap-2 flex-1">
                                                    <div
                                                        className="w-full bg-gradient-to-t from-[#ea690c] to-orange-400 rounded-t transition-all hover:from-[#ea690c]/80"
                                                        style={{ height: `${height}%`, minHeight: '20px' }}
                                                        title={`${station.stationName}: ${formatCurrency(station.deliveryEarnings)}`}
                                                    />
                                                    <span className="text-xs text-neutral-700 text-center truncate w-full">
                                                        {station.stationName.split(' ')[0]}
                                                    </span>
                                                    <span className="text-xs font-semibold text-neutral-800">
                                                        {formatCurrency(station.deliveryEarnings)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80">
                                    <div className="relative w-64 h-64">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            {/* Pie chart segments */}
                                            {stationPerformance.map((station, index) => {
                                                const total = stationPerformance.reduce((sum, s) => sum + s.deliveryEarnings, 0);
                                                const percentage = (station.deliveryEarnings / total) * 100;
                                                const colors = ['#ea690c', '#ff9a3d', '#ffb366', '#ffc299', '#ffd9b3'];
                                                return (
                                                    <circle
                                                        key={station.stationId}
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill={colors[index % colors.length]}
                                                        opacity="0.8"
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-[#ea690c]">{stationPerformance.length}</p>
                                                <p className="text-xs text-[#5d5d5d]">Stations</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-8 space-y-3">
                                        {stationPerformance.map((station, index) => {
                                            const colors = ['#ea690c', '#ff9a3d', '#ffb366', '#ffc299', '#ffd9b3'];
                                            const total = stationPerformance.reduce((sum, s) => sum + s.deliveryEarnings, 0);
                                            const percentage = Math.round((station.deliveryEarnings / total) * 100);
                                            return (
                                                <div key={station.stationId} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: colors[index % colors.length] }}
                                                    />
                                                    <span className="text-neutral-700">{station.stationName}</span>
                                                    <span className="font-semibold text-neutral-800 ml-auto">{percentage}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Detailed Station Breakdown Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Station Financial Breakdown</h2>
                            <div className="overflow-x-auto -mx-6 sm:mx-0">
                                <div className="inline-block min-w-full align-middle">
                                    <div className="overflow-hidden">
                                        <table className="min-w-full divide-y divide-[#d1d1d1]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Station
                                                    </th>
                                                    <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Delivery Earnings
                                                    </th>
                                                    <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Driver Payments
                                                    </th>
                                                    <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Net Revenue
                                                    </th>
                                                    <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Success Rate
                                                    </th>
                                                    <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Margin
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                {stationPerformance.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center">
                                                            <p className="text-sm text-neutral-500">No financial data available</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stationPerformance.map((station, index) => {
                                                        const netRevenue = station.deliveryEarnings - station.driverPaymentsOwed;
                                                        const margin = station.deliveryEarnings > 0
                                                            ? Math.round((netRevenue / station.deliveryEarnings) * 100)
                                                            : 0;
                                                        return (
                                                            <tr
                                                                key={station.stationId}
                                                                className={`transition-colors hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                            >
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <span className="text-xs sm:text-sm font-semibold text-neutral-800">
                                                                        {station.stationName}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm font-semibold text-green-600">
                                                                    {formatCurrency(station.deliveryEarnings)}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm font-semibold text-orange-600">
                                                                    {formatCurrency(station.driverPaymentsOwed)}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm font-bold text-[#ea690c]">
                                                                    {formatCurrency(netRevenue)}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap">
                                                                    <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                        {station.successRate}%
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap">
                                                                    <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded ${margin >= 30 ? 'bg-green-50 text-green-700' :
                                                                        margin >= 15 ? 'bg-yellow-50 text-yellow-700' :
                                                                            'bg-red-50 text-red-700'
                                                                        }`}>
                                                                        {margin}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Footer */}
                    <Card className="border border-[#d1d1d1] bg-gradient-to-r from-neutral-50 to-gray-100">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-[#5d5d5d] uppercase tracking-wide">Reporting Period</p>
                                    <p className="text-sm font-semibold text-neutral-800 mt-1">
                                        {dateRange.from && dateRange.to
                                            ? `${dateRange.from} to ${dateRange.to}`
                                            : "All Time"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#5d5d5d] uppercase tracking-wide">Active Stations</p>
                                    <p className="text-sm font-semibold text-neutral-800 mt-1">{stationPerformance.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#5d5d5d] uppercase tracking-wide">Last Updated</p>
                                    <p className="text-sm font-semibold text-neutral-800 mt-1">
                                        {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#5d5d5d] uppercase tracking-wide">Total Transactions</p>
                                    <p className="text-sm font-semibold text-neutral-800 mt-1">
                                        {stationPerformance.reduce((sum, s) => sum + (s.totalParcels || 0), 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
