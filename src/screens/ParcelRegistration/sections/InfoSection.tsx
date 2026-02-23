import { useState, useEffect } from "react";
import { useShelf } from "../../../contexts/ShelfContext";
import authService from "../../../services/authService";
import { validatePhoneNumber, normalizePhoneNumber } from "../../../utils/dataHelpers";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";
import { PlusIcon, Package, User, Truck, FileText, Save, X } from "lucide-react";
import { CostInput } from "../../../components/ui/CostInput";

interface ParcelFormData {
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    senderName?: string;
    senderPhone?: string;
    recipientName: string;
    recipientPhone: string;
    receiverAddress?: string;
    itemDescription?: string;
    shelfLocation: string; // Stores shelf ID
    shelfName?: string; // Stores shelf name for display
    itemValue: number;
    pickUpCost?: number;
    homeDelivery?: boolean;
    deliveryCost?: number;
    hasCalled?: boolean;
}

interface InfoSectionProps {
    parcels: ParcelFormData[];
    sessionDriver: { driverName?: string; driverPhone?: string; vehicleNumber?: string } | null;
    onAddParcel: (data: ParcelFormData) => void;
    onSaveAll: (additionalParcel?: ParcelFormData) => void;
    onRemoveParcel: (index: number) => void;
    isSaving?: boolean;
}

// Common parcel description presets for quick selection
const ITEM_DESCRIPTION_PRESETS: string[] = [
    // Envelopes & documents
    "White envelope",
    "Brown envelope",
    "Manila envelope",
    "Document parcel",
    "Contract documents",

    // Poly bags by color
    "Black poly bag",
    "White poly bag",
    "Blue poly bag",
    "Red poly bag",
    "Green poly bag",
    "Yellow poly bag",
    "Pink poly bag",
    "Purple poly bag",
    "Orange poly bag",
    "Grey poly bag",
    "Transparent poly bag",
    "Striped poly bag",

    // Boxes and cartons
    "Small box",
    "Medium box",
    "Large box",
    "Electronics box",
    "Shoe box",
    "Gift box",

    // Sacks and bags
    "Sack",
    "Jute sack",
    "Rice sack",
    "Laundry bag",

    // Typical contents
    "Clothing",
    "Shoes",
    "Electronics",
    "Food item",
    "Groceries",
    "Cosmetics",
    "Medicine",
    "Stationery",
];

