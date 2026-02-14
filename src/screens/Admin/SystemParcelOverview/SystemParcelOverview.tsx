import { useState, useEffect, useMemo } from "react";
import { Download, Loader, CalendarIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { formatPhoneNumber } from "../../../utils/dataHelpers";
import { useLocation } from "../../../contexts/LocationContext";
import { useParcel } from "../../../contexts/ParcelContext";

export const SystemParcelOverview = (): JSX.Element => {
    const { stations } = useLocation();
    const { parcels, loading, pagination, loadParcelsIfNeeded, refreshParcels } = useParcel();
    const [filters, setFilters] = useState({
        officeId: "",
        isDelivered: undefined as boolean | undefined,
        isParcelAssigned: undefined as boolean | undefined,
        isPOD: undefined as boolean | undefined,
        searchQuery: "",
    });
    const [statusFilter, setStatusFilter] = useState<"" | "delivered" | "assigned" | "pod">("");
    const [selectedDate, setSelectedDate] = useState<string>("");

    // Fetch parcels when filters change (loadParcelsIfNeeded will check cache internally)
    useEffect(() => {
        const apiFilters: any = {};
        
        if (filters.officeId) {
            apiFilters.officeId = filters.officeId;
        }
        if (filters.isDelivered !== undefined) {
            apiFilters.isDelivered = filters.isDelivered;
        }
        if (filters.isParcelAssigned !== undefined) {
            apiFilters.isParcelAssigned = filters.isParcelAssigned;
        }
        if (filters.isPOD !== undefined) {
            apiFilters.isPOD = filters.isPOD;
        }

        // Always call loadParcelsIfNeeded - it will check cache internally
        // It will only fetch if filters changed, cache expired, or no data exists
        loadParcelsIfNeeded(apiFilters, 0, pagination.size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.officeId, filters.isDelivered, filters.isParcelAssigned, filters.isPOD]);

    // Client-side search + date filtering (API doesn't support free-text search)
    const filteredParcels = useMemo(() => {
        let result = parcels;

        if (filters.searchQuery) {
            const searchTerm = filters.searchQuery.toLowerCase();
            result = result.filter((p) =>
                p.parcelId?.toLowerCase().includes(searchTerm) ||
                p.receiverName?.toLowerCase().includes(searchTerm) ||
                p.recieverPhoneNumber?.includes(searchTerm) ||
                p.senderName?.toLowerCase().includes(searchTerm) ||
                p.senderPhoneNumber?.includes(searchTerm)
            );
        }

        if (selectedDate) {
            const target = new Date(selectedDate);
            target.setHours(0, 0, 0, 0);
            const targetMs = target.getTime();

            result = result.filter((p: any) => {
                const createdAt = p.createdAt as number | undefined;
                if (!createdAt) return false;
                const d = new Date(createdAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === targetMs;
            });
        }

        return result;
    }, [parcels, filters.searchQuery, selectedDate]);

    const handleStatusChange = (value: string) => {
        const v = value as "" | "delivered" | "assigned" | "pod";
        setStatusFilter(v);
        setFilters((prev) => ({
            ...prev,
            isDelivered: v === "delivered" ? true : undefined,
            isParcelAssigned: v === "assigned" ? true : undefined,
            isPOD: v === "pod" ? true : undefined,
        }));
    };

    const handleExport = () => {
        const headers = [
            "Parcel ID",
            "Sender Name",
            "Sender Phone",
            "Receiver Name",
            "Receiver Phone",
            "Receiver Address",
            "Description",
            "Driver Name",
            "Driver Phone",
            "Inbound Cost",
            "Pickup Cost",
            "Delivery Cost",
            "Storage Cost",
            "POD",
            "Delivered",
            "Assigned",
            "Fragile",
        ];
        const rows = filteredParcels.map((p) => [
            p.parcelId || "",
            p.senderName || "",
            p.senderPhoneNumber || "",
            p.receiverName || "",
            p.recieverPhoneNumber || "",
            p.receiverAddress || "",
            p.parcelDescription || "",
            p.driverName || "",
            p.driverPhoneNumber || "",
            p.inboundCost?.toString() || "0",
            p.pickUpCost?.toString() || "0",
            p.deliveryCost?.toString() || "0",
            p.storageCost?.toString() || "0",
            p.pod ? "Yes" : "No",
            p.delivered ? "Yes" : "No",
            p.parcelAssigned ? "Yes" : "No",
            p.fragile ? "Yes" : "No",
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                        Office/Station
                                    </label>
                                    <select
                                        value={filters.officeId}
                                        onChange={(e) => setFilters({ ...filters, officeId: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Stations</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name} {station.locationName && `- ${station.locationName}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="pod">POD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Date
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a]" />
                                        <Input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="pl-9 pr-3 w-full border border-[#d1d1d1]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcels Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-neutral-700">Loading parcels...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="overflow-hidden">
                                            <table className="min-w-full divide-y divide-[#d1d1d1] text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Sender
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Receiver
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Phone
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Driver
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Costs
                                                        </th>
                                                        <th className="text-center py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                    {filteredParcels.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="py-12 text-center">
                                                                <p className="text-sm text-neutral-500">
                                                                    {parcels.length === 0 ? "No parcels found" : "No parcels found matching search"}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredParcels.map((parcel, index) => {
                                                            const statusBadges = [];
                                                            if (parcel.delivered) statusBadges.push({ label: "Delivered", color: "bg-green-100 text-green-800" });
                                                            if (parcel.parcelAssigned) statusBadges.push({ label: "Assigned", color: "bg-blue-100 text-blue-800" });
                                                            if (parcel.pod) statusBadges.push({ label: "POD", color: "bg-purple-100 text-purple-800" });
                                                            if (parcel.fragile) statusBadges.push({ label: "Fragile", color: "bg-orange-100 text-orange-800" });
                                                            
                                                            return (
                                                                <tr
                                                                    key={parcel.parcelId}
                                                                    className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                                >
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                        <div>
                                                                            <p className="font-medium">{parcel.senderName || "—"}</p>
                                                                            {parcel.senderPhoneNumber && (
                                                                                <p className="text-[#5d5d5d]">{formatPhoneNumber(parcel.senderPhoneNumber)}</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                        <div>
                                                                            <p className="font-medium">{parcel.receiverName || "—"}</p>
                                                                            {parcel.receiverAddress && (
                                                                                <p className="text-[#5d5d5d] truncate max-w-xs">{parcel.receiverAddress}</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                        {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "—"}
                                                                    </td>
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                        <div>
                                                                            <p>{parcel.driverName || "—"}</p>
                                                                            {parcel.driverPhoneNumber && (
                                                                                <p className="text-[#5d5d5d]">{formatPhoneNumber(parcel.driverPhoneNumber)}</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-neutral-700">
                                                                        <div className="flex flex-col gap-1">
                                                                            {parcel.inboundCost !== undefined && parcel.inboundCost > 0 && (
                                                                                <span>Inbound: GHC {parcel.inboundCost.toFixed(2)}</span>
                                                                            )}
                                                                            {parcel.pickUpCost !== undefined && parcel.pickUpCost > 0 && (
                                                                                <span>Pickup: GHC {parcel.pickUpCost.toFixed(2)}</span>
                                                                            )}
                                                                            {parcel.deliveryCost !== undefined && parcel.deliveryCost > 0 && (
                                                                                <span>Delivery: GHC {parcel.deliveryCost.toFixed(2)}</span>
                                                                            )}
                                                                            {parcel.storageCost !== undefined && parcel.storageCost > 0 && (
                                                                                <span>Storage: GHC {parcel.storageCost.toFixed(2)}</span>
                                                                            )}
                                                                            {(!parcel.inboundCost && !parcel.pickUpCost && !parcel.deliveryCost && !parcel.storageCost) && "—"}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 sm:py-4 sm:px-6 text-center">
                                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                                            {statusBadges.length > 0 ? (
                                                                                statusBadges.map((badge, idx) => (
                                                                                    <Badge key={idx} className={badge.color}>
                                                                                        <span className="text-xs">{badge.label}</span>
                                                                                    </Badge>
                                                                                ))
                                                                            ) : (
                                                                                <Badge className="bg-gray-100 text-gray-800">
                                                                                    <span className="text-xs">Pending</span>
                                                                                </Badge>
                                                                            )}
                                                                        </div>
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
                            )}
                            {/* Pagination */}
                            {!loading && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                    <div className="text-sm text-neutral-700">
                                        Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} parcels
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                const apiFilters: any = {};
                                                if (filters.officeId) apiFilters.officeId = filters.officeId;
                                                if (filters.isDelivered !== undefined) apiFilters.isDelivered = filters.isDelivered;
                                                if (filters.isParcelAssigned !== undefined) apiFilters.isParcelAssigned = filters.isParcelAssigned;
                                                if (filters.isPOD !== undefined) apiFilters.isPOD = filters.isPOD;
                                                refreshParcels(apiFilters, pagination.page - 1, pagination.size);
                                            }}
                                            disabled={pagination.page === 0 || loading}
                                            variant="outline"
                                            size="sm"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const apiFilters: any = {};
                                                if (filters.officeId) apiFilters.officeId = filters.officeId;
                                                if (filters.isDelivered !== undefined) apiFilters.isDelivered = filters.isDelivered;
                                                if (filters.isParcelAssigned !== undefined) apiFilters.isParcelAssigned = filters.isParcelAssigned;
                                                if (filters.isPOD !== undefined) apiFilters.isPOD = filters.isPOD;
                                                refreshParcels(apiFilters, pagination.page + 1, pagination.size);
                                            }}
                                            disabled={pagination.page >= pagination.totalPages - 1 || loading}
                                            variant="outline"
                                            size="sm"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    {!loading && (
                        <div className="text-sm text-[#5d5d5d]">
                            Showing {filteredParcels.length} of {pagination.totalElements} parcels
                            {filters.searchQuery && ` (filtered from ${parcels.length} loaded)`}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
