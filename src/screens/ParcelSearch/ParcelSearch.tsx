import { useState, useMemo, useEffect } from "react";
import { SearchIcon, FilterIcon, Download, X, Edit, Loader, Eye } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { useShelf } from "../../contexts/ShelfContext";
import { formatPhoneNumber, phoneMatchesSearch } from "../../utils/dataHelpers";
import frontdeskService, { ParcelResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import authService from "../../services/authService";
import { useFrontdeskParcel } from "../../contexts/FrontdeskParcelContext";

export const ParcelSearch = (): JSX.Element => {
    const { currentStation, currentUser, userRole } = useStation();
    const { shelves, loadShelves } = useShelf();
    const { showToast } = useToast();
    const {
        parcels,
        loading,
        backgroundLoading,
        pagination,
        loadParcelsIfNeeded,
        refreshParcels,
        prefetchNextPageIfPossible,
    } = useFrontdeskParcel();
    const [searchParams, setSearchParams] = useState({
        recipientName: "",
        phoneNumber: "",
        parcelId: "",
        status: "",
        startDate: "",
        endDate: "",
        shelfLocation: "",
        driverName: "",
    });
    const [generalSearch, setGeneralSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(null);
    const [editingShelf, setEditingShelf] = useState(false);
    const [newShelfLocation, setNewShelfLocation] = useState("");
    const [markPickupLoading, setMarkPickupLoading] = useState(false);

    // NEW helper: determine human status label including pickup/hasCalled
    const getStatusLabel = (p: ParcelResponse): string => {
        // Priority: Delivered > Picked Up > POD > Assigned > Called > Registered
        if (p.delivered) return "Delivered";
        if (p.pickedUp) return "Picked Up";
        if (p.pod) return "POD";
        if (p.parcelAssigned) return "Assigned";
        if (p.hasCalled) return "Called";
        return "Registered";
    };

    // Helper: parse YYYY-MM-DD (input[type="date"]) to local Date (midnight)
    const parseDateInput = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split("-").map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    };

    // Load parcels on mount - only show loading UI if no cache exists
    useEffect(() => {
        const hasCache = parcels.length > 0;
        loadParcelsIfNeeded({}, pagination.page, pagination.size, !hasCache);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once current page has loaded, prefetch the next page in the background so "Next" feels instant
    useEffect(() => {
        if (loading || backgroundLoading) return;
        if (parcels.length === 0) return;
        if (pagination.totalPages <= 0 || pagination.page + 1 >= pagination.totalPages) return;
        prefetchNextPageIfPossible();
    }, [loading, backgroundLoading, parcels.length, pagination.page, pagination.totalPages, prefetchNextPageIfPossible]);

    // Load shelves using office ID from user data
    useEffect(() => {
        const userData = authService.getUser();
        const officeId = (userData as any)?.office?.id;

        if (officeId) {
            loadShelves(officeId);
        } else if (currentStation && userRole === "ADMIN") {
            // Fallback for admin users with selected station
            loadShelves(currentStation.id);
        }
    }, [currentStation, userRole, loadShelves]);

    // Filter parcels based on search parameters (client-side filtering)
    const filteredParcels = useMemo(() => {
        let filtered = [...parcels];

        // General search (searches across multiple fields with OR logic)
        if (generalSearch.trim()) {
            const searchTerm = generalSearch.trim().toLowerCase();
            filtered = filtered.filter((p) => {
                // Check parcel ID
                if (p.parcelId?.toLowerCase().includes(searchTerm)) return true;

                // Check recipient name
                if (p.receiverName?.toLowerCase().includes(searchTerm)) return true;

                // Check sender name
                if (p.senderName?.toLowerCase().includes(searchTerm)) return true;

                // Check phone numbers (handles various formats)
                if (phoneMatchesSearch(p.recieverPhoneNumber, searchTerm)) return true;
                if (phoneMatchesSearch(p.senderPhoneNumber, searchTerm)) return true;
                if (phoneMatchesSearch(p.driverPhoneNumber, searchTerm)) return true;

                // Check driver name
                if (p.driverName?.toLowerCase().includes(searchTerm)) return true;

                // Check parcel description
                if (p.parcelDescription?.toLowerCase().includes(searchTerm)) return true;

                return false;
            });
        }

        // Specific filters (work together with AND logic)
        // Filter by parcel ID (only if not using general search)
        if (!generalSearch.trim() && searchParams.parcelId) {
            const searchTerm = searchParams.parcelId.toLowerCase();
            filtered = filtered.filter((p) =>
                p.parcelId?.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by recipient name (only if not using general search)
        if (!generalSearch.trim() && searchParams.recipientName) {
            const searchTerm = searchParams.recipientName.toLowerCase();
            filtered = filtered.filter((p) =>
                p.receiverName?.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by phone number - handles various formats (only if not using general search)
        if (!generalSearch.trim() && searchParams.phoneNumber) {
            const searchTerm = searchParams.phoneNumber.trim();
            filtered = filtered.filter((p) =>
                phoneMatchesSearch(p.recieverPhoneNumber, searchTerm) ||
                phoneMatchesSearch(p.senderPhoneNumber, searchTerm) ||
                phoneMatchesSearch(p.driverPhoneNumber, searchTerm)
            );
        }

        // Filter by shelf location
        if (searchParams.shelfLocation) {
            filtered = filtered.filter((p) =>
                (p.shelfName || p.shelfNumber) === searchParams.shelfLocation
            );
        }

        // Filter by status
        if (searchParams.status) {
            filtered = filtered.filter((p) => {
                if (searchParams.status === "delivered") return p.delivered;
                if (searchParams.status === "assigned") return p.parcelAssigned;
                if (searchParams.status === "pod") return p.pod;
                if (searchParams.status === "registered") return !p.delivered && !p.parcelAssigned && !p.pod;
                return true;
            });
        }

        // NEW: Filter by createdAt using startDate and endDate (YYYY-MM-DD inputs)
        if (searchParams.startDate) {
            const start = parseDateInput(searchParams.startDate);
            if (start) {
                const startMs = new Date(start).setHours(0, 0, 0, 0);
                filtered = filtered.filter((p) => {
                    const created = typeof p.createdAt === "number" ? p.createdAt : Number(p.createdAt || 0);
                    return created && created >= startMs;
                });
            }
        }

        if (searchParams.endDate) {
            const end = parseDateInput(searchParams.endDate);
            if (end) {
                const endMs = new Date(end).setHours(23, 59, 59, 999);
                filtered = filtered.filter((p) => {
                    const created = typeof p.createdAt === "number" ? p.createdAt : Number(p.createdAt || 0);
                    return created && created <= endMs;
                });
            }
        }

        return filtered;
    }, [parcels, searchParams, generalSearch]);

    const handleClearFilters = () => {
        setGeneralSearch("");
        setSearchParams({
            recipientName: "",
            phoneNumber: "",
            parcelId: "",
            status: "",
            startDate: "",
            endDate: "",
            shelfLocation: "",
            driverName: "",
        });
    };

    const handleUpdateShelf = async () => {
        if (!selectedParcel || !newShelfLocation || !currentUser) return;

        try {
            // Find shelf ID from shelves list if we're using shelf name
            const selectedShelf = shelves.find(s => s.name === newShelfLocation);
            const shelfIdToUpdate = selectedShelf?.id || newShelfLocation;

            const response = await frontdeskService.updateParcel(selectedParcel.parcelId, {
                shelfNumber: shelfIdToUpdate,
            });

            if (response.success) {
                showToast("Shelf location updated successfully", "success");
                // Refresh parcels
                await refreshParcels({}, pagination.page, pagination.size);
                setEditingShelf(false);
                setSelectedParcel(null);
            } else {
                showToast(response.message || "Failed to update shelf location", "error");
            }
        } catch (error) {
            console.error("Update shelf error:", error);
            showToast("Failed to update shelf location. Please try again.", "error");
        }
    };

    const handleMarkPickedUp = async () => {
        if (!selectedParcel) return;
        setMarkPickupLoading(true);
        try {
            const parcelId = selectedParcel.parcelId;
            const response = await frontdeskService.updateParcel(parcelId, {
                hasCalled: true,
                pickedUp: true,
            });

            if (response.success) {
                showToast("Parcel marked as picked up", "success");

                // Refresh parcels and update selectedParcel with fresh data if available
                await refreshParcels({}, pagination.page, pagination.size);
                const refreshed = parcels.find((p) => p.parcelId === parcelId) || null;
                setSelectedParcel(refreshed);
            } else {
                showToast(response.message || "Failed to update parcel status", "error");
            }
        } catch (error) {
            console.error("Failed to mark parcel picked up:", error);
            showToast("Failed to update parcel. Please try again.", "error");
        } finally {
            setMarkPickupLoading(false);
        }
    };

    const handleExport = () => {
        const headers = [
            "Parcel ID",
            "Recipient Name",
            "Phone",
            "Address",
            "Shelf",
            "Status",
            "Delivery Cost",
            "Pick Up Cost",
        ];
        const rows = filteredParcels.map((p) => {
            // Use new helper to determine status
            const statusLabel = getStatusLabel(p);

            return [
                p.parcelId,
                p.receiverName || "N/A",
                p.recieverPhoneNumber || "N/A",
                p.receiverAddress || "N/A",
                p.shelfNumber || "N/A",
                statusLabel,
                (p.deliveryCost || 0).toFixed(2),
                (p.pickUpCost || 0).toFixed(2),
            ];
        });

        const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcels-search-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    // Get unique shelves from parcels
    const uniqueShelves = [...new Set(parcels.map((p: ParcelResponse) => p.shelfName || p.shelfNumber).filter(Boolean))].sort() as string[];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Quick Search Bar */}
                    <Card className="border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative group">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        placeholder="Search by recipient name, parcel ID, phone, or driver..."
                                        value={generalSearch}
                                        onChange={(e) => {
                                            setGeneralSearch(e.target.value);
                                        }}
                                        className="pl-10 h-11 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowFilters(!showFilters)}
                                        variant={showFilters ? "default" : "outline"}
                                        className={`flex items-center gap-2 h-11 transition-all ${showFilters ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30" : "border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500"
                                            }`}
                                    >
                                        <FilterIcon size={18} />
                                        <span className="hidden sm:inline">{showFilters ? "Hide" : "Show"} Filters</span>
                                    </Button>
                                    <Button
                                        onClick={handleExport}
                                        disabled={filteredParcels.length === 0}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 flex items-center gap-2 h-11 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={16} />
                                        <span className="hidden sm:inline">Export</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                        <FilterIcon size={16} className="text-orange-500" />
                                        Advanced Filters
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Phone Number Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Phone Number
                                            </label>
                                            <Input
                                                placeholder="+233..."
                                                value={searchParams.phoneNumber}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        phoneNumber: e.target.value,
                                                    }))
                                                }
                                                className="border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={searchParams.status}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        status: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                            >
                                                <option value="">All Status</option>
                                                <option value="registered">Registered</option>
                                                <option value="assigned">Assigned</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="pod">POD</option>
                                            </select>
                                        </div>

                                        {/* Shelf Location Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Shelf Location
                                            </label>
                                            <select
                                                value={searchParams.shelfLocation}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        shelfLocation: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                            >
                                                <option value="">All Shelves</option>
                                                {uniqueShelves.map((shelf) => (
                                                    <option key={shelf} value={shelf}>
                                                        {shelf}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Receiver Name Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Receiver Name
                                            </label>
                                            <Input
                                                placeholder="Receiver name..."
                                                value={searchParams.recipientName}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        recipientName: e.target.value,
                                                    }))
                                                }
                                                className="border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500"
                                            />
                                        </div>

                                        {/* Start Date Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                From Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={searchParams.startDate}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        startDate: e.target.value,
                                                    }))
                                                }
                                                className="border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500"
                                            />
                                        </div>

                                        {/* End Date Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                To Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={searchParams.endDate}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        endDate: e.target.value,
                                                    }))
                                                }
                                                className="border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {Object.values(searchParams).filter(v => v).length} filter(s) active
                                        </span>
                                        <Button 
                                            onClick={handleClearFilters} 
                                            variant="outline" 
                                            size="sm" 
                                            className="border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:text-orange-600 transition-all"
                                        >
                                            <X size={14} className="mr-1" />
                                            Clear All Filters
                                        </Button>
                                    </div>
                                </div>

                            )}
                        </CardContent>

                    </Card>

                    {/* Results Summary */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading parcels...</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredParcels.length}</span>
                                        <span className="text-gray-600 dark:text-gray-400">of</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.totalElements}</span>
                                        <span className="text-gray-600 dark:text-gray-400">parcel(s)</span>
                                    </div>
                                    {backgroundLoading && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                            <Loader className="w-3 h-3 animate-spin" />
                                            Loading...
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Rows per page:</span>
                                    <select
                                        value={pagination.size}
                                        onChange={(e) => {
                                            const newSize = parseInt(e.target.value);
                                            loadParcelsIfNeeded({}, 0, newSize, true);
                                        }}
                                        className="text-sm border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                    >
                                        <option value={1000}>1000</option>
                                        <option value={2000}>2000</option>
                                        <option value={5000}>5000</option>
                                    </select>
                                </div>
                            </div>

                            {/* Parcels Table */}
                            <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-lg pb-20">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
                                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                                            <colgroup>
                                                <col style={{width: '18%'}} />
                                                <col style={{width: '13%'}} />
                                                <col style={{width: '15%'}} />
                                                <col style={{width: '10%'}} />
                                                <col style={{width: '10%'}} />
                                                <col style={{width: '22%'}} />
                                                <col style={{width: '12%'}} />
                                            </colgroup>
                                            <thead className="bg-gradient-to-r from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-gray-900 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Recipient
                                                    </th>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Phone
                                                    </th>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Date
                                                    </th>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Status
                                                    </th>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Shelf
                                                    </th>
                                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Driver
                                                    </th>
                                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredParcels.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="py-12 px-4 text-center">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 rounded-full flex items-center justify-center">
                                                                    <SearchIcon className="w-8 h-8 text-orange-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No parcels found</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search criteria</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredParcels.map((parcel, index) => {
                                                        // Use new helper to determine status
                                                        const statusLabel = getStatusLabel(parcel);
                                                        let statusColor = "bg-gray-100 text-gray-800";
                                                        if (statusLabel === "Delivered") {
                                                            statusColor = "bg-green-100 text-green-800";
                                                        } else if (statusLabel === "Assigned") {
                                                            statusColor = "bg-blue-100 text-blue-800";
                                                        } else if (statusLabel === "POD") {
                                                            statusColor = "bg-purple-100 text-purple-800";
                                                        } else if (statusLabel === "Picked Up") {
                                                            statusColor = "bg-orange-100 text-orange-800";
                                                        } else if (statusLabel === "Called") {
                                                            statusColor = "bg-yellow-100 text-yellow-800";
                                                        }

                                                        return (
                                                            <tr
                                                                key={parcel.parcelId}
                                                                className={`transition-all duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 hover:shadow-sm ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'} align-middle cursor-pointer`}
                                                                onClick={() => {
                                                                    setSelectedParcel(parcel);
                                                                    setNewShelfLocation(parcel.shelfId || parcel.shelfNumber || "");
                                                                    setEditingShelf(false);
                                                                }}
                                                            >
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{parcel.receiverName || "N/A"}</p>
                                                                        {parcel.senderName && (
                                                                            <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">From: {parcel.senderName}</p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <div className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                                        {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <div className="text-gray-700 dark:text-gray-300 text-xs">
                                                                        {parcel.createdAt ? new Date(parcel.createdAt).toLocaleString() : "—"}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <Badge className={`${statusColor} text-[10px] px-2 py-1 font-medium shadow-sm`}>
                                                                        {statusLabel}
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{parcel.shelfName || parcel.shelfNumber || "—"}</span>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <div className="text-xs">
                                                                        {parcel.driverName ? (
                                                                            <>
                                                                                <p className="text-gray-900 dark:text-gray-100 font-semibold text-xs">{parcel.driverName}</p>
                                                                                {parcel.driverPhoneNumber && (
                                                                                    <p className="text-gray-500 dark:text-gray-400 text-[10px]">{formatPhoneNumber(parcel.driverPhoneNumber)}</p>
                                                                                )}
                                                                                {parcel.vehicleNumber && (
                                                                                    <p className="text-gray-500 dark:text-gray-400 text-[10px]">{parcel.vehicleNumber}</p>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedParcel(parcel);
                                                                            setNewShelfLocation(parcel.shelfId || parcel.shelfNumber || "");
                                                                            setEditingShelf(false);
                                                                        }}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8 px-3 text-xs font-medium transition-all shadow-sm hover:shadow-md"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                                        <span>View</span>
                                                                    </Button>
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

                            {/* Pagination - Floating */}
                            {pagination.totalPages > 1 && (
                                <Card className="fixed bottom-4 left-[260px] right-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl z-50">
                                    <CardContent className="px-4 py-4">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            <Button
                                                onClick={() => {
                                                    const newPage = pagination.page - 1;
                                                    loadParcelsIfNeeded({}, newPage, pagination.size, false);
                                                }}
                                                disabled={pagination.page === 0 || backgroundLoading}
                                                variant="outline"
                                                className="border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 disabled:opacity-50"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const newPage = pagination.page + 1;
                                                    loadParcelsIfNeeded({}, newPage, pagination.size, false);
                                                }}
                                                disabled={pagination.page >= pagination.totalPages - 1 || backgroundLoading}
                                                variant="outline"
                                                className="border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 disabled:opacity-50"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.page * pagination.size + 1}</span> to{" "}
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                                        {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
                                                    </span>{" "}
                                                    of <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.totalElements}</span> results
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        const newPage = pagination.page - 1;
                                                        loadParcelsIfNeeded({}, newPage, pagination.size, false);
                                                    }}
                                                    disabled={pagination.page === 0 || backgroundLoading}
                                                    variant="outline"
                                                    className="border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {backgroundLoading && pagination.page > 0 ? (
                                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                                    ) : null}
                                                    Previous
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const newPage = pagination.page + 1;
                                                        loadParcelsIfNeeded({}, newPage, pagination.size, false);
                                                    }}
                                                    disabled={pagination.page >= pagination.totalPages - 1 || backgroundLoading}
                                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition-all"
                                                >
                                                    {backgroundLoading && pagination.page < pagination.totalPages - 1 ? (
                                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                                    ) : null}
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Shelf Update Modal */}
            {selectedParcel && editingShelf && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-neutral-800 dark:text-gray-100">Update Shelf Location</h3>
                                <button
                                    onClick={() => {
                                        setEditingShelf(false);
                                        setSelectedParcel(null);
                                    }}
                                    className="text-gray-400 dark:text-gray-500 hover:text-neutral-800 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Parcel: {selectedParcel.receiverName || selectedParcel.parcelId}
                                    </label>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Current Shelf: {selectedParcel.shelfName || selectedParcel.shelfNumber || "Not set"}
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        New Shelf Location <span className="text-[#e22420]">*</span>
                                    </label>
                                    <select
                                        value={newShelfLocation}
                                        onChange={(e) => setNewShelfLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-neutral-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">Select a shelf</option>
                                        {shelves.map((s) => (
                                            <option key={s.id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => {
                                            setEditingShelf(false);
                                            setSelectedParcel(null);
                                        }}
                                        variant="outline"
                                        className="flex-1 border border-[#d1d1d1]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpdateShelf}
                                        disabled={!newShelfLocation}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                    >
                                        Update Shelf
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Parcel Details Modal */}
            {selectedParcel && !editingShelf && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800 dark:text-gray-100">Parcel Details</h3>
                                <button
                                    onClick={() => setSelectedParcel(null)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-neutral-800 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Parcel ID</p>
                                            <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.parcelId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                            <Badge className={
                                                selectedParcel.delivered
                                                    ? "bg-green-100 text-green-800"
                                                    : selectedParcel.parcelAssigned
                                                        ? "bg-blue-100 text-blue-800"
                                                        : selectedParcel.pod
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-gray-100 text-gray-800"
                                            }>
                                                {selectedParcel.delivered
                                                    ? "Delivered"
                                                    : selectedParcel.parcelAssigned
                                                        ? "Assigned"
                                                        : selectedParcel.pod
                                                            ? "POD"
                                                            : "Registered"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shelf Location</p>
                                            <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.shelfName || selectedParcel.shelfNumber || "Not set"}</p>
                                        </div>
                                        {selectedParcel.fragile !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fragile</p>
                                                <Badge className={selectedParcel.fragile ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.fragile ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recipient Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Recipient Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recipient Name</p>
                                            <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.receiverName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                                            <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">
                                                {selectedParcel.recieverPhoneNumber ? formatPhoneNumber(selectedParcel.recieverPhoneNumber) : "N/A"}
                                            </p>
                                        </div>
                                        {selectedParcel.receiverAddress && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery Address</p>
                                                <p className="text-sm text-neutral-700 dark:text-gray-300">{selectedParcel.receiverAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sender Information */}
                                {(selectedParcel.senderName || selectedParcel.senderPhoneNumber) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Sender Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedParcel.senderName && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sender Name</p>
                                                    <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.senderName}</p>
                                                </div>
                                            )}
                                            {selectedParcel.senderPhoneNumber && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sender Phone</p>
                                                    <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">
                                                        {formatPhoneNumber(selectedParcel.senderPhoneNumber)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Driver Information */}
                                {selectedParcel.driverName && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Driver Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Driver Name</p>
                                                <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.driverName}</p>
                                            </div>
                                            {selectedParcel.driverPhoneNumber && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Driver Phone</p>
                                                    <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">
                                                        {formatPhoneNumber(selectedParcel.driverPhoneNumber)}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedParcel.vehicleNumber && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle Number</p>
                                                    <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.vehicleNumber}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* NEW: Rider Information */}
                                {selectedParcel.riderInfo && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Rider Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rider Name</p>
                                                <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.riderInfo.riderName}</p>
                                            </div>
                                            {selectedParcel.riderInfo.riderPhoneNumber && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rider Phone</p>
                                                    <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{formatPhoneNumber(selectedParcel.riderInfo.riderPhoneNumber)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Costs */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Costs</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedParcel.pickUpCost !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pick Up Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">
                                                    GHC {selectedParcel.pickUpCost.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedParcel.deliveryCost !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">
                                                    GHC {selectedParcel.deliveryCost.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedParcel.inboundCost !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inbound Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">
                                                    GHC {selectedParcel.inboundCost.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedParcel.storageCost !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage Cost</p>
                                                <p className="font-semibold text-[#ea690c] text-sm">
                                                    GHC {selectedParcel.storageCost.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Item Description */}
                                {selectedParcel.parcelDescription && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Item Description</h4>
                                        <p className="text-sm text-neutral-700 dark:text-gray-300">{selectedParcel.parcelDescription}</p>
                                    </div>
                                )}

                                {/* Additional Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Additional Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedParcel.hasCalled !== undefined && selectedParcel.hasCalled !== null && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Has Called</p>
                                                <Badge className={selectedParcel.hasCalled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.hasCalled ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {selectedParcel.inboudPayed !== undefined && selectedParcel.inboudPayed !== null && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inbound Paid</p>
                                                <Badge className={selectedParcel.inboudPayed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.inboudPayed ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {selectedParcel.homeDelivery !== undefined && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Home Delivery</p>
                                                <Badge className={selectedParcel.homeDelivery ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                                    {selectedParcel.homeDelivery ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {selectedParcel.registeredDate && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Registered Date</p>
                                                <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">
                                                    {new Date(selectedParcel.registeredDate).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {typeof selectedParcel.officeId === 'string' ? (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Office ID</p>
                                                <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.officeId}</p>
                                            </div>
                                        ) : selectedParcel.officeId ? (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Office</p>
                                                <p className="font-semibold text-neutral-800 dark:text-gray-200 text-sm">{selectedParcel.officeId.name}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Pickup Status and Action */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {selectedParcel.pickedUp ? (
                                            <Badge className="bg-green-100 text-green-800">Picked Up</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">Not Picked Up</Badge>
                                        )}
                                        <span className="text-sm text-[#5d5d5d]">
                                            Has Called: {selectedParcel.hasCalled ? "Yes" : "No"}
                                        </span>
                                    </div>

                                    {!selectedParcel.pickedUp && (
                                        <div>
                                            <Button
                                                onClick={handleMarkPickedUp}
                                                disabled={markPickupLoading}
                                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                            >
                                                {markPickupLoading ? "Updating..." : "Mark Picked Up"}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                    <Button
                                        onClick={() => {
                                            setEditingShelf(true);
                                        }}
                                        variant="outline"
                                        className="flex-1 border border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Update Shelf Location
                                    </Button>
                                    <Button
                                        onClick={() => setSelectedParcel(null)}
                                        variant="outline"
                                        className="flex-1 border border-[#d1d1d1]"
                                    >
                                        Close
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
