import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { mockParcels, mockStations } from "../../../data/mockData";
import { Parcel, STATUS_CONFIG } from "../../../types";
import { getStationName, formatPhoneNumber, formatDate } from "../../../utils/dataHelpers";

export const SystemParcelOverview = (): JSX.Element => {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [filters, setFilters] = useState({
        station: "",
        status: "",
        dateFrom: "",
        dateTo: "",
        searchQuery: "",
    });

    useEffect(() => {
        // Load all parcels
        setParcels(mockParcels);
    }, []);

    const filteredParcels = useMemo(() => {
        let filtered = [...parcels];

        // Filter by station
        if (filters.station) {
            filtered = filtered.filter((p) => p.stationId === filters.station);
        }

        // Filter by status
        if (filters.status) {
            filtered = filtered.filter((p) => p.status === filters.status);
        }

        // Filter by date range
        if (filters.dateFrom) {
            filtered = filtered.filter(
                (p) => new Date(p.registeredDate) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(
                (p) => new Date(p.registeredDate) <= new Date(filters.dateTo)
            );
        }

        // Search query
        if (filters.searchQuery) {
            const searchTerm = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.id.toLowerCase().includes(searchTerm) ||
                    p.recipientName.toLowerCase().includes(searchTerm) ||
                    p.recipientPhone.includes(searchTerm)
            );
        }

        return filtered;
    }, [parcels, filters]);

    const stations = mockStations;
    const statuses = Object.keys(STATUS_CONFIG);

    const handleExport = () => {
        const headers = [
            "Parcel ID",
            "Station",
            "Recipient",
            "Phone",
            "Status",
            "Shelf",
            "Rider",
            "Delivery Type",
            "Date Registered",
        ];
        const rows = filteredParcels.map((p) => [
            p.id,
            getStationName(p.stationId, mockStations),
            p.recipientName,
            p.recipientPhone,
            STATUS_CONFIG[p.status]?.label || p.status,
            p.shelfLocation,
            p.assignedRiderName || "N/A",
            p.deliveryPreference === "pickup" ? "Pickup" : "Home Delivery",
            formatDate(p.registeredDate),
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcels-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-3 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1"></div>
                        <Button
                            onClick={handleExport}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Search
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Search by ID, name, phone..."
                                        value={filters.searchQuery}
                                        onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Station
                                    </label>
                                    <select
                                        value={filters.station}
                                        onChange={(e) => setFilters({ ...filters, station: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Stations</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Status</option>
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        From Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        To Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcels Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto -mx-6 sm:mx-0">
                                <div className="inline-block min-w-full align-middle">
                                    <div className="overflow-hidden">
                                        <table className="min-w-full divide-y divide-[#d1d1d1] text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Parcel ID
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Station
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Recipient
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Rider
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                {filteredParcels.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="py-12 text-center">
                                                            <p className="text-sm text-neutral-500">No parcels found matching filters</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredParcels.map((parcel, index) => {
                                                        const statusConfig = STATUS_CONFIG[parcel.status] || { label: parcel.status, color: "bg-gray-100 text-gray-800" };
                                                        return (
                                                            <tr
                                                                key={parcel.id}
                                                                className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                            >
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <span className="text-xs sm:text-sm font-medium text-neutral-800">{parcel.id}</span>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {getStationName(parcel.stationId, mockStations)}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {parcel.recipientName}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {formatPhoneNumber(parcel.recipientPhone)}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <Badge className={statusConfig.color}>
                                                                        <span className="text-xs">{statusConfig.label}</span>
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {parcel.assignedRiderName || "—"}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {parcel.deliveryPreference === "pickup" ? "Pickup" : parcel.deliveryPreference === "delivery" ? "Home Delivery" : "—"}
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                    {formatDate(parcel.registeredDate)}
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

                    {/* Summary */}
                    <div className="text-sm text-[#5d5d5d]">
                        Showing {filteredParcels.length} of {parcels.length} parcels
                    </div>
                </main>
            </div>
        </div>
    );
};
