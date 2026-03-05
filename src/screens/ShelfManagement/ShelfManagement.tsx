import { useState, useEffect } from "react";
import { Plus, Trash2, Package, AlertCircleIcon, X, Loader, MapPin, Search, Layers } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { useShelf } from "../../contexts/ShelfContext";
import shelfService, { ApiShelf } from "../../services/shelfService";
import frontdeskService, { ParcelResponse, Address } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import { formatCurrency } from "../../utils/dataHelpers";
import authService from "../../services/authService";

type ParcelType = ParcelResponse;

// Helper function to get manager's office ID
const getManagerOfficeId = (): string | undefined => {
    // Try to get from authService first
    const userData = authService.getUser();
    if (userData && (userData as any).office?.id) {
        return (userData as any).office.id;
    }
    
    // Fallback: check localStorage for full user response (might be stored during login)
    try {
        const storedUser = JSON.parse(localStorage.getItem("user_data") || localStorage.getItem("user") || "{}");
        if (storedUser?.office?.id) {
            return storedUser.office.id;
        }
    } catch (e) {
        console.error("Error reading user data from localStorage:", e);
    }
    
    return undefined;
};

export const ShelfManagement = (): JSX.Element => {
    const { currentStation, currentUser, userRole } = useStation();
    const { shelves, loading, loadShelves, refreshShelves } = useShelf();
    const { showToast } = useToast();
    const [shelfParcelCounts, setShelfParcelCounts] = useState<Record<string, number>>({});
    const [newShelfName, setNewShelfName] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [loadingCounts, setLoadingCounts] = useState(false);

    // Saved addresses (office address presets with cost)
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [newAddressName, setNewAddressName] = useState("");
    const [newAddressCost, setNewAddressCost] = useState<string>("");
    const [addingAddress, setAddingAddress] = useState(false);
    const [addressSearch, setAddressSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"shelves" | "addresses">("shelves");

    // Fetch parcel counts for shelves
    const fetchShelfParcelCounts = async (shelvesList: ApiShelf[]) => {
        if (shelvesList.length === 0) return;

        setLoadingCounts(true);
        try {
            // Fetch all parcels for the station
            const response = await frontdeskService.searchParcels(
                {},
                { page: 0, size: 1000 } // Get a large number to count all parcels
            );

            if (response.success && response.data) {
                const parcels = response.data.content;
                const counts: Record<string, number> = {};

                // Count parcels per shelf
                shelvesList.forEach((shelf) => {
                    counts[shelf.id] = parcels.filter(
                        (p: ParcelType) => p.shelfNumber === shelf.name
                    ).length;
                });

                setShelfParcelCounts(counts);
            }
        } catch (error) {
            console.error("Failed to fetch parcel counts:", error);
        } finally {
            setLoadingCounts(false);
        }
    };

    // Load shelves when station changes or for managers, load their office shelves
    useEffect(() => {
        if (userRole === "MANAGER" && currentUser) {
            // For managers, get office ID from user profile
            const managerOfficeId = getManagerOfficeId();
            if (managerOfficeId) {
                loadShelves(managerOfficeId);
            }
        } else if (userRole === "ADMIN" && currentStation) {
            // For admins, use selected station
            loadShelves(currentStation.id);
        }
    }, [currentStation, currentUser, userRole, loadShelves]);

    // Fetch parcel counts when shelves change
    useEffect(() => {
        if (shelves.length > 0) {
            // For managers, we don't need currentStation - shelves are already filtered by their office
            // For admins, we need currentStation
            if (userRole === "ADMIN" && !currentStation) {
                return;
            }
            fetchShelfParcelCounts(shelves);
        }
    }, [shelves, currentStation, userRole]);

    // Fetch saved addresses (office-scoped via API)
    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const response = await frontdeskService.getAddresses(addressSearch.trim() || undefined);
            if (response.success && Array.isArray(response.data)) {
                setAddresses(response.data);
            } else {
                setAddresses([]);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
            setAddresses([]);
        } finally {
            setLoadingAddresses(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressSearch]);

    const handleAddShelf = async () => {
        if (!newShelfName.trim()) {
            showToast("Please enter a shelf name", "warning");
            return;
        }

        if (!currentUser) {
            showToast("User not authenticated. Please log in again.", "error");
            return;
        }

        // Get office ID based on user role
        let officeId: string | undefined;
        
        if (userRole === "MANAGER") {
            // For managers, use their office ID from their profile
            officeId = getManagerOfficeId();
            
            if (!officeId) {
                showToast("Manager office not found. Please contact administrator.", "error");
                return;
            }
        } else if (userRole === "ADMIN") {
            // For admins, use the selected station
            if (!currentStation) {
                showToast("No station selected. Please select a station first.", "error");
                return;
            }
            if (!currentStation.id) {
                showToast("Invalid station. Please refresh and try again.", "error");
                return;
            }
            officeId = currentStation.id;
        } else {
            showToast("You don't have permission to create shelves.", "error");
            return;
        }

        // Check if shelf name already exists in this station (client-side validation)
        const existingShelf = shelves.find(
            (s) => s.name.toLowerCase() === newShelfName.trim().toLowerCase()
        );
        if (existingShelf) {
            showToast("A shelf with this name already exists in this station.", "warning");
            return;
        }

        setAdding(true);
        try {
            console.log("Attempting to add shelf:", {
                name: newShelfName.trim(),
                officeId: officeId,
                userRole: userRole,
                currentUser: currentUser
            });
            
            const response = await shelfService.addShelf(newShelfName.trim(), officeId);
            
            console.log("Add shelf response:", response);

            if (response.success) {
                showToast(response.message || `Shelf "${newShelfName.trim()}" created successfully!`, "success");
                setNewShelfName("");
                setShowAddModal(false);
                // Refresh shelves list
                await refreshShelves(officeId);
            } else {
                console.error("Add shelf failed:", response.message);
                showToast(response.message || "Failed to create shelf", "error");
            }
        } catch (error) {
            console.error("Add shelf exception:", error);
            showToast("Failed to create shelf. Please try again.", "error");
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteShelf = async (shelfId: string, shelfName: string) => {
        if (!currentStation) return;

        // Check if shelf can be deleted (check parcel count)
        const parcelCount = shelfParcelCounts[shelfId] || 0;
        
        if (parcelCount > 0) {
            showToast(`Cannot delete shelf "${shelfName}". It contains ${parcelCount} parcel(s). Please move or deliver all parcels first.`, "warning");
            setDeleteConfirm(null);
            return;
        }

        // Note: API doesn't have a delete endpoint based on the docs, so we'll just remove from UI
        // If delete endpoint exists, we would call it here
        showToast("Delete functionality is not available via API. Please contact administrator.", "info");
        setDeleteConfirm(null);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setNewShelfName("");
    };

    const handleAddAddress = async () => {
        if (!newAddressName.trim()) {
            showToast("Please enter an address name", "warning");
            return;
        }
        const cost = Number(newAddressCost);
        if (Number.isNaN(cost) || cost < 0) {
            showToast("Please enter a valid cost (0 or more)", "warning");
            return;
        }
        setAddingAddress(true);
        try {
            const response = await frontdeskService.addAddress(newAddressName.trim(), cost);
            if (response.success) {
                showToast(response.message || "Address saved successfully", "success");
                setNewAddressName("");
                setNewAddressCost("");
                setShowAddAddressModal(false);
                fetchAddresses();
            } else {
                showToast(response.message || "Failed to save address", "error");
            }
        } catch (error) {
            console.error("Add address error:", error);
            showToast("Failed to save address. Please try again.", "error");
        } finally {
            setAddingAddress(false);
        }
    };

    const handleCloseAddressModal = () => {
        setShowAddAddressModal(false);
        setNewAddressName("");
        setNewAddressCost("");
    };

    const canManageShelves = userRole === "MANAGER" || userRole === "ADMIN";

    return (
        <div className="w-full min-h-screen bg-gray-50/50">
            <div className="mx-auto max-w-6xl flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* Page header */}
                <header className="space-y-1">
                    <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Shelf and Address</h1>
                    <p className="text-sm text-[#5d5d5d]">
                        {currentStation?.name ?? "Office"} — Manage parcel shelves and delivery address presets
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#d1d1d1] shadow-sm w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab("shelves")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === "shelves"
                                ? "bg-[#ea690c] text-white shadow-sm"
                                : "text-neutral-600 hover:bg-gray-100 hover:text-neutral-800"
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        Shelves
                        {!loading && shelves.length > 0 && (
                            <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                                activeTab === "shelves" ? "bg-white/20" : "bg-gray-200 text-gray-700"
                            }`}>
                                {shelves.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("addresses")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === "addresses"
                                ? "bg-[#ea690c] text-white shadow-sm"
                                : "text-neutral-600 hover:bg-gray-100 hover:text-neutral-800"
                        }`}
                    >
                        <MapPin className="w-4 h-4" />
                        Addresses
                        {!loadingAddresses && addresses.length > 0 && (
                            <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                                activeTab === "addresses" ? "bg-white/20" : "bg-gray-200 text-gray-700"
                            }`}>
                                {addresses.length}
                            </span>
                        )}
                    </button>
                </div>

                <main className="flex-1 space-y-6">

                    {/* Add Shelf Modal */}
                    {showAddModal && canManageShelves && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-lg">
                                <CardContent className="p-6">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 rounded-lg">
                                                <Plus className="w-5 h-5 text-[#ea690c]" />
                                            </div>
                                            <h2 className="text-lg font-bold text-neutral-800">Add New Shelf</h2>
                                        </div>
                                        <button
                                            onClick={handleCloseModal}
                                            className="text-[#5d5d5d] hover:bg-gray-100 p-1 rounded transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Shelf Name/Code <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={newShelfName}
                                                onChange={(e) => setNewShelfName(e.target.value)}
                                                placeholder="e.g., A1, B2, Ground-Left"
                                                className="border border-[#d1d1d1] w-full"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleAddShelf();
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <p className="text-xs text-[#5d5d5d] mt-1">
                                                Enter a unique identifier for this shelf
                                            </p>
                                        </div>
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            onClick={handleCloseModal}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddShelf}
                                            disabled={!newShelfName.trim() || adding}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {adding ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create Shelf"
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Shelves tab content */}
                    {activeTab === "shelves" && (
                        <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 rounded-xl">
                                        <Package className="w-5 h-5 text-[#ea690c]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-neutral-800">Shelves</h2>
                                        <p className="text-xs text-[#5d5d5d]">
                                            Parcel storage locations for this office
                                        </p>
                                    </div>
                                    {!loading && shelves.length > 0 && (
                                        <Badge className="bg-orange-100 text-orange-800 border-0 font-semibold">
                                            {shelves.length}
                                        </Badge>
                                    )}
                                </div>
                                {canManageShelves && (
                                    <Button
                                        onClick={() => setShowAddModal(true)}
                                        className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2 shrink-0"
                                    >
                                        <Plus size={18} />
                                        Add Shelf
                                    </Button>
                                )}
                            </div>
                            <CardContent className="p-6">
                    {loading ? (
                        <div className="py-16 text-center">
                            <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                            <p className="text-sm text-neutral-700">Loading shelves...</p>
                        </div>
                    ) : shelves.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
                                <Package className="w-14 h-14 text-[#9a9a9a]" />
                            </div>
                            <p className="text-neutral-800 font-semibold">No shelves yet</p>
                            <p className="text-sm text-[#5d5d5d] mt-1 max-w-sm mx-auto">
                                {canManageShelves
                                    ? "Create your first shelf to organize parcels by location."
                                    : "No shelves available in this station."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shelves.map((shelf) => {
                                // Get parcel count for this shelf
                                const parcelCount = shelfParcelCounts[shelf.id] || 0;
                                const canDelete = parcelCount === 0;
                                const isDeleting = deleteConfirm === shelf.id;

                                return (
                                    <Card
                                        key={shelf.id}
                                        className="border border-[#d1d1d1] bg-white hover:shadow-md transition-shadow"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-orange-50 rounded-lg">
                                                        <Package className="w-6 h-6 text-[#ea690c]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-neutral-800">{shelf.name}</h3>
                                                        <p className="text-xs text-[#5d5d5d]">ID: {shelf.id}</p>
                                                    </div>
                                                </div>
                                                {canManageShelves && (
                                                    <div className="flex gap-1">
                                                        {!isDeleting && canDelete && (
                                                            <button
                                                                onClick={() => setDeleteConfirm(shelf.id)}
                                                                className="text-[#e22420] hover:bg-red-50 p-2 rounded transition-colors"
                                                                title="Delete shelf"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                        {isDeleting && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDeleteShelf(shelf.id, shelf.name)}
                                                                    className="text-[#e22420] hover:bg-red-50 p-1 rounded text-xs font-semibold"
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="text-[#5d5d5d] hover:bg-gray-50 p-1 rounded text-xs"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[#5d5d5d]">Current Parcels</span>
                                                    {loadingCounts ? (
                                                        <Loader className="w-4 h-4 animate-spin text-[#5d5d5d]" />
                                                    ) : (
                                                        <Badge
                                                            className={
                                                                parcelCount > 0
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }
                                                        >
                                                            {parcelCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {shelf.office && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-[#5d5d5d]">Office</span>
                                                        <span className="text-xs text-neutral-700">
                                                            {shelf.office.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {!canDelete && parcelCount > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-[#d1d1d1]">
                                                        <div className="flex items-center gap-2 text-xs text-orange-600">
                                                            <AlertCircleIcon className="w-4 h-4" />
                                                            <span>Contains {parcelCount} parcel(s)</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Addresses tab content */}
                    {activeTab === "addresses" && (
                        <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-xl">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-neutral-800">Saved Addresses</h2>
                                        <p className="text-xs text-[#5d5d5d]">
                                            Delivery address presets with cost for this office
                                        </p>
                                    </div>
                                    {!loadingAddresses && addresses.length > 0 && (
                                        <Badge className="bg-blue-100 text-blue-800 border-0 font-semibold">
                                            {addresses.length}
                                        </Badge>
                                    )}
                                </div>
                                {canManageShelves && (
                                    <Button
                                        onClick={() => setShowAddAddressModal(true)}
                                        className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2 shrink-0"
                                    >
                                        <Plus size={18} />
                                        Add Address
                                    </Button>
                                )}
                            </div>
                            <CardContent className="p-6">
                                <div className="mb-4">
                                    <div className="relative max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={addressSearch}
                                            onChange={(e) => setAddressSearch(e.target.value)}
                                            placeholder="Search by address name..."
                                            className="pl-9 border border-[#d1d1d1] rounded-lg bg-gray-50/50 focus:bg-white"
                                        />
                                    </div>
                                </div>
                                {loadingAddresses ? (
                                    <div className="py-16 text-center">
                                        <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                        <p className="text-sm text-[#5d5d5d]">Loading addresses...</p>
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
                                            <MapPin className="w-14 h-14 text-[#9a9a9a]" />
                                        </div>
                                        <p className="text-neutral-800 font-semibold">No saved addresses</p>
                                        <p className="text-sm text-[#5d5d5d] mt-1 max-w-sm mx-auto">
                                            {canManageShelves
                                                ? "Add address presets to reuse name and delivery cost when registering parcels."
                                                : "No addresses saved for this office."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-[#d1d1d1] overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Address name
                                                    </th>
                                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Cost
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {addresses.map((addr) => (
                                                    <tr key={addr.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                                                        <td className="py-3.5 px-4 text-sm font-medium text-neutral-800">
                                                            {addr.name}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-sm text-right font-semibold text-[#ea690c]">
                                                            {formatCurrency(addr.cost)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Add Address Modal */}
                    {showAddAddressModal && canManageShelves && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h2 className="text-lg font-bold text-neutral-800">Add Address</h2>
                                        </div>
                                        <button
                                            onClick={handleCloseAddressModal}
                                            className="text-[#5d5d5d] hover:bg-gray-100 p-1 rounded transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Address name <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={newAddressName}
                                                onChange={(e) => setNewAddressName(e.target.value)}
                                                placeholder="e.g. East Legon, Adenta"
                                                className="border border-[#d1d1d1] w-full"
                                                onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Cost (GHC)
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={newAddressCost}
                                                onChange={(e) => setNewAddressCost(e.target.value)}
                                                placeholder="0"
                                                className="border border-[#d1d1d1] w-full"
                                                onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            onClick={handleCloseAddressModal}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddAddress}
                                            disabled={!newAddressName.trim() || addingAddress}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                        >
                                            {addingAddress ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Address"
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
