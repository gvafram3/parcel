import { useState, useMemo, useEffect } from "react";
import { SearchIcon, FilterIcon, Download, MapPin, PhoneIcon, Clock, DollarSign, X, Edit } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { getParcelsByStation, mockParcels, updateParcelStatus } from "../../data/mockData";
import { searchParcels, formatPhoneNumber, formatDate } from "../../utils/dataHelpers";
import { Parcel, ParcelStatus, STATUS_CONFIG } from "../../types";
import { getShelvesByStation } from "../../data/mockData";

export const ParcelSearch = (): JSX.Element => {
    const { currentStation, currentUser, userRole } = useStation();
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [searchParams, setSearchParams] = useState({
        recipientName: "",
        phoneNumber: "",
        parcelId: "",
        status: "" as ParcelStatus | "",
        startDate: "",
        endDate: "",
        shelfLocation: "",
        driverName: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [editingShelf, setEditingShelf] = useState(false);
    const [newShelfLocation, setNewShelfLocation] = useState("");

    useEffect(() => {
        if (currentStation) {
            const stationParcels = getParcelsByStation(currentStation.id);
            setParcels(stationParcels);
        } else if (userRole === "admin") {
            // Admin sees all parcels
            setParcels(mockParcels);
        }
    }, [currentStation, userRole, mockParcels]);

    const shelves = currentStation ? getShelvesByStation(currentStation.id) : [];

    // Filter parcels based on search parameters
    const filteredParcels = useMemo(() => {
        const criteria = {
            recipientName: searchParams.recipientName || undefined,
            phoneNumber: searchParams.phoneNumber || undefined,
            parcelId: searchParams.parcelId || undefined,
            status: searchParams.status || undefined,
            dateFrom: searchParams.startDate || undefined,
            dateTo: searchParams.endDate || undefined,
            shelfLocation: searchParams.shelfLocation || undefined,
            stationId: userRole === "admin" ? undefined : currentStation?.id,
        };

        return searchParcels(parcels, criteria);
    }, [parcels, searchParams, currentStation, userRole]);

    const handleClearFilters = () => {
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

    const handleUpdateShelf = () => {
        if (!selectedParcel || !newShelfLocation || !currentUser) return;

        updateParcelStatus(
            selectedParcel.id,
            selectedParcel.status,
            currentUser.id,
            {
                shelfLocation: newShelfLocation,
            }
        );

        // Refresh parcels
        if (currentStation) {
            const stationParcels = getParcelsByStation(currentStation.id);
            setParcels(stationParcels);
        }

        setEditingShelf(false);
        setSelectedParcel(null);
        alert("Shelf location updated successfully");
    };

    const handleExport = () => {
        const headers = [
            "Parcel ID",
            "Recipient Name",
            "Phone",
            "Address",
            "Shelf",
            "Status",
            "Item Value",
            "Registered Date",
        ];
        const rows = filteredParcels.map((p) => [
            p.id,
            p.recipientName,
            p.recipientPhone,
            p.deliveryAddress || "N/A",
            p.shelfLocation,
            STATUS_CONFIG[p.status]?.label || p.status,
            (p.itemValue || 0).toFixed(2),
            formatDate(p.registeredDate),
        ]);

        const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcels-search-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const uniqueStatuses = [...new Set(parcels.map((p) => p.status))];
    const uniqueShelves = [...new Set(parcels.map((p) => p.shelfLocation))].sort();

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Parcel Search</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Find parcels by recipient, phone, ID, shelf, driver, or date range
                            </p>
                        </div>
                        <Button
                            onClick={handleExport}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export Results
                        </Button>
                    </div>

                    {/* Quick Search Bar */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-[#5d5d5d]" />
                                    <Input
                                        placeholder="Search by recipient name, parcel ID, or phone..."
                                        value={searchParams.recipientName || searchParams.parcelId || searchParams.phoneNumber}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSearchParams((prev) => ({
                                                ...prev,
                                                recipientName: value,
                                                parcelId: value,
                                                phoneNumber: value,
                                            }));
                                        }}
                                        className="pl-10 border border-[#d1d1d1]"
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant={showFilters ? "default" : "outline"}
                                    className={`flex items-center gap-2 ${
                                        showFilters ? "bg-[#ea690c] text-white" : "border border-[#d1d1d1]"
                                    }`}
                                >
                                    <FilterIcon size={18} />
                                    <span className="hidden sm:inline">{showFilters ? "Hide" : "Show"} Filters</span>
                                </Button>
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="mt-6 pt-6 border-t border-[#d1d1d1]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Phone Number Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
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
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={searchParams.status}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        status: e.target.value as ParcelStatus | "",
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">All Status</option>
                                                {uniqueStatuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {STATUS_CONFIG[status]?.label || status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Shelf Location Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
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
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">All Shelves</option>
                                                {uniqueShelves.map((shelf) => (
                                                    <option key={shelf} value={shelf}>
                                                        {shelf}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Driver Name Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Driver Name
                                            </label>
                                            <Input
                                                placeholder="Driver name..."
                                                value={searchParams.driverName}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        driverName: e.target.value,
                                                    }))
                                                }
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        {/* Start Date Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
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
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        {/* End Date Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
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
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button onClick={handleClearFilters} variant="outline" className="border border-[#d1d1d1]">
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Summary */}
                    <div className="text-sm text-[#5d5d5d]">
                        Showing {filteredParcels.length} of {parcels.length} parcel(s)
                    </div>

                    {/* Parcels List */}
                    <div className="grid grid-cols-1 gap-2">
                        {filteredParcels.map((parcel) => {
                            const statusConfig = STATUS_CONFIG[parcel.status] || {
                                label: parcel.status,
                                color: "bg-gray-100 text-gray-800",
                                bgColor: "bg-gray-50",
                            };
                            return (
                                <Card
                                    key={parcel.id}
                                    className="border border-[#d1d1d1] bg-white hover:shadow-sm hover:border-[#ea690c] transition-all cursor-pointer"
                                    onClick={() => {
                                        setSelectedParcel(parcel);
                                        setNewShelfLocation(parcel.shelfLocation);
                                        setEditingShelf(false);
                                    }}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="text-sm font-semibold text-neutral-800 truncate">
                                                        {parcel.recipientName}
                                                    </h3>
                                                    <Badge className={`${statusConfig.color} text-xs px-2 py-0.5 flex-shrink-0`}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-[#5d5d5d] mb-2">{parcel.id}</p>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1.5 text-xs">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <PhoneIcon className="w-3.5 h-3.5 text-[#5d5d5d] flex-shrink-0" />
                                                        <span className="text-neutral-700 truncate">
                                                            {formatPhoneNumber(parcel.recipientPhone)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <MapPin className="w-3.5 h-3.5 text-[#5d5d5d] flex-shrink-0" />
                                                        <span className="text-neutral-700 truncate">
                                                            <strong>{parcel.shelfLocation}</strong>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Clock className="w-3.5 h-3.5 text-[#5d5d5d] flex-shrink-0" />
                                                        <span className="text-neutral-700 truncate">
                                                            {formatDate(parcel.registeredDate)}
                                                        </span>
                                                    </div>
                                                    {parcel.itemValue > 0 && (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <DollarSign className="w-3.5 h-3.5 text-[#ea690c] flex-shrink-0" />
                                                            <span className="text-[#ea690c] font-semibold truncate">
                                                                GHC {parcel.itemValue.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {parcel.driverName && (
                                                        <div className="flex items-center gap-1.5 min-w-0 col-span-2 sm:col-span-1">
                                                            <span className="text-[#5d5d5d] truncate">
                                                                Driver: <strong className="text-neutral-700">{parcel.driverName}</strong>
                                                                {parcel.vehicleNumber && ` (${parcel.vehicleNumber})`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {parcel.itemDescription && (
                                                    <p className="text-xs text-neutral-600 mt-1.5 line-clamp-1 truncate">
                                                        {parcel.itemDescription}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {filteredParcels.length === 0 && (
                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-12 text-center">
                                    <p className="text-neutral-700">No parcels found matching your search criteria.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Shelf Update Modal */}
            {selectedParcel && editingShelf && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-neutral-800">Update Shelf Location</h3>
                                <button
                                    onClick={() => {
                                        setEditingShelf(false);
                                        setSelectedParcel(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Parcel: {selectedParcel.recipientName}
                                    </label>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Current Shelf: {selectedParcel.shelfLocation}
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        New Shelf Location <span className="text-[#e22420]">*</span>
                                    </label>
                                    <select
                                        value={newShelfLocation}
                                        onChange={(e) => setNewShelfLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
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
                    <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                                <button
                                    onClick={() => setSelectedParcel(null)}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Parcel ID</p>
                                        <p className="font-semibold text-neutral-800">{selectedParcel.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Status</p>
                                        <Badge className={STATUS_CONFIG[selectedParcel.status]?.color}>
                                            {STATUS_CONFIG[selectedParcel.status]?.label}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Recipient Name</p>
                                        <p className="font-semibold text-neutral-800">{selectedParcel.recipientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Phone Number</p>
                                        <p className="font-semibold text-neutral-800">
                                            {formatPhoneNumber(selectedParcel.recipientPhone)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Shelf Location</p>
                                        <p className="font-semibold text-neutral-800">{selectedParcel.shelfLocation}</p>
                                    </div>
                                    {selectedParcel.itemValue > 0 && (
                                        <div>
                                            <p className="text-xs text-[#5d5d5d]">Item Value</p>
                                            <p className="font-semibold text-[#ea690c]">
                                                GHC {selectedParcel.itemValue.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {selectedParcel.itemDescription && (
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Item Description</p>
                                        <p className="text-sm text-neutral-700">{selectedParcel.itemDescription}</p>
                                    </div>
                                )}

                                {selectedParcel.deliveryAddress && (
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Delivery Address</p>
                                        <p className="text-sm text-neutral-700">{selectedParcel.deliveryAddress}</p>
                                    </div>
                                )}

                                {selectedParcel.driverName && (
                                    <div>
                                        <p className="text-xs text-[#5d5d5d]">Driver</p>
                                        <p className="text-sm text-neutral-700">
                                            {selectedParcel.driverName}
                                            {selectedParcel.vehicleNumber && ` - ${selectedParcel.vehicleNumber}`}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-[#d1d1d1] flex gap-3">
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
