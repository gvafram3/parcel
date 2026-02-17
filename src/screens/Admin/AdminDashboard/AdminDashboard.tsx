import { useMemo } from "react";
import { Building2, Package, DollarSign, TrendingUp, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    getSystemMetrics,
    getStationPerformance,
    getParcelStatusCounts,
    StationPerformance,
    ParcelStatusCount,
} from "../../../data/mockData";
import { formatCurrency } from "../../../utils/dataHelpers";

export const AdminDashboard = (): JSX.Element => {
    const navigate = useNavigate();

    // Compute data on first render so it's available immediately (avoids empty state on first load)
    const systemMetrics = useMemo(() => getSystemMetrics(), []);
    const stationPerformance = useMemo<StationPerformance[]>(() => getStationPerformance(), []);
    const parcelsByStatus = useMemo<ParcelStatusCount[]>(() => getParcelStatusCounts(), []);

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1"></div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => navigate("/admin/stations")}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                            >
                                Create Station
                            </Button>
                            <Button
                                onClick={() => navigate("/admin/users")}
                                variant="outline"
                                className="border border-[#d1d1d1]"
                            >
                                Create User
                            </Button>
                        </div>
                    </div>

                    {/* System Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Total Stations</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-neutral-800 truncate">
                                            {systemMetrics.totalStations}
                                        </h3>
                                    </div>
                                    <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-[#ea690c] opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Total Parcels</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-neutral-800 truncate">
                                            {systemMetrics.totalParcels.toLocaleString()}
                                        </h3>
                                    </div>
                                    <Package className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500 opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Delivery Earnings</p>
                                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-800 truncate">
                                            {formatCurrency(systemMetrics.totalDeliveryEarnings)}
                                        </h3>
                                    </div>
                                    <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Driver Payments Owed</p>
                                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-800 truncate">
                                            {formatCurrency(systemMetrics.totalDriverPayments)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Success Rate</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-neutral-800 truncate">
                                            {systemMetrics.deliverySuccessRate}%
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-[#ea690c] opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-[#5d5d5d]">Active Users</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-neutral-800 truncate">
                                            {systemMetrics.activeUsers}
                                        </h3>
                                    </div>
                                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500 opacity-20 flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Parcels by Status */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-4 sm:p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Parcels by Status</h2>
                            {parcelsByStatus.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-[#5d5d5d]">No parcel data available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {parcelsByStatus.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg border border-[#d1d1d1] ${item.color}`}
                                        >
                                            <p className="text-sm font-semibold text-neutral-800">{item.status}</p>
                                            <p className="text-2xl font-bold text-neutral-800 mt-2">{item.count}</p>
                                            <p className="text-xs text-[#5d5d5d] mt-1">
                                                {systemMetrics.totalParcels > 0
                                                    ? ((item.count / systemMetrics.totalParcels) * 100).toFixed(1)
                                                    : 0}% of total
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Station Performance */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Station Performance</h2>
                            {stationPerformance.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-[#5d5d5d]">No station data available</p>
                                </div>
                            ) : (
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
                                                            Parcels
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Earnings
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Owed to Drivers
                                                        </th>
                                                        <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Success Rate
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                    {stationPerformance.map((station, index) => (
                                                        <tr
                                                            key={station.stationId}
                                                            className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                        >
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-[#9a9a9a] flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm font-medium text-neutral-800">
                                                                        {station.stationName}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                {station.totalParcels}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm font-semibold text-[#ea690c]">
                                                                {formatCurrency(station.deliveryEarnings)}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap text-xs sm:text-sm font-semibold text-neutral-800">
                                                                {formatCurrency(station.driverPaymentsOwed)}
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 text-right whitespace-nowrap">
                                                                <span className="text-xs sm:text-sm font-semibold text-green-600">
                                                                    {station.successRate}%
                                                                </span>
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
