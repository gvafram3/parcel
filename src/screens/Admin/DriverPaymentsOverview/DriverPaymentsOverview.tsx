import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { getDriverFinancials, mockStations } from "../../../data/mockData";
import { DriverFinancial } from "../../../types";
import { formatCurrency, formatDate, getStationName } from "../../../utils/dataHelpers";

const paymentStatusConfig = {
    paid: {
        label: "Paid",
        color: "bg-green-100 text-green-800",
        icon: "✓",
    },
    partial: {
        label: "Partial",
        color: "bg-yellow-100 text-yellow-800",
        icon: "◐",
    },
    pending: {
        label: "Pending",
        color: "bg-red-100 text-red-800",
        icon: "!",
    },
};

export const DriverPaymentsOverview = (): JSX.Element => {
    const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "partial" | "pending">("all");
    const [sortBy, setSortBy] = useState<"earnings" | "deliveries" | "outstanding">("earnings");
    const [drivers, setDrivers] = useState<DriverFinancial[]>([]);

    useEffect(() => {
        const driverData = getDriverFinancials();
        setDrivers(driverData);
    }, []);

    // Calculate summary
    const totalEarned = drivers.reduce((sum, d) => sum + d.totalEarned, 0);
    const totalPaid = drivers.reduce((sum, d) => sum + d.amountPaid, 0);
    const totalOutstanding = drivers.reduce((sum, d) => sum + d.outstandingBalance, 0);
    const totalDeliveries = drivers.reduce((sum, d) => sum + d.deliveriesCompleted, 0);

    // Filter drivers
    const filteredDrivers = drivers
        .filter((driver) => {
            if (filterStatus === "all") return true;
            return driver.paymentStatus === filterStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "earnings":
                    return b.totalEarned - a.totalEarned;
                case "deliveries":
                    return b.deliveriesCompleted - a.deliveriesCompleted;
                case "outstanding":
                    return b.outstandingBalance - a.outstandingBalance;
                default:
                    return 0;
            }
        });

    const handleProcessPayment = (driverId: string) => {
        alert(`Process payment for driver ${driverId} - To be implemented with backend`);
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Driver Payments Overview</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Manage and track driver payments across all stations
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Earned</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(totalEarned)}
                                        </h3>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Paid</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            {formatCurrency(totalPaid)}
                                        </h3>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Outstanding</p>
                                        <h3 className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(totalOutstanding)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Deliveries</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">{totalDeliveries}</h3>
                                    </div>
                                    <Users className="w-10 h-10 text-purple-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Payment Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) =>
                                            setFilterStatus(e.target.value as "all" | "paid" | "partial" | "pending")
                                        }
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="partial">Partial</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value as "earnings" | "deliveries" | "outstanding")
                                        }
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="earnings">Total Earned</option>
                                        <option value="deliveries">Deliveries Completed</option>
                                        <option value="outstanding">Outstanding Balance</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Drivers Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Driver
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Station
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Deliveries
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Total Earned
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Amount Paid
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Outstanding
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDrivers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-neutral-700">
                                                    No drivers found matching filters
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDrivers.map((driver) => {
                                                const statusConfig =
                                                    paymentStatusConfig[driver.paymentStatus] ||
                                                    paymentStatusConfig.pending;
                                                return (
                                                    <tr
                                                        key={driver.driverId}
                                                        className="border-b border-[#d1d1d1] hover:bg-gray-50"
                                                    >
                                                        <td className="py-4 px-4">
                                                            <span className="font-medium text-neutral-800">
                                                                {driver.driverName}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-neutral-700">
                                                            {getStationName(driver.stationId, mockStations)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-sm text-neutral-700">
                                                            {driver.deliveriesCompleted}
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-sm font-semibold text-green-600">
                                                            {formatCurrency(driver.totalEarned)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-sm font-semibold text-blue-600">
                                                            {formatCurrency(driver.amountPaid)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-sm font-bold text-orange-600">
                                                            {formatCurrency(driver.outstandingBalance)}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <Badge className={statusConfig.color}>
                                                                {statusConfig.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {driver.outstandingBalance > 0 && (
                                                                <Button
                                                                    onClick={() => handleProcessPayment(driver.driverId)}
                                                                    size="sm"
                                                                    className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                                                >
                                                                    Process Payment
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
