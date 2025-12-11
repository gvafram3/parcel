import { useState, useEffect } from "react";
import { DollarSignIcon, TrendingUpIcon, CreditCardIcon, UserCheckIcon, CalendarIcon, DownloadIcon } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { calculateFinancialSummary, getDriverFinancials } from "../../data/mockData";
import { FinancialSummary, DriverFinancial } from "../../types";
import { formatCurrency } from "../../utils/dataHelpers";

export const FinancialDashboard = (): JSX.Element => {
    const { currentStation, userRole } = useStation();
    const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
    const [driverBreakdown, setDriverBreakdown] = useState<DriverFinancial[]>([]);
    const [dateRange, setDateRange] = useState<{ from: string; to: string } | undefined>(undefined);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        if (currentStation || userRole === "admin") {
            const summary = calculateFinancialSummary(
                userRole === "admin" ? undefined : currentStation?.id,
                dateRange
            );
            setFinancialData(summary);

            const drivers = getDriverFinancials(
                userRole === "admin" ? undefined : currentStation?.id
            );
            setDriverBreakdown(drivers);
        }
    }, [currentStation, userRole, dateRange]);

    const handleApplyDateFilter = () => {
        if (fromDate && toDate) {
            setDateRange({ from: fromDate, to: toDate });
            setShowDateFilter(false);
        }
    };

    const handleClearDateFilter = () => {
        setDateRange(undefined);
        setFromDate("");
        setToDate("");
        setShowDateFilter(false);
    };

    const handleExport = () => {
        if (!financialData || driverBreakdown.length === 0) return;

        const headers = [
            "Driver Name",
            "Deliveries Completed",
            "Total Earned",
            "Amount Paid",
            "Outstanding Balance",
            "Payment Status",
        ];
        const rows = driverBreakdown.map((driver) => [
            driver.driverName,
            driver.deliveriesCompleted.toString(),
            driver.totalEarned.toFixed(2),
            driver.amountPaid.toFixed(2),
            driver.outstandingBalance.toFixed(2),
            driver.paymentStatus,
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

    if (!financialData) {
        return (
            <div className="w-full">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="text-center py-12">
                        <p className="text-neutral-700">Loading financial data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Financial Dashboard</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                {userRole === "admin" ? "System-wide financial overview" : `${currentStation?.name} - Financial Overview`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                variant="outline"
                                className="border border-[#d1d1d1] flex items-center gap-2"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                {dateRange ? "Filtered" : "Filter by Date"}
                            </Button>
                            <Button
                                onClick={handleExport}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    {showDateFilter && (
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1">
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2">From Date</Label>
                                        <Input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2">To Date</Label>
                                        <Input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleApplyDateFilter}
                                            disabled={!fromDate || !toDate}
                                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                        >
                                            Apply
                                        </Button>
                                        <Button
                                            onClick={handleClearDateFilter}
                                            variant="outline"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                {dateRange && (
                                    <div className="mt-3 pt-3 border-t border-[#d1d1d1]">
                                        <p className="text-sm text-[#5d5d5d]">
                                            Showing data from{" "}
                                            <strong>{new Date(dateRange.from).toLocaleDateString()}</strong> to{" "}
                                            <strong>{new Date(dateRange.to).toLocaleDateString()}</strong>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Delivery Earnings</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(financialData.totalDeliveryEarnings)}
                                        </h3>
                                        <p className="text-xs text-[#9a9a9a]">From delivery fees</p>
                                    </div>
                                    <DollarSignIcon className="w-12 h-12 text-[#ea690c] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Item Collections</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(financialData.totalItemCollections)}
                                        </h3>
                                        <p className="text-xs text-[#9a9a9a]">From item values</p>
                                    </div>
                                    <CreditCardIcon className="w-12 h-12 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Driver Payments</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(financialData.totalDriverPayments)}
                                        </h3>
                                        <p className="text-xs text-[#9a9a9a]">Total paid to drivers</p>
                                    </div>
                                    <UserCheckIcon className="w-12 h-12 text-green-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Pending Payments</p>
                                        <h3 className="text-2xl font-bold text-[#e22420]">
                                            {formatCurrency(financialData.pendingPayments)}
                                        </h3>
                                        <p className="text-xs text-[#9a9a9a]">Outstanding balances</p>
                                    </div>
                                    <TrendingUpIcon className="w-12 h-12 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Net Revenue Card */}
                    <Card className="border-2 border-[#ea690c] bg-orange-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-[#5d5d5d]">Net Revenue</p>
                                    <h3 className="text-3xl font-bold text-[#ea690c]">
                                        {formatCurrency(financialData.netRevenue)}
                                    </h3>
                                    <p className="text-xs text-[#9a9a9a]">
                                        Total Collections - Driver Payments
                                    </p>
                                </div>
                                <TrendingUpIcon className="w-16 h-16 text-[#ea690c] opacity-30" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Driver Breakdown Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">
                                Driver Performance & Earnings
                            </h2>
                            {driverBreakdown.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-neutral-700">No driver data available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="overflow-hidden">
                                            <table className="min-w-full divide-y divide-[#d1d1d1]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Driver Name
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Deliveries Completed
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Total Earned
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Amount Paid
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Outstanding
                                                        </th>
                                                        <th className="text-center py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Payment Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                    {driverBreakdown.map((driver, index) => (
                                                        <tr
                                                            key={driver.driverId}
                                                            className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                        >
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm font-medium text-neutral-800">
                                                                {driver.driverName}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                {driver.deliveriesCompleted}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm font-semibold text-right text-[#ea690c]">
                                                                {formatCurrency(driver.totalEarned)}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700 text-right">
                                                                {formatCurrency(driver.amountPaid)}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm font-semibold text-right text-[#e22420]">
                                                                {formatCurrency(driver.outstandingBalance)}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-center">
                                                                <Badge
                                                                    className={
                                                                        driver.paymentStatus === "paid"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : driver.paymentStatus === "partial"
                                                                            ? "bg-yellow-100 text-yellow-800"
                                                                            : "bg-red-100 text-red-800"
                                                                    }
                                                                >
                                                                    <span className="text-xs">{driver.paymentStatus}</span>
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
