import { useState, useEffect } from "react";
import {
    CheckIcon,
    MapPinIcon,
    PhoneIcon,
    PackageIcon,
    Loader,
    TruckIcon,
    UserIcon,
    AlertCircleIcon,
    X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { formatPhoneNumber, formatCurrency } from "../../utils/dataHelpers";
import { ParcelResponse, RiderResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import frontdeskService from "../../services/frontdeskService";
import { useStation } from "../../contexts/StationContext";
import { Label } from "@radix-ui/react-label";

interface ParcelCardProps {
    parcel: ParcelResponse;
    isSelected: boolean;
    onToggle: () => void;
}

const ParcelCard = ({ parcel, isSelected, onToggle }: ParcelCardProps) => {
    let statusLabel = "Ready";
    let statusColor = "bg-green-100 text-green-800";
    if (parcel.delivered) {
        statusLabel = "Delivered";
        statusColor = "bg-green-100 text-green-800";
    } else if (parcel.parcelAssigned) {
        statusLabel = "Assigned";
        statusColor = "bg-blue-100 text-blue-800";
    }

    const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) + (parcel.inboundCost || 0) + (parcel.storageCost || 0);

    const hasDeliveryAddress = parcel.receiverAddress && parcel.homeDelivery;

    return (
        <Card
            className={`rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow ${isSelected ? "border-[#ea690c]" : "border-[#d1d1d1]"
                }`}
        >
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle();
                                }}
                                className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${isSelected
                                    ? "border-[#ea690c] bg-[#ea690c]"
                                    : "border-[#d1d1d1] bg-white"
                                    }`}
                            >
                                {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                    {parcel.receiverName || "N/A"}
                                </span>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                    {parcel.parcelId}
                                </span>
                            </div>
                        </div>
                        <Badge className={statusColor}>{statusLabel}</Badge>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <a
                                href={`tel:${parcel.recieverPhoneNumber}`}
                                className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm hover:text-[#ea690c]"
                            >
                                {parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : "N/A"}
                            </a>
                        </div>

                        {hasDeliveryAddress ? (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    {parcel.receiverAddress}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    Shelf: <strong>{parcel.shelfName || parcel.shelfNumber || "N/A"}</strong>
                                </span>
                            </div>
                        )}

                        {parcel.parcelDescription && (
                            <div className="flex items-center gap-2">
                                <PackageIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    {parcel.parcelDescription}
                                </span>
                            </div>
                        )}

                        {parcel.riderInfo && (
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <div className="[font-family:'Lato',Helvetica] font-normal text-sm">
                                    <div className="text-[#ea690c]">
                                        Rider: <strong className="font-semibold text-[#ea690c]">{parcel.riderInfo.riderName}</strong>
                                    </div>
                                    {parcel.riderInfo.riderPhoneNumber && (
                                        <div className="text-[12px] text-[#ea690c]">
                                            {formatPhoneNumber(parcel.riderInfo.riderPhoneNumber)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                Amount to collect: <span className="text-[#ea690c]">{formatCurrency(totalAmount)}</span>
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border p-3 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2">
                            <TruckIcon className="w-4 h-4 text-green-600" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                Ready for home delivery assignment
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const ParcelSelection = (): JSX.Element => {
    const { showToast } = useToast();
    const { currentUser } = useStation();
    const [allParcels, setAllParcels] = useState<ParcelResponse[]>([]);
    const [filteredParcels, setFilteredParcels] = useState<ParcelResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
    const [showRiderModal, setShowRiderModal] = useState(false);
    const [riders, setRiders] = useState<RiderResponse[]>([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [selectedRider, setSelectedRider] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [filterMode, setFilterMode] = useState<'ready' | 'assigned'>('ready');

    const filterParcelsByMode = (parcels: ParcelResponse[], mode: 'ready' | 'assigned') => {
        if (mode === 'assigned') {
            return parcels.filter(p => !!p.parcelAssigned || !!p.riderInfo);
        }
        return parcels.filter(p => !p.parcelAssigned && !p.riderInfo);
    };

    useEffect(() => {
        const fetchHomeDeliveryParcels = async () => {
            setLoading(true);
            try {
                const response = await frontdeskService.getHomeDeliveryParcels();

                if (response.success && response.data) {
                    const parcels = Array.isArray(response.data)
                        ? response.data as ParcelResponse[]
                        : [];
                    const validParcels = parcels.filter(p => p.parcelId);
                    setAllParcels(validParcels);
                    setFilteredParcels(filterParcelsByMode(validParcels, filterMode));
                } else {
                    showToast(response.message || "Failed to load parcels", "error");
                    setAllParcels([]);
                    setFilteredParcels([]);
                }
            } catch (error) {
                console.error("Failed to fetch home delivery parcels:", error);
                showToast("Failed to load parcels. Please try again.", "error");
                setAllParcels([]);
                setFilteredParcels([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeDeliveryParcels();
    }, [showToast, filterMode]);

    useEffect(() => {
        setFilteredParcels(filterParcelsByMode(allParcels, filterMode));
        setSelectedParcels(new Set());
    }, [allParcels, filterMode]);

    const toggleParcel = (parcelId: string) => {
        const newSelected = new Set(selectedParcels);
        if (newSelected.has(parcelId)) {
            newSelected.delete(parcelId);
        } else {
            if (newSelected.size >= 10) {
                showToast("Maximum 10 parcels can be selected at once", "warning");
                return;
            }
            newSelected.add(parcelId);
        }
        setSelectedParcels(newSelected);
    };

    const handleAssign = () => {
        if (selectedParcels.size > 0) {
            setShowRiderModal(true);
            fetchRiders();
        }
    };

    const fetchRiders = async () => {
        setLoadingRiders(true);
        try {
            const response = await frontdeskService.getRiders();

            if (response.success && response.data) {
                setRiders(response.data as RiderResponse[]);
            } else {
                showToast(response.message || "Failed to load riders", "error");
            }
        } catch (error) {
            console.error("Failed to fetch riders:", error);
            showToast("Failed to load riders. Please try again.", "error");
        } finally {
            setLoadingRiders(false);
        }
    };

    const handleAssignToRider = async () => {
        if (!selectedRider || selectedParcels.size === 0 || !currentUser) {
            showToast("Please select a rider", "warning");
            return;
        }

        setIsAssigning(true);

        try {
            const parcelIds = Array.from(selectedParcels);
            const response = await frontdeskService.assignParcelsToRider(selectedRider, parcelIds);

            if (response.success) {
                showToast(`Successfully assigned ${parcelIds.length} parcel(s) to rider!`, "success");

                setSelectedParcels(new Set());
                setSelectedRider(null);
                setShowRiderModal(false);

                const refreshResponse = await frontdeskService.getHomeDeliveryParcels();
                if (refreshResponse.success && refreshResponse.data) {
                    const parcels = Array.isArray(refreshResponse.data)
                        ? refreshResponse.data as ParcelResponse[]
                        : [];
                    setAllParcels(parcels);
                    setFilteredParcels(filterParcelsByMode(parcels, filterMode));
                } else {
                    setAllParcels([]);
                    setFilteredParcels([]);
                }
            } else {
                showToast(response.message || "Failed to assign parcels. Please try again.", "error");
            }
        } catch (error) {
            console.error("Failed to assign parcels:", error);
            showToast("Failed to assign parcels. Please try again.", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    const selectedRiderData = riders.find((r) => r.userId === selectedRider);

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Label className="block text-xs font-semibold text-[#5d5d5d]">Filter</Label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setFilterMode('ready'); setSelectedParcels(new Set()); }}
                                        className={`px-3 py-1 rounded ${filterMode === 'ready' ? 'bg-[#ea690c] text-white' : 'bg-white border border-[#d1d1d1] text-neutral-700'}`}
                                    >
                                        Ready
                                    </button>
                                    <button
                                        onClick={() => { setFilterMode('assigned'); setSelectedParcels(new Set()); }}
                                        className={`px-3 py-1 rounded ${filterMode === 'assigned' ? 'bg-[#ea690c] text-white' : 'bg-white border border-[#d1d1d1] text-neutral-700'}`}
                                    >
                                        Assigned
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="[font-family:'Lato',Helvetica] font-normal text-blue-800 text-sm">
                            <span className="font-semibold">{filteredParcels.length} Parcel(s)</span> ({filterMode === 'ready' ? 'Ready' : 'Assigned'})
                            {" - "}
                            <span className="font-semibold">{selectedParcels.size}</span> selected
                        </p>
                    </div>

                    <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <TruckIcon className="w-5 h-5 text-[#ea690c]" />
                                <span className="text-sm font-medium text-neutral-700">
                                    {filteredParcels.length} parcel{filteredParcels.length !== 1 ? 's' : ''} ready for assignment
                                </span>
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

                    {loading ? (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-12 text-center">
                                <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                <p className="text-neutral-700 font-medium">Loading parcels...</p>
                            </CardContent>
                        </Card>
                    ) : filteredParcels.length === 0 ? (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-12 text-center">
                                <PackageIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-700 font-medium">
                                    {allParcels.length === 0
                                        ? "No parcels ready for assignment"
                                        : `No parcels for the selected filter`}
                                </p>
                                <p className="text-sm text-[#5d5d5d] mt-2">
                                    {allParcels.length === 0
                                        ? "Parcels will appear here once customers are contacted and request home delivery"
                                        : "Try selecting a different filter"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : Array.isArray(filteredParcels) && filteredParcels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredParcels.map((parcel) => (
                                <ParcelCard
                                    key={parcel.parcelId}
                                    parcel={parcel}
                                    isSelected={selectedParcels.has(parcel.parcelId)}
                                    onToggle={() => toggleParcel(parcel.parcelId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-12 text-center">
                                <PackageIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-700 font-medium">No parcels available</p>
                                <p className="text-sm text-[#5d5d5d] mt-2">
                                    Try selecting a different filter
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>

            {showRiderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-6 h-6 text-[#ea690c]" />
                                    <h2 className="text-xl font-bold text-neutral-800">Select Rider</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowRiderModal(false);
                                        setSelectedRider(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedParcels.size > 0 && (
                                <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-4">
                                    <p className="[font-family:'Lato',Helvetica] font-normal text-blue-800 text-sm">
                                        <span className="font-semibold">{selectedParcels.size} Parcel(s)</span> selected for assignment
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-[#5d5d5d]">
                                    Select an available rider for the selected parcels
                                </p>

                                {loadingRiders ? (
                                    <div className="text-center py-8">
                                        <Loader className="w-12 h-12 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                        <p className="text-neutral-700 font-medium">Loading riders...</p>
                                    </div>
                                ) : riders.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircleIcon className="w-12 h-12 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                        <p className="text-neutral-700 font-medium">No riders available</p>
                                        <p className="text-sm text-[#5d5d5d] mt-2">
                                            Please add riders to this station first
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                            {riders.map((rider) => {
                                                const isSelected = selectedRider === rider.userId;
                                                const riderName = rider.name || rider.email || "Unknown";

                                                return (
                                                    <div
                                                        key={rider.userId}
                                                        onClick={() => setSelectedRider(rider.userId)}
                                                        className={`flex flex-col gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${isSelected
                                                            ? "border-[#ea690c] bg-orange-50"
                                                            : "border-[#d1d1d1] bg-white hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-12 w-12 border border-solid border-[#d1d1d1]">
                                                                    <AvatarImage src="/vector.svg" alt={riderName} />
                                                                    <AvatarFallback>
                                                                        {riderName
                                                                            .split(" ")
                                                                            .map((n) => n[0])
                                                                            .join("")
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                                                                        {riderName}
                                                                    </span>
                                                                    {rider.phoneNumber && (
                                                                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                                                            {formatPhoneNumber(rider.phoneNumber)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ea690c]">
                                                                    <CheckIcon className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {rider.phoneNumber && (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                                    <a
                                                                        href={`tel:${rider.phoneNumber}`}
                                                                        className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm hover:text-[#ea690c]"
                                                                    >
                                                                        {formatPhoneNumber(rider.phoneNumber)}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {rider.office && (
                                                            <div className="flex items-center gap-2 pt-2 border-t border-[#d1d1d1]">
                                                                <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                                                    {rider.office.name}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {rider.status && (
                                                            <div className="flex items-center justify-end pt-2">
                                                                <Badge
                                                                    className={`${rider.status === "ACTIVE"
                                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                                        }`}
                                                                >
                                                                    {rider.status}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {selectedRider && (
                                            <div className="flex justify-end gap-3 pt-4 border-t border-[#d1d1d1]">
                                                <Button
                                                    onClick={() => {
                                                        setShowRiderModal(false);
                                                        setSelectedRider(null);
                                                    }}
                                                    variant="outline"
                                                    className="border border-[#d1d1d1]"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleAssignToRider}
                                                    disabled={isAssigning}
                                                    className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                                >
                                                    {isAssigning ? (
                                                        <>
                                                            <Loader className="w-4 h-4 animate-spin mr-2" />
                                                            Assigning...
                                                        </>
                                                    ) : (
                                                        `Assign ${selectedParcels.size} Parcel(s) to ${selectedRiderData?.name || "Rider"}`
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
