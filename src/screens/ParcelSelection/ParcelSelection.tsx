import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckIcon,
    FilterIcon,
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    PackageIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { getReadyForAssignmentParcels } from "../../data/mockData";
import { Parcel, STATUS_CONFIG } from "../../types";
import { formatPhoneNumber, calculateTotalAmount, formatCurrency } from "../../utils/dataHelpers";

interface ParcelCardProps {
    parcel: Parcel;
    isSelected: boolean;
    onToggle: () => void;
}

const ParcelCard = ({ parcel, isSelected, onToggle }: ParcelCardProps) => {
    const statusConfig = STATUS_CONFIG[parcel.status] || { label: parcel.status, color: "bg-gray-100 text-gray-800" };
    const totalAmount = calculateTotalAmount(
        parcel.itemValue || 0,
        parcel.deliveryFee || 0,
        parcel.deliveryPreference || "delivery"
    );

    return (
        <Card
            className={`rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow ${
                isSelected ? "border-[#ea690c]" : "border-[#d1d1d1]"
            }`}
        >
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {/* Header with checkbox and package ID */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle();
                                }}
                                className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                    isSelected
                                        ? "border-[#ea690c] bg-[#ea690c]"
                                        : "border-[#d1d1d1] bg-white"
                                }`}
                            >
                                {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                    {parcel.recipientName}
                                </span>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                    {parcel.id}
                                </span>
                            </div>
                        </div>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <a
                                href={`tel:${parcel.recipientPhone}`}
                                className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm hover:text-[#ea690c]"
                            >
                                {formatPhoneNumber(parcel.recipientPhone)}
                            </a>
                        </div>

                        {parcel.deliveryPreference === "delivery" && parcel.deliveryAddress ? (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    {parcel.deliveryAddress}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    Shelf: <strong>{parcel.shelfLocation}</strong> (Customer Pickup)
                                </span>
                            </div>
                        )}

                        {parcel.preferredDeliveryDate && (
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    Preferred: {new Date(parcel.preferredDeliveryDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {parcel.itemDescription && (
                            <div className="flex items-center gap-2">
                                <PackageIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    {parcel.itemDescription}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                Amount to collect: <span className="text-[#ea690c]">{formatCurrency(totalAmount)}</span>
                            </span>
                        </div>
                    </div>

                    {/* Status message */}
                    <div className="rounded-lg border p-3 bg-green-50 border-green-200">
                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                            Ready for assignment to rider
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const ParcelSelection = (): JSX.Element => {
    const { currentStation } = useStation();
    const navigate = useNavigate();
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        if (currentStation) {
            const readyParcels = getReadyForAssignmentParcels(currentStation.id);
            setParcels(readyParcels);
        }
    }, [currentStation]);

    const toggleParcel = (id: string) => {
        const newSelected = new Set(selectedParcels);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            if (newSelected.size >= 10) {
                alert("Maximum 10 parcels can be selected at once");
                return;
            }
            newSelected.add(id);
        }
        setSelectedParcels(newSelected);
    };

    const handleAssign = () => {
        if (selectedParcels.size > 0) {
            // Store selected parcel IDs in sessionStorage to pass to rider selection
            sessionStorage.setItem("selectedParcelIds", JSON.stringify(Array.from(selectedParcels)));
            navigate("/rider-selection");
        }
    };

    const filteredParcels = statusFilter === "all" 
        ? parcels 
        : parcels.filter((p) => p.status === statusFilter);

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">Parcel Assignment</h1>
                        <p className="text-sm text-[#5d5d5d] mt-1">
                            Select parcels ready for delivery and assign them to a rider
                        </p>
                    </div>

                    {/* Banner */}
                    <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="[font-family:'Lato',Helvetica] font-normal text-blue-800 text-sm">
                            <span className="font-semibold">{selectedParcels.size} Parcel(s) Selected</span>
                            {" - "}
                            10 maximum parcels can be selected and assigned to a rider at once.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <FilterIcon className="w-5 h-5 text-[#5d5d5d]" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded border border-[#d1d1d1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="ready-for-assignment">Ready for Assignment</option>
                                    <option value="customer-contacted">Contacted</option>
                                </select>
                            </div>

                            <div className="flex-1" />

                            <Button
                                onClick={handleAssign}
                                disabled={selectedParcels.size === 0}
                                className="w-full sm:w-auto bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue to Rider Selection ({selectedParcels.size})
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Parcel Cards Grid */}
                    {filteredParcels.length === 0 ? (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-12 text-center">
                                <PackageIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-700 font-medium">No parcels ready for assignment</p>
                                <p className="text-sm text-[#5d5d5d] mt-2">
                                    Parcels will appear here once customers are contacted and delivery preferences are set
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredParcels.map((parcel) => (
                                <ParcelCard
                                    key={parcel.id}
                                    parcel={parcel}
                                    isSelected={selectedParcels.has(parcel.id)}
                                    onToggle={() => toggleParcel(parcel.id)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
