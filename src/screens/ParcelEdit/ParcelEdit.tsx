import { useState, useEffect } from "react";
import { SearchIcon, Loader, X, Save, Package, User, Truck, MapPin, DollarSign, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { useStation } from "../../contexts/StationContext";
import { useShelf } from "../../contexts/ShelfContext";
import { formatPhoneNumber } from "../../utils/dataHelpers";
import frontdeskService, { ParcelResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import authService from "../../services/authService";
import { useFrontdeskParcel } from "../../contexts/FrontdeskParcelContext";

export const ParcelEdit = (): JSX.Element => {
    const { currentStation, currentUser, userRole } = useStation();
    const { shelves, loadShelves } = useShelf();
    const { showToast } = useToast();
    const {
        parcels,
        loading,
        pagination,
        loadParcelsIfNeeded,
        refreshParcels
    } = useFrontdeskParcel();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        driverPhoneNumber: "",
        driverName: "",
        vehicleNumber: "",
        senderPhoneNumber: "",
        senderName: "",
        receiverName: "",
        recieverPhoneNumber: "",
        receiverAddress: "",
        parcelDescription: "",
        inboundCost: "",
        pickUpCost: "",
        deliveryCost: "",
        storageCost: "",
        shelfNumber: "",
        pod: false,
        delivered: false,
        parcelAssigned: false,
        fragile: false,
        hasCalled: false,
        homeDelivery: false,
    });

    // Load parcels on mount
    useEffect(() => {
        const hasCache = parcels.length > 0;
        loadParcelsIfNeeded({}, pagination.page, pagination.size, !hasCache);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load shelves using office ID from user data
    useEffect(() => {
        const userData = authService.getUser();
        const officeId = (userData as any)?.office?.id;

        if (officeId) {
            loadShelves(officeId);
        } else if (currentStation && userRole === "ADMIN") {
            loadShelves(currentStation.id);
        }
    }, [currentStation, userRole, loadShelves]);

    // Filter parcels based on search
    const filteredParcels = parcels.filter((p) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.parcelId?.toLowerCase().includes(term) ||
            p.receiverName?.toLowerCase().includes(term) ||
            p.senderName?.toLowerCase().includes(term) ||
            p.recieverPhoneNumber?.includes(term) ||
            p.senderPhoneNumber?.includes(term) ||
            p.driverName?.toLowerCase().includes(term)
        );
    });

    const handleSelectParcel = (parcel: ParcelResponse) => {
        setSelectedParcel(parcel);
        setFormData({
            driverPhoneNumber: parcel.driverPhoneNumber || "",
            driverName: parcel.driverName || "",
            vehicleNumber: parcel.vehicleNumber || "",
            senderPhoneNumber: parcel.senderPhoneNumber || "",
            senderName: parcel.senderName || "",
            receiverName: parcel.receiverName || "",
            recieverPhoneNumber: parcel.recieverPhoneNumber || "",
            receiverAddress: parcel.receiverAddress || "",
            parcelDescription: parcel.parcelDescription || "",
            inboundCost: parcel.inboundCost?.toString() || "",
            pickUpCost: parcel.pickUpCost?.toString() || "",
            deliveryCost: parcel.deliveryCost?.toString() || "",
            storageCost: parcel.storageCost?.toString() || "",
            shelfNumber: parcel.shelfNumber || "",
            pod: parcel.pod || false,
            delivered: parcel.delivered || false,
            parcelAssigned: parcel.parcelAssigned || false,
            fragile: parcel.fragile || false,
            hasCalled: parcel.hasCalled || false,
            homeDelivery: parcel.homeDelivery || false,
        });
        setShowEditModal(true);
    };

    const handleSave = async () => {
        if (!selectedParcel) return;

        setSaving(true);
        try {
            const updateData: any = {};

            // Only include fields that have values or are explicitly set
            if (formData.driverPhoneNumber) updateData.driverPhoneNumber = formData.driverPhoneNumber;
            if (formData.driverName) updateData.driverName = formData.driverName;
            if (formData.vehicleNumber) updateData.vehicleNumber = formData.vehicleNumber;
            if (formData.senderPhoneNumber) updateData.senderPhoneNumber = formData.senderPhoneNumber;
            if (formData.senderName) updateData.senderName = formData.senderName;
            if (formData.receiverName) updateData.receiverName = formData.receiverName;
            if (formData.recieverPhoneNumber) updateData.recieverPhoneNumber = formData.recieverPhoneNumber;
            if (formData.receiverAddress) updateData.receiverAddress = formData.receiverAddress;
            if (formData.parcelDescription) updateData.parcelDescription = formData.parcelDescription;

            // Numeric fields
            if (formData.inboundCost) updateData.inboundCost = parseFloat(formData.inboundCost);
            if (formData.pickUpCost) updateData.pickUpCost = parseFloat(formData.pickUpCost);
            if (formData.deliveryCost) updateData.deliveryCost = parseFloat(formData.deliveryCost);
            if (formData.storageCost) updateData.storageCost = parseFloat(formData.storageCost);

            // Shelf
            if (formData.shelfNumber) updateData.shelfNumber = formData.shelfNumber;

            // Boolean fields
            updateData.pod = formData.pod;
            updateData.delivered = formData.delivered;
            updateData.parcelAssigned = formData.parcelAssigned;
            updateData.fragile = formData.fragile;
            updateData.hasCalled = formData.hasCalled;
            updateData.homeDelivery = formData.homeDelivery;

            const response = await frontdeskService.updateParcel(selectedParcel.parcelId, updateData);

            if (response.success) {
                showToast(`Parcel ${selectedParcel.parcelId} updated successfully`, "success");
                await refreshParcels({}, pagination.page, pagination.size);
                setShowEditModal(false);
                setSelectedParcel(null);
            } else {
                showToast(response.message || "Failed to update parcel", "error");
            }
        } catch (error) {
            console.error("Update parcel error:", error);
            showToast("Failed to update parcel. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-neutral-800">Edit Parcels</h1>
                            <p className="text-xs text-[#5d5d5d] mt-0.5">
                                Search and edit parcel information (Manager Only)
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9a9a9a] w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by Parcel ID, Recipient Name, Phone, or Driver Name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border border-[#d1d1d1]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcels List */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                </div>
                            ) : filteredParcels.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm text-[#5d5d5d]">
                                        {searchTerm ? "No parcels found matching your search" : "No parcels available"}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-[#d1d1d1]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Recipient
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                            {filteredParcels.map((parcel) => (
                                                <tr key={parcel.parcelId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <p className="text-sm text-neutral-800">{parcel.receiverName || "N/A"}</p>
                                                        {parcel.senderName && (
                                                            <p className="text-xs text-[#5d5d5d]">From: {parcel.senderName}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <p className="text-sm text-neutral-700">
                                                            {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            {parcel.delivered ? (
                                                                <Badge className="bg-green-100 text-green-800 text-xs">Delivered</Badge>
                                                            ) : parcel.parcelAssigned ? (
                                                                <Badge className="bg-blue-100 text-blue-800 text-xs">Assigned</Badge>
                                                            ) : parcel.hasCalled ? (
                                                                <Badge className="bg-orange-100 text-orange-800 text-xs">Contacted</Badge>
                                                            ) : (
                                                                <Badge className="bg-gray-100 text-gray-800 text-xs">Registered</Badge>
                                                            )}
                                                            {parcel.homeDelivery && (
                                                                <Badge className="bg-purple-100 text-purple-800 text-xs">Home Delivery</Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 whitespace-nowrap text-center">
                                                        <Button
                                                            onClick={() => handleSelectParcel(parcel)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border border-[#ea690c] text-[#ea690c] hover:bg-orange-50 text-xs h-7 px-3"
                                                        >
                                                            Edit
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl border border-[#d1d1d1] bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-800">Edit Parcel</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-1">Parcel ID: {selectedParcel.parcelId}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedParcel(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800 transition-colors p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Sender Information */}
                                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-sm font-bold text-blue-900">Sender Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Sender Name
                                            </Label>
                                            <Input
                                                value={formData.senderName}
                                                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                                placeholder="Enter sender name"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Sender Phone
                                            </Label>
                                            <Input
                                                value={formData.senderPhoneNumber}
                                                onChange={(e) => setFormData({ ...formData, senderPhoneNumber: e.target.value })}
                                                placeholder="Enter sender phone"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recipient Information */}
                                <div className="bg-white p-5 rounded-lg border border-[#d1d1d1]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5 text-[#ea690c]" />
                                        <h4 className="text-sm font-bold text-neutral-800">Recipient Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Recipient Name
                                            </Label>
                                            <Input
                                                value={formData.receiverName}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, receiverName: e.target.value })
                                                }
                                                placeholder="Enter recipient name"
                                                className="border border-[#d1d1d1]"
                                            />
                                            <p className="text-xs text-[#5d5d5d] mt-1">
                                                You can update the recipient name if needed
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Recipient Phone
                                            </Label>
                                            <Input
                                                value={formData.recieverPhoneNumber}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, recieverPhoneNumber: e.target.value })
                                                }
                                                placeholder="Enter recipient phone"
                                                className="border border-[#d1d1d1]"
                                            />
                                            <p className="text-xs text-[#5d5d5d] mt-1">
                                                You can update the recipient phone number if needed
                                            </p>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                Delivery Address
                                            </Label>
                                            <Input
                                                value={formData.receiverAddress}
                                                onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                                                placeholder="Enter delivery address"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Driver Information */}
                                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Truck className="w-5 h-5 text-green-600" />
                                        <h4 className="text-sm font-bold text-green-900">Driver Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Driver Name
                                            </Label>
                                            <Input
                                                value={formData.driverName}
                                                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                                placeholder="Enter driver name"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Driver Phone
                                            </Label>
                                            <Input
                                                value={formData.driverPhoneNumber}
                                                onChange={(e) => setFormData({ ...formData, driverPhoneNumber: e.target.value })}
                                                placeholder="Enter driver phone"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Vehicle Number
                                            </Label>
                                            <Input
                                                value={formData.vehicleNumber}
                                                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                                placeholder="Enter vehicle number"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Parcel Details */}
                                <div className="bg-white p-5 rounded-lg border border-[#d1d1d1]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-[#ea690c]" />
                                        <h4 className="text-sm font-bold text-neutral-800">Parcel Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                Parcel Description
                                            </Label>
                                            <textarea
                                                value={formData.parcelDescription}
                                                onChange={(e) => setFormData({ ...formData, parcelDescription: e.target.value })}
                                                placeholder="Enter parcel description"
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Shelf Location
                                            </Label>
                                            <select
                                                value={formData.shelfNumber}
                                                onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })}
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">Select shelf</option>
                                                {shelves.map((shelf) => (
                                                    <option key={shelf.id} value={shelf.name}>
                                                        {shelf.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Costs */}
                                <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <DollarSign className="w-5 h-5 text-[#ea690c]" />
                                        <h4 className="text-sm font-bold text-orange-900">Costs (GHC)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Inbound Cost
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.inboundCost}
                                                onChange={(e) => setFormData({ ...formData, inboundCost: e.target.value })}
                                                placeholder="0.00"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Pick Up Cost
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.pickUpCost}
                                                onChange={(e) => setFormData({ ...formData, pickUpCost: e.target.value })}
                                                placeholder="0.00"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Delivery Cost
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.deliveryCost}
                                                onChange={(e) => setFormData({ ...formData, deliveryCost: e.target.value })}
                                                placeholder="0.00"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2 block">
                                                Storage Cost
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.storageCost}
                                                onChange={(e) => setFormData({ ...formData, storageCost: e.target.value })}
                                                placeholder="0.00"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Flags */}
                                <div className="bg-gray-50 p-5 rounded-lg border border-[#d1d1d1]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-gray-600" />
                                        <h4 className="text-sm font-bold text-neutral-800">Status Flags</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">Fragile</Label>
                                            <Switch
                                                checked={formData.fragile}
                                                onCheckedChange={(checked) => setFormData({ ...formData, fragile: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">POD</Label>
                                            <Switch
                                                checked={formData.pod}
                                                onCheckedChange={(checked) => setFormData({ ...formData, pod: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">Delivered</Label>
                                            <Switch
                                                checked={formData.delivered}
                                                onCheckedChange={(checked) => setFormData({ ...formData, delivered: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">Assigned</Label>
                                            <Switch
                                                checked={formData.parcelAssigned}
                                                onCheckedChange={(checked) => setFormData({ ...formData, parcelAssigned: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">Has Called</Label>
                                            <Switch
                                                checked={formData.hasCalled}
                                                onCheckedChange={(checked) => setFormData({ ...formData, hasCalled: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#d1d1d1]">
                                            <Label className="text-sm font-semibold text-neutral-800">Home Delivery</Label>
                                            <Switch
                                                checked={formData.homeDelivery}
                                                onCheckedChange={(checked) =>
                                                    setFormData({
                                                        ...formData,
                                                        homeDelivery: checked,
                                                        ...(checked ? { hasCalled: true } : {}),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4 border-t border-[#d1d1d1]">
                                    <Button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedParcel(null);
                                        }}
                                        variant="outline"
                                        className="flex-1 border-2 border-[#d1d1d1] hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
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