export const InfoSection = ({
    parcels = [],
    sessionDriver,
    onAddParcel,
    onSaveAll,
    onRemoveParcel,
    isSaving = false,
}: InfoSectionProps): JSX.Element => {
    const { shelves, loadShelves } = useShelf();

    // Load shelves using office ID from user data
    useEffect(() => {
        const userData = authService.getUser();
        const officeId = (userData as any)?.office?.id;

        if (officeId) {
            loadShelves(officeId);
        } else {
            console.warn("Office ID not found. Cannot load shelves.");
        }
    }, [loadShelves]);

    // Form state
    const [driverName, setDriverName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [senderName, setSenderName] = useState("");
    const [senderPhone, setSenderPhone] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [shelf, setShelf] = useState("");
    const [itemValue, setItemValue] = useState<number | undefined>(undefined);
    const [homeDelivery, setHomeDelivery] = useState(false);
    const [deliveryCost, setDeliveryCost] = useState<number | undefined>(undefined);
    const [specialNotes, setSpecialNotes] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [isDriverLocked, setIsDriverLocked] = useState(false);

    // Lock driver fields when session driver is set
    useEffect(() => {
        if (sessionDriver) {
            setDriverName(sessionDriver.driverName || "");
            setVehicleNumber(sessionDriver.vehicleNumber || "");
            setDriverPhone(sessionDriver.driverPhone || "");
            setIsDriverLocked(true);
        } else {
            setIsDriverLocked(false);
        }
    }, [sessionDriver]);

    // Clear form fields after successful save (when parcels and sessionDriver are cleared)
    useEffect(() => {
        if (parcels.length === 0 && !sessionDriver) {
            // Successful save completed - clear all form fields
            setRecipientName("");
            setPhoneNumber("");
            setReceiverAddress("");
            setSenderName("");
            setSenderPhone("");
            setItemDescription("");
            setShelf("");
            setItemValue(undefined);
            setHomeDelivery(false);
            setDeliveryCost(undefined);
            setSpecialNotes("");
            setPhoneError("");
            setDriverName("");
            setDriverPhone("");
            setVehicleNumber("");
            setIsDriverLocked(false);
        }
    }, [parcels.length, sessionDriver]);

    const handlePhoneChange = (input: string) => {
        // Allow digits only, up to 10 digits (can start with 0)
        const digits = input.replace(/\D/g, "").substring(0, 10);

        // Normalize: remove leading 0 and add +233
        const normalized = normalizePhoneNumber(digits);

        setPhoneNumber(normalized);
        if (phoneError && validatePhoneNumber(normalized)) {
            setPhoneError("");
        }
    };

    const validateForm = (): boolean => {
        // Validate required driver fields
        const currentDriverName = isDriverLocked ? sessionDriver?.driverName : driverName.trim();
        const currentDriverPhone = isDriverLocked ? sessionDriver?.driverPhone : driverPhone.trim();
        const currentVehicleNumber = isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim();

        if (!currentDriverName || !currentVehicleNumber) {
            setPhoneError("Driver Name and Vehicle Number are required");
            return false;
        }
        if (!currentDriverPhone) {
            setPhoneError("Driver Phone is required");
            return false;
        }
        if (!validatePhoneNumber(currentDriverPhone)) {
            setPhoneError("Invalid driver phone number format. Use 0XXXXXXXXX or XXXXXXXXX");
            return false;
        }

        // Validate recipient fields
        if (!recipientName.trim() || !phoneNumber.trim() || !shelf.trim()) {
            setPhoneError("Recipient Name, Phone, and Shelf Location are required");
            return false;
        }
        if (!validatePhoneNumber(phoneNumber)) {
            setPhoneError("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX");
            return false;
        }
        // Validate sender phone if sender name is provided
        if (senderName.trim() && !senderPhone.trim()) {
            setPhoneError("Sender phone number is required when sender name is provided");
            return false;
        }
        if (senderPhone.trim() && !validatePhoneNumber(senderPhone)) {
            setPhoneError("Invalid sender phone number format. Use 0XXXXXXXXX or XXXXXXXXX");
            return false;
        }
        // Validate delivery cost if home delivery is enabled
        if (homeDelivery && (deliveryCost === undefined || deliveryCost <= 0)) {
            setPhoneError("Delivery cost is required when home delivery is enabled");
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
        const currentDriverPhone = isDriverLocked ? sessionDriver?.driverPhone : driverPhone.trim();
        const currentVehicleNumber = isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim();

        // Find shelf name for display
        const selectedShelf = shelves.find(s => s.id === shelf);

        // Add current parcel to session
        const parcelData: ParcelFormData = {
            driverName: currentDriverName || undefined,
            driverPhone: currentDriverPhone || undefined,
            vehicleNumber: currentVehicleNumber || undefined,
            senderName: senderName.trim() || undefined,
            senderPhone: senderPhone.trim() || undefined,
            recipientName: recipientName.trim(),
            recipientPhone: phoneNumber.trim(),
            receiverAddress: receiverAddress.trim() || undefined,
            itemDescription: itemDescription.trim() || undefined,
            shelfLocation: shelf, // Store shelf ID
            shelfName: selectedShelf?.name, // Store shelf name for display
            itemValue: itemValue ?? 0,
            pickUpCost: 0, // Default to 0
            homeDelivery: homeDelivery,
            deliveryCost: homeDelivery && deliveryCost != null ? deliveryCost : undefined,
            hasCalled: homeDelivery ? true : undefined,
        };

        onAddParcel(parcelData);

        // If this is the first parcel and has driver info, lock the driver for future parcels
        if (parcels.length === 0 && currentDriverName && currentVehicleNumber) {
            setIsDriverLocked(true);
        }

        // Clear only parcel information, keep driver locked
        setRecipientName("");
        setPhoneNumber("");
        setReceiverAddress("");
        setSenderName("");
        setSenderPhone("");
        setItemDescription("");
        setShelf("");
        setItemValue(undefined);
        setHomeDelivery(false);
        setDeliveryCost(undefined);
        setSpecialNotes("");
        setPhoneError("");
    };

    const handleSaveDirectly = () => {
        if (!validateForm()) {
            return;
        }

        // Find shelf name for display
        const selectedShelf = shelves.find(s => s.id === shelf);

        // Get driver info - use current form values if not locked, otherwise use session driver
        const currentDriverName = isDriverLocked ? sessionDriver?.driverName : driverName.trim();
        const currentDriverPhone = isDriverLocked ? sessionDriver?.driverPhone : driverPhone.trim();
        const currentVehicleNumber = isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim();

        // Create parcel data from current form
        const parcelData: ParcelFormData = {
            driverName: currentDriverName || undefined,
            driverPhone: currentDriverPhone || undefined,
            vehicleNumber: currentVehicleNumber || undefined,
            senderName: senderName.trim() || undefined,
            senderPhone: senderPhone.trim() || undefined,
            recipientName: recipientName.trim(),
            recipientPhone: phoneNumber.trim(),
            receiverAddress: receiverAddress.trim() || undefined,
            itemDescription: itemDescription.trim() || undefined,
            shelfLocation: shelf, // Store shelf ID
            shelfName: selectedShelf?.name, // Store shelf name for display
            itemValue: itemValue ?? 0,
            pickUpCost: 0, // Default to 0
            homeDelivery: homeDelivery,
            deliveryCost: homeDelivery && deliveryCost != null ? deliveryCost : undefined,
            hasCalled: homeDelivery ? true : undefined,
        };

        // Save all parcels (including current form data)
        // Note: Fields are cleared by parent component on successful save
        // Do not clear fields here to preserve data on error
        onSaveAll(parcelData);
        setRecipientName("");
        setPhoneNumber("");
        setReceiverAddress("");
        setSenderName("");
        setSenderPhone("");
        setItemDescription("");
        setShelf("");
        setItemValue(undefined);
        setHomeDelivery(false);
        setDeliveryCost(undefined);
        setSpecialNotes("");
        setPhoneError("");
    };

    // Check if driver fields are filled (considering locked state)
    const currentDriverName = isDriverLocked ? sessionDriver?.driverName : driverName.trim();
    const currentDriverPhone = isDriverLocked ? sessionDriver?.driverPhone : driverPhone.trim();
    const currentVehicleNumber = isDriverLocked ? sessionDriver?.vehicleNumber : vehicleNumber.trim();
    const isFormValid =
        currentDriverName &&
        currentDriverPhone &&
        currentVehicleNumber &&
        recipientName.trim() &&
        phoneNumber.trim() &&
        shelf.trim() &&
        !phoneError &&
        (!homeDelivery || (deliveryCost != null && deliveryCost > 0));

    return (
        <div className="space-y-4">
            {/* Parcels List - Show if parcels exist */}
            {parcels.length > 0 && (
                <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-neutral-800">
                                Parcels Added ({parcels.length})
                            </h3>
                            <Button
                                onClick={() => onSaveAll()}
                                disabled={isSaving}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? "Saving..." : "Save All Parcels"}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {parcels.map((parcel, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#d1d1d1] hover:bg-gray-100 transition-colors"
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
                                        {parcel.homeDelivery && (
                                            <p className="text-xs text-green-600 mt-1 font-semibold">
                                                🏠 Home Delivery - GHC {parcel.deliveryCost?.toFixed(2) || "0.00"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {parcel.shelfName || parcel.shelfLocation}
                                        </Badge>
                                        {parcel.itemValue > 0 && (
                                            <span className="text-xs font-semibold text-[#ea690c]">
                                                GHC {parcel.itemValue.toFixed(2)}
                                            </span>
                                        )}
                                        {parcel.homeDelivery && (
                                            <Badge className="bg-green-100 text-green-800">
                                                Home Delivery
                                            </Badge>
                                        )}
                                        <button
                                            onClick={() => onRemoveParcel(index)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
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
            <Card className="w-full border border-[#d1d1d1] bg-white shadow-sm ">
                <CardContent className="p-4 sm:p-6">
                    <div className="mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-neutral-800 mb-1">Add New Parcel</h2>
                        <p className="text-xs sm:text-sm text-[#5d5d5d]">
                            {isDriverLocked && sessionDriver
                                ? `Using driver: ${sessionDriver.driverName}`
                                : "Fill in the details below to register a new parcel"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Driver Information Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#d1d1d1]">
                                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#ea690c]" />
                                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">
                                    Driver Information
                                </h3>
                                {isDriverLocked && sessionDriver ? (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                                        Locked
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-[#9a9a9a] ml-2">(Optional)</span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-sm font-semibold text-neutral-800">
                                            Driver Name
                                        </Label>
                                        <span className="text-sm font-semibold text-[#e22420]">*</span>
                                    </div>
                                    <Input
                                        type="text"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Enter driver name"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                        disabled={isDriverLocked}
                                        required
                                    />
                                    {isDriverLocked && (
                                        <p className="text-xs text-blue-600">
                                            Driver info locked for this session
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-sm font-semibold text-neutral-800">
                                            Driver Phone
                                        </Label>
                                        <span className="text-sm font-semibold text-[#e22420]">*</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                                            +233
                                        </span>
                                        <Input
                                            type="tel"
                                            value={driverPhone.startsWith("+233") ? driverPhone.substring(4) : driverPhone}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                                                const normalized = normalizePhoneNumber(digits);
                                                setDriverPhone(normalized);
                                                if (phoneError && validatePhoneNumber(normalized)) {
                                                    setPhoneError("");
                                                }
                                            }}
                                            placeholder="0XXXXXXXXX or XXXXXXXXX"
                                            className="pl-14 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                                            maxLength={10}
                                            disabled={isDriverLocked}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-sm font-semibold text-neutral-800">
                                            Vehicle Number
                                        </Label>
                                        <span className="text-sm font-semibold text-[#e22420]">*</span>
                                    </div>
                                    <Input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        placeholder="GR-123-24"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                        disabled={isDriverLocked}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sender Information Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#d1d1d1]">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#ea690c]" />
                                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">
                                    Sender Information
                                </h3>
                                <span className="text-xs text-[#9a9a9a] ml-2">(Optional)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Sender Name
                                    </Label>
                                    <Input
                                        type="text"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="Enter sender name"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Sender Phone
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                                            +233
                                        </span>
                                        <Input
                                            type="tel"
                                            value={senderPhone.startsWith("+233") ? senderPhone.substring(4) : senderPhone}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                                                const normalized = normalizePhoneNumber(digits);
                                                setSenderPhone(normalized);
                                            }}
                                            placeholder="0XXXXXXXXX or XXXXXXXXX"
                                            className="pl-14 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Receiver Information Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#d1d1d1]">
                                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#ea690c]" />
                                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">
                                    Receiver Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Recipient Name <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="Enter recipient name"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Phone Number <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                                            +233
                                        </span>
                                        <Input
                                            type="tel"
                                            value={phoneNumber.startsWith("+233") ? phoneNumber.substring(4) : phoneNumber}
                                            onChange={(e) => {
                                                handlePhoneChange(e.target.value);
                                            }}
                                            placeholder="0XXXXXXXXX or XXXXXXXXX"
                                            className="pl-14 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                    {phoneError && (
                                        <p className="text-xs text-[#e22420] mt-1">{phoneError}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Receiver Address
                                    </Label>
                                    <Input
                                        type="text"
                                        value={receiverAddress}
                                        onChange={(e) => setReceiverAddress(e.target.value)}
                                        placeholder="Enter receiver address"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parcel Details Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#d1d1d1]">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#ea690c]" />
                                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">
                                    Parcel Details
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Item Description
                                    </Label>
                                    <Input
                                        type="text"
                                        list="itemDescriptionOptions"
                                        value={itemDescription}
                                        onChange={(e) => setItemDescription(e.target.value)}
                                        placeholder="Select or type description"
                                        className="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                    />
                                    <datalist id="itemDescriptionOptions">
                                        {ITEM_DESCRIPTION_PRESETS.map((preset) => (
                                            <option key={preset} value={preset} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Shelf Location <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <select
                                        value={shelf}
                                        onChange={(e) => {
                                            const selectedShelfId = e.target.value;
                                            setShelf(selectedShelfId);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-[#d1d1d1] bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                                        required
                                    >
                                        <option value="">Select a shelf</option>
                                        {shelves.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Item Value (GHC)
                                    </Label>
                                    <CostInput
                                        value={itemValue}
                                        onChange={setItemValue}
                                        placeholder="0"
                                        inputClassName="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                    />
                                </div>

                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <div className="flex items-center justify-between p-4 border border-[#d1d1d1] rounded-lg bg-gray-50">
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-sm font-semibold text-neutral-800">
                                                Home Delivery Requested
                                            </Label>
                                            <p className="text-xs text-[#5d5d5d]">
                                                Enable if the recipient has requested home delivery
                                            </p>
                                        </div>
                                        <Switch
                                            checked={homeDelivery}
                                            onCheckedChange={(checked) => {
                                                setHomeDelivery(checked);
                                                if (!checked) {
                                                    setDeliveryCost(undefined);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {homeDelivery && (
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold text-neutral-800">
                                            Delivery Cost (GHC) <span className="text-[#e22420]">*</span>
                                        </Label>
                                        <CostInput
                                            value={deliveryCost}
                                            onChange={setDeliveryCost}
                                            placeholder="0"
                                            inputClassName="w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                        />
                                        <p className="text-xs text-blue-600">
                                            Has Called will be automatically set to true
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label className="text-sm font-semibold text-neutral-800">
                                        Special Notes
                                    </Label>
                                    <Textarea
                                        value={specialNotes}
                                        onChange={(e) => setSpecialNotes(e.target.value)}
                                        placeholder="Any special notes..."
                                        className="w-full min-h-[80px] rounded-lg border border-[#d1d1d1] bg-white px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-3 border-t border-[#d1d1d1]">
                            <Button
                                onClick={handleAddAnotherSameDriver}
                                disabled={!isFormValid || isSaving}
                                variant="outline"
                                className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Another (Same Driver)
                            </Button>
                            <Button
                                onClick={handleSaveDirectly}
                                disabled={!isFormValid || isSaving}
                                className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
