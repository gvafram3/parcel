import { useState, useEffect } from "react";
import { useStation } from "../../../contexts/StationContext";
import { getShelvesByStation } from "../../../data/mockData";
import { validatePhoneNumber } from "../../../utils/dataHelpers";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { PlusIcon, Package, User, Truck, MapPin, Phone, DollarSign, FileText, Save, X } from "lucide-react";

interface ParcelFormData {
    driverName?: string;
    vehicleNumber?: string;
    recipientName: string;
    recipientPhone: string;
    itemDescription?: string;
    shelfLocation: string;
    itemValue: number;
}

interface InfoSectionProps {
    parcels: ParcelFormData[];
    sessionDriver: { driverName?: string; vehicleNumber?: string } | null;
    onAddParcel: (data: ParcelFormData) => void;
    onSaveAll: () => void;
    onRemoveParcel: (index: number) => void;
    onClearSessionDriver: () => void;
}

export const InfoSection = ({
    parcels = [],
    sessionDriver,
    onAddParcel,
    onSaveAll,
    onRemoveParcel,
    onClearSessionDriver,
}: InfoSectionProps): JSX.Element => {
    const { currentStation } = useStation();
    const shelves = currentStation ? getShelvesByStation(currentStation.id) : [];

    // Form state
    const [driverName, setDriverName] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [shelf, setShelf] = useState("");
    const [itemValue, setItemValue] = useState("");
    const [specialNotes, setSpecialNotes] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [isDriverLocked, setIsDriverLocked] = useState(false);

    // Lock driver fields when session driver is set
    useEffect(() => {
        if (sessionDriver) {
            setDriverName(sessionDriver.driverName || "");
            setVehicleNumber(sessionDriver.vehicleNumber || "");
            setIsDriverLocked(true);
        } else {
            setIsDriverLocked(false);
        }
    }, [sessionDriver]);

    const handlePhoneChange = (digitsOnly: string) => {
        // Only allow digits, limit to 9 digits (Ghana phone number after +233)
        const cleaned = digitsOnly.replace(/\D/g, "").substring(0, 9);
        const fullNumber = "+233" + cleaned;

        setPhoneNumber(fullNumber);
        if (phoneError && validatePhoneNumber(fullNumber)) {
            setPhoneError("");
        }
    };

    const validateForm = (): boolean => {
        if (!recipientName.trim() || !phoneNumber.trim() || !shelf.trim()) {
            return false;
        }
        if (!validatePhoneNumber(phoneNumber)) {
            setPhoneError("Invalid phone number format. Use +233XXXXXXXXX");
            return false;
        }
        return true;
    };

    const handleAddAnotherSameDriver = () => {
        if (!validateForm()) {
            return;
        }

        // Get driver info - use current form values if not locked, otherwise use session driver
        const currentDriverName = isDriverLocked ? sessionDriver?.driverName : driverName.trim();
        const currentVehicleNumber = isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim();

        // Add current parcel to session
        const parcelData: ParcelFormData = {
            driverName: currentDriverName || undefined,
            vehicleNumber: currentVehicleNumber || undefined,
            recipientName: recipientName.trim(),
            recipientPhone: phoneNumber.trim(),
            itemDescription: itemDescription.trim() || undefined,
            shelfLocation: shelf,
            itemValue: itemValue ? parseFloat(itemValue) : 0,
        };

        onAddParcel(parcelData);

        // If this is the first parcel and has driver info, lock the driver for future parcels
        if (parcels.length === 0 && currentDriverName && currentVehicleNumber) {
            setIsDriverLocked(true);
        }

        // Clear only parcel information, keep driver locked
        setRecipientName("");
        setPhoneNumber("");
        setItemDescription("");
        setShelf("");
        setItemValue("");
        setSpecialNotes("");
        setPhoneError("");
    };

    const handleAddNewParcel = () => {
        if (!validateForm()) {
            return;
        }

        // Add current parcel to session
        const parcelData: ParcelFormData = {
            driverName: isDriverLocked ? sessionDriver?.driverName : driverName.trim() || undefined,
            vehicleNumber: isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim() || undefined,
            recipientName: recipientName.trim(),
            recipientPhone: phoneNumber.trim(),
            itemDescription: itemDescription.trim() || undefined,
            shelfLocation: shelf,
            itemValue: itemValue ? parseFloat(itemValue) : 0,
        };

        onAddParcel(parcelData);

        // Clear both driver and parcel information
        setDriverName("");
        setVehicleNumber("");
        setRecipientName("");
        setPhoneNumber("");
        setItemDescription("");
        setShelf("");
        setItemValue("");
        setSpecialNotes("");
        setPhoneError("");
        setIsDriverLocked(false);
        onClearSessionDriver();
    };

    const isFormValid = recipientName.trim() && phoneNumber.trim() && shelf.trim() && !phoneError;

    return (
        <div className="space-y-6">
            {/* Parcels List - Show if parcels exist */}
            {parcels.length > 0 && (
                <Card className="border border-[#d1d1d1] bg-white shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-neutral-800">
                                Parcels Added ({parcels.length})
                            </h3>
                            <Button
                                onClick={onSaveAll}
                                className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save All Parcels
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {parcels.map((parcel, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#d1d1d1]"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-800 text-sm">
                                            {parcel.recipientName}
                                        </p>
                                        <p className="text-xs text-[#5d5d5d]">{parcel.recipientPhone}</p>
                                        {parcel.itemDescription && (
                                            <p className="text-xs text-neutral-700 mt-1">{parcel.itemDescription}</p>
                                        )}
                                        {parcel.driverName && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                Driver: {parcel.driverName} ({parcel.vehicleNumber})
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {parcel.shelfLocation}
                                        </Badge>
                                        {parcel.itemValue > 0 && (
                                            <span className="text-xs font-semibold text-[#ea690c]">
                                                GHC {parcel.itemValue.toFixed(2)}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => onRemoveParcel(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remove parcel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Form */}
            <Card className="w-full border border-[#d1d1d1] bg-white shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#ea690c] rounded-lg">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-800">Add New Parcel</h2>
                            <p className="text-sm text-[#5d5d5d]">
                                {isDriverLocked && sessionDriver
                                    ? `Using driver: ${sessionDriver.driverName}`
                                    : "Fill in the details below"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Driver Information */}
                        <div className="border-b pb-6">
                            <h3 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-[#ea690c]" />
                                Driver Information{" "}
                                {isDriverLocked && sessionDriver ? (
                                    <span className="text-xs font-normal text-blue-600">(Locked - Using session driver)</span>
                                ) : (
                                    <span className="text-xs font-normal text-[#9a9a9a]">(Optional)</span>
                                )}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Driver Name
                                    </Label>
                                    <Input
                                        type="text"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Enter driver name (optional)"
                                        className="w-full"
                                        disabled={isDriverLocked}
                                    />
                                    {isDriverLocked && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Driver info locked for this session
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Vehicle Number
                                    </Label>
                                    <Input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        placeholder="GR-123-24 (optional)"
                                        className="w-full"
                                        disabled={isDriverLocked}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parcel Information */}
                        <div>
                            <h3 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#ea690c]" />
                                Parcel Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Recipient Name <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder="Enter recipient name"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone Number <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                                                +233
                                            </span>
                                            <Input
                                                type="tel"
                                                value={phoneNumber.startsWith("+233") ? phoneNumber.substring(4) : ""}
                                                onChange={(e) => {
                                                    handlePhoneChange(e.target.value);
                                                }}
                                                placeholder="XXXXXXXXX"
                                                className="w-full pl-12"
                                                maxLength={9}
                                            />
                                        </div>
                                        {phoneError && (
                                            <p className="text-xs text-[#e22420] mt-1">{phoneError}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Shelf Location <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <select
                                            value={shelf}
                                            onChange={(e) => setShelf(e.target.value)}
                                            className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                        >
                                            <option value="">Select a shelf</option>
                                            {shelves.map((s) => (
                                                <option key={s.id} value={s.name}>
                                                    {s.name} ({s.parcelCount} parcels)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Item Description <span className="text-xs text-[#9a9a9a] font-normal">(optional)</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            value={itemDescription}
                                            onChange={(e) => setItemDescription(e.target.value)}
                                            placeholder="Enter item description"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Item Value (GHC) <span className="text-xs text-[#9a9a9a] font-normal">(optional)</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={itemValue}
                                            onChange={(e) => setItemValue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Special Notes <span className="text-xs text-[#9a9a9a] font-normal">(optional)</span>
                                        </Label>
                                        <Textarea
                                            value={specialNotes}
                                            onChange={(e) => setSpecialNotes(e.target.value)}
                                            placeholder="Any special notes..."
                                            className="w-full min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Row - Always visible, disabled until form is valid */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                onClick={handleAddAnotherSameDriver}
                                disabled={!isFormValid}
                                variant="outline"
                                className="flex-1 border border-[#d1d1d1] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Another Parcel (Same Driver)
                            </Button>
                            <Button
                                onClick={handleAddNewParcel}
                                disabled={!isFormValid}
                                variant="outline"
                                className="flex-1 border border-[#d1d1d1] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add New Parcel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
