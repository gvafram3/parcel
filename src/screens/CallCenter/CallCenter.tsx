import React, { useState, useEffect } from "react";
import { PhoneIcon, CheckCircleIcon, AlertCircleIcon, Clock, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";
import { getUncontactedParcels, getParcelsByStatus, updateParcelStatus, mockParcels } from "../../data/mockData";
import { Parcel, ParcelStatus } from "../../types";
import { calculateTotalAmount } from "../../utils/dataHelpers";
import { STATUS_CONFIG } from "../../types";
import { formatPhoneNumber } from "../../utils/dataHelpers";

export const CallCenter = (): JSX.Element => {
    const { currentStation, currentUser } = useStation();
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [deliveryPreference, setDeliveryPreference] = useState<"pickup" | "delivery">("delivery");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryFee, setDeliveryFee] = useState("");
    const [preferredDate, setPreferredDate] = useState("");
    const [callNotes, setCallNotes] = useState("");

    useEffect(() => {
        if (currentStation) {
            const uncontacted = getUncontactedParcels(currentStation.id);
            setParcels(uncontacted);
        }
    }, [currentStation, mockParcels]);

    const handleParcelSelect = (parcel: Parcel) => {
        setSelectedParcel(parcel);
        setShowDeliveryForm(false);
        setDeliveryAddress(parcel.deliveryAddress || "");
        setDeliveryFee(parcel.deliveryFee?.toString() || "");
        setPreferredDate(parcel.preferredDeliveryDate || "");
        setCallNotes(parcel.callNotes || "");
        setDeliveryPreference(parcel.deliveryPreference || "delivery");
    };

    const handleMarkContacted = () => {
        if (!selectedParcel || !currentUser) return;

        updateParcelStatus(
            selectedParcel.id,
            "contacted",
            currentUser.id,
            {
                customerContacted: true,
                contactedDate: new Date().toISOString(),
                contactedBy: currentUser.id,
            }
        );

        // Refresh parcels list
        if (currentStation) {
            const uncontacted = getUncontactedParcels(currentStation.id);
            setParcels(uncontacted);
        }

        setSelectedParcel(null);
        alert(`Marked ${selectedParcel.recipientName} as contacted`);
    };

    const handleSavePreferences = () => {
        if (!selectedParcel || !currentUser) return;

        if (deliveryPreference === "delivery" && (!deliveryAddress || !deliveryFee)) {
            alert("Please fill in delivery address and fee for home delivery");
            return;
        }

        const status: ParcelStatus = "ready-for-delivery";
        const updateData: Partial<Parcel> = {
            customerContacted: true,
            contactedDate: selectedParcel.contactedDate || new Date().toISOString(),
            contactedBy: currentUser.id,
            deliveryPreference,
            callNotes: callNotes || undefined,
        };

        if (deliveryPreference === "delivery") {
            updateData.deliveryAddress = deliveryAddress;
            updateData.deliveryFee = parseFloat(deliveryFee);
            if (preferredDate) {
                updateData.preferredDeliveryDate = preferredDate;
            }
        }

        updateParcelStatus(selectedParcel.id, status, currentUser.id, updateData);

        // Refresh parcels list
        if (currentStation) {
            const uncontacted = getUncontactedParcels(currentStation.id);
            setParcels(uncontacted);
        }

        alert(`Preferences saved for ${selectedParcel.recipientName}`);
        setSelectedParcel(null);
        setShowDeliveryForm(false);
        setDeliveryAddress("");
        setDeliveryFee("");
        setPreferredDate("");
        setCallNotes("");
    };

    const uncontactedCount = parcels.length;
    const contactedCount = currentStation
        ? getParcelsByStatus("contacted", currentStation.id).length
        : 0;
    const readyCount = currentStation
        ? getParcelsByStatus("ready-for-delivery", currentStation.id).length
        : 0;

    const totalToCollect = selectedParcel
        ? calculateTotalAmount(
              selectedParcel.itemValue || 0,
              deliveryPreference === "delivery" ? parseFloat(deliveryFee || "0") : 0,
              deliveryPreference
          )
        : 0;

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Uncontacted</p>
                                        <h3 className="text-3xl font-bold text-[#e22420]">{uncontactedCount}</h3>
                                    </div>
                                    <AlertCircleIcon className="w-12 h-12 text-[#e22420] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">In Progress</p>
                                        <h3 className="text-3xl font-bold text-orange-500">{contactedCount}</h3>
                                    </div>
                                    <Clock className="w-12 h-12 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Ready for Delivery</p>
                                        <h3 className="text-3xl font-bold text-green-600">{readyCount}</h3>
                                    </div>
                                    <CheckCircleIcon className="w-12 h-12 text-green-600 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Parcel List - Left Side */}
                        <div className="lg:col-span-1">
                            <Card className="border border-[#d1d1d1] bg-white h-full">
                                <CardContent className="p-4 sm:p-6">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                                        <PhoneIcon className="w-5 h-5 text-[#ea690c]" />
                                        Uncontacted Parcels
                                    </h2>
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                        {parcels.map((parcel) => (
                                            <button
                                                key={parcel.id}
                                                onClick={() => handleParcelSelect(parcel)}
                                                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                                                    selectedParcel?.id === parcel.id
                                                        ? "border-[#ea690c] bg-orange-50"
                                                        : "border-[#d1d1d1] bg-white hover:bg-gray-50"
                                                }`}
                                            >
                                                <p className="font-semibold text-neutral-800 text-sm">
                                                    {parcel.recipientName}
                                                </p>
                                                <p className="text-xs text-[#5d5d5d] mt-1">
                                                    {formatPhoneNumber(parcel.recipientPhone)}
                                                </p>
                                                <p className="text-xs text-[#5d5d5d] mt-1">{parcel.id}</p>
                                            </button>
                                        ))}
                                        {uncontactedCount === 0 && (
                                            <div className="text-center py-8">
                                                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm text-[#5d5d5d]">All parcels contacted!</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Details and Form - Right Side */}
                        <div className="lg:col-span-2">
                            {selectedParcel ? (
                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="space-y-6">
                                            {/* Parcel Header */}
                                            <div className="pb-4 border-b border-[#d1d1d1]">
                                                <h2 className="text-xl font-bold text-neutral-800 mb-2">
                                                    {selectedParcel.recipientName}
                                                </h2>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                        <a
                                                            href={`tel:${selectedParcel.recipientPhone}`}
                                                            className="text-[#ea690c] hover:underline font-medium"
                                                        >
                                                            {formatPhoneNumber(selectedParcel.recipientPhone)}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-[#5d5d5d]" />
                                                        <span className="text-sm text-neutral-700">
                                                            Shelf: {selectedParcel.shelfLocation}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Parcel Details */}
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                                    Parcel Information
                                                </p>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-xs text-blue-700">ID: </span>
                                                        <span className="font-semibold text-blue-900">
                                                            {selectedParcel.id}
                                                        </span>
                                                    </div>
                                                    {selectedParcel.itemDescription && (
                                                        <div>
                                                            <span className="text-xs text-blue-700">Item: </span>
                                                            <span className="text-sm text-neutral-700">
                                                                {selectedParcel.itemDescription}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedParcel.itemValue > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4 text-[#ea690c]" />
                                                            <span className="text-sm font-semibold text-[#ea690c]">
                                                                GHC {selectedParcel.itemValue.toFixed(2)} to collect
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mark as Contacted Button */}
                                            {!selectedParcel.customerContacted && (
                                                <Button
                                                    onClick={handleMarkContacted}
                                                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Mark as Customer Contacted
                                                </Button>
                                            )}

                                            {/* Delivery Preference */}
                                            {selectedParcel.customerContacted && !showDeliveryForm && (
                                                <div>
                                                    <h3 className="font-semibold text-neutral-800 mb-3">
                                                        Delivery Preference
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <label className="flex items-center p-3 border-2 border-[#d1d1d1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input
                                                                type="radio"
                                                                name="delivery"
                                                                value="pickup"
                                                                checked={deliveryPreference === "pickup"}
                                                                onChange={(e) =>
                                                                    setDeliveryPreference(e.target.value as "pickup")
                                                                }
                                                                className="w-4 h-4"
                                                            />
                                                            <div className="ml-3">
                                                                <p className="font-medium text-neutral-800">
                                                                    Customer Pickup
                                                                </p>
                                                                <p className="text-xs text-[#5d5d5d]">No delivery fee</p>
                                                            </div>
                                                        </label>

                                                        <label className="flex items-center p-3 border-2 border-[#d1d1d1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input
                                                                type="radio"
                                                                name="delivery"
                                                                value="delivery"
                                                                checked={deliveryPreference === "delivery"}
                                                                onChange={(e) =>
                                                                    setDeliveryPreference(
                                                                        e.target.value as "delivery"
                                                                    )
                                                                }
                                                                className="w-4 h-4"
                                                            />
                                                            <div className="ml-3">
                                                                <p className="font-medium text-neutral-800">
                                                                    Home Delivery
                                                                </p>
                                                                <p className="text-xs text-[#5d5d5d]">
                                                                    Delivery fee applies
                                                                </p>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    <Button
                                                        onClick={() => setShowDeliveryForm(true)}
                                                        className="w-full mt-4 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                                    >
                                                        {deliveryPreference === "delivery"
                                                            ? "Continue with Home Delivery"
                                                            : "Confirm Pickup"}
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Delivery Form */}
                                            {showDeliveryForm && (
                                                <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                    <h3 className="font-semibold text-neutral-800">
                                                        {deliveryPreference === "delivery"
                                                            ? "Home Delivery Details"
                                                            : "Pickup Confirmation"}
                                                    </h3>

                                                    {deliveryPreference === "delivery" && (
                                                        <>
                                                            <div>
                                                                <Label className="text-sm font-semibold text-neutral-800">
                                                                    Delivery Address{" "}
                                                                    <span className="text-[#e22420]">*</span>
                                                                </Label>
                                                                <Input
                                                                    value={deliveryAddress}
                                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                                    placeholder="Enter delivery address"
                                                                    className="mt-2 border border-[#d1d1d1]"
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label className="text-sm font-semibold text-neutral-800">
                                                                    Delivery Fee (GHC){" "}
                                                                    <span className="text-[#e22420]">*</span>
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={deliveryFee}
                                                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                                                    placeholder="e.g., 15.00"
                                                                    className="mt-2 border border-[#d1d1d1]"
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label className="text-sm font-semibold text-neutral-800">
                                                                    Preferred Delivery Date
                                                                </Label>
                                                                <Input
                                                                    type="date"
                                                                    value={preferredDate}
                                                                    onChange={(e) => setPreferredDate(e.target.value)}
                                                                    className="mt-2 border border-[#d1d1d1]"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div>
                                                        <Label className="text-sm font-semibold text-neutral-800">
                                                            Call Notes
                                                        </Label>
                                                        <textarea
                                                            value={callNotes}
                                                            onChange={(e) => setCallNotes(e.target.value)}
                                                            placeholder="Record any special notes from the customer"
                                                            className="w-full mt-2 px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    {/* Summary */}
                                                    <div className="bg-white p-3 rounded-lg border border-[#d1d1d1]">
                                                        <p className="text-xs font-semibold text-[#5d5d5d] mb-2">
                                                            TOTAL TO COLLECT
                                                        </p>
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-sm text-neutral-700">
                                                                {deliveryPreference === "delivery"
                                                                    ? `Delivery + Item Value`
                                                                    : "Item Value"}
                                                            </span>
                                                            <span className="text-2xl font-bold text-[#ea690c]">
                                                                GHC {totalToCollect.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            onClick={() => setShowDeliveryForm(false)}
                                                            variant="outline"
                                                            className="flex-1 border border-[#d1d1d1]"
                                                        >
                                                            Back
                                                        </Button>
                                                        <Button
                                                            onClick={handleSavePreferences}
                                                            disabled={
                                                                deliveryPreference === "delivery" &&
                                                                (!deliveryAddress || !deliveryFee)
                                                            }
                                                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                                        >
                                                            Mark Ready for Assignment
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="flex items-center justify-center p-12">
                                        <div className="text-center">
                                            <PhoneIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                            <p className="text-neutral-800 font-medium mb-1">Select a parcel to begin</p>
                                            <p className="text-sm text-[#5d5d5d]">
                                                Click on a parcel from the list to record customer preferences
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
