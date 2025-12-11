import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { calculateFinancialSummary, getStationPerformance, mockStations } from "../../../data/mockData";
import { formatCurrency } from "../../../utils/dataHelpers";
import { getStationName } from "../../../utils/dataHelpers";

export const FinancialReports = (): JSX.Element => {
    const [dateRange, setDateRange] = useState({
        from: "",
        to: "",
    });
    const [reportType, setReportType] = useState<"daily" | "station">("station");
    const [systemSummary, setSystemSummary] = useState(calculateFinancialSummary());
    const [stationPerformance, setStationPerformance] = useState(getStationPerformance());

    useEffect(() => {
        // Recalculate when date range changes
        const summary = calculateFinancialSummary(undefined, dateRange.from && dateRange.to ? {
            from: dateRange.from,
            to: dateRange.to,
        } : undefined);
        setSystemSummary(summary);
        setStationPerformance(getStationPerformance());
    }, [dateRange]);

    const handleExport = () => {
        const headers = ["Station", "Delivery Earnings", "Item Collections", "Driver Payments", "Net Revenue"];
        const rows = stationPerformance.map((station) => [
            station.stationName,
            formatCurrency(station.deliveryEarnings),
            formatCurrency(systemSummary.totalItemCollections / stationPerformance.length), // Approximate
            formatCurrency(station.driverPaymentsOwed),
            formatCurrency(station.deliveryEarnings - station.driverPaymentsOwed),
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
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1"></div>
                        <Button
                            onClick={handleExport}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Calendar size={18} />
                            Export Report
                        </Button>
                    </div>

                    {/* Date Range Filter */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Delivery Earnings</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(systemSummary.totalDeliveryEarnings)}
                                        </h3>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Item Collections</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(systemSummary.totalItemCollections)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Driver Payments Owed</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(systemSummary.totalDriverPayments)}
                                        </h3>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Net Revenue</p>
                                        <h3 className="text-2xl font-bold text-[#ea690c]">
                                            {formatCurrency(systemSummary.netRevenue)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-[#ea690c] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Station Financial Breakdown */}
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
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                {stationPerformance.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center">
                                                            <p className="text-sm text-neutral-500">No financial data available</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stationPerformance.map((station, index) => {
                                                        const netRevenue = station.deliveryEarnings - station.driverPaymentsOwed;
                                                        return (
                                                            <tr
                                                                key={station.stationId}
                                                                className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                            >
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <span className="text-xs sm:text-sm font-medium text-neutral-800">
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
                                                                    <span className="text-xs sm:text-sm font-semibold text-green-600">
                                                                        {station.successRate}%
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
                </main>
            </div>
        </div>
    );
};
