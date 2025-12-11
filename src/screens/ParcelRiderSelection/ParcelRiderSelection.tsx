import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon, UserIcon, MapPinIcon, PhoneIcon, AlertCircleIcon } from "lucide-react";
import { ErrorNotificationSection } from "../ParcelRegistration/sections/ErrorNotificationSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useStation } from "../../contexts/StationContext";
import { getRidersByStation, assignParcelsToRider, mockRiders } from "../../data/mockData";
import { Rider } from "../../types";
import { formatPhoneNumber } from "../../utils/dataHelpers";

export const ParcelRiderSelection = (): JSX.Element => {
  const { currentStation, currentUser } = useStation();
  const navigate = useNavigate();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    // Get selected parcel IDs from sessionStorage
    const storedIds = sessionStorage.getItem("selectedParcelIds");
    if (storedIds) {
      try {
        const ids = JSON.parse(storedIds);
        setSelectedParcelIds(ids);
      } catch (e) {
        console.error("Failed to parse selected parcel IDs", e);
      }
    } else {
      // No parcels selected, redirect back
      navigate("/package-assignments");
    }

    // Load riders for current station
    if (currentStation) {
      const stationRiders = getRidersByStation(currentStation.id);
      setRiders(stationRiders);
    } else {
      // If admin, show all riders
      setRiders(mockRiders);
    }
  }, [currentStation, navigate]);

  const handleAssign = () => {
    if (!selectedRider || selectedParcelIds.length === 0 || !currentUser) {
      return;
    }

    setIsAssigning(true);

    try {
      assignParcelsToRider(selectedParcelIds, selectedRider, currentUser.id);

      // Clear session storage
      sessionStorage.removeItem("selectedParcelIds");

      // Show success and redirect
      alert(`Successfully assigned ${selectedParcelIds.length} parcel(s) to rider!`);
      navigate("/active-deliveries");
    } catch (error) {
      console.error("Failed to assign parcels:", error);
      alert("Failed to assign parcels. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedRiderData = riders.find((r) => r.id === selectedRider);

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          <ErrorNotificationSection />

          {/* Info Banner */}
          {selectedParcelIds.length > 0 && (
            <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="[font-family:'Lato',Helvetica] font-normal text-blue-800 text-sm">
                <span className="font-semibold">{selectedParcelIds.length} Parcel(s)</span> selected for assignment
              </p>
            </div>
          )}

          <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
              <header className="inline-flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-[#ea690c]" />
                <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                  Parcel Rider Selection
                </h1>
              </header>

              <div className="flex flex-col gap-4 w-full">
                <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
                  Select an available rider for the selected parcels
                </p>

                {riders.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="w-12 h-12 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                    <p className="text-neutral-700 font-medium">No riders available</p>
                    <p className="text-sm text-[#5d5d5d] mt-2">
                      Please add riders to this station first
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {riders.map((rider) => {
                        const isAvailable = rider.status === "available";
                        const isSelected = selectedRider === rider.id;

                        return (
                          <div
                            key={rider.id}
                            onClick={() => isAvailable && setSelectedRider(rider.id)}
                            className={`flex flex-col gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${isSelected
                                ? "border-[#ea690c] bg-orange-50"
                                : isAvailable
                                  ? "border-[#d1d1d1] bg-white hover:bg-gray-50"
                                  : "border-[#d1d1d1] bg-gray-100 opacity-60 cursor-not-allowed"
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border border-solid border-[#d1d1d1]">
                                  <AvatarImage src="/vector.svg" alt={rider.name} />
                                  <AvatarFallback>
                                    {rider.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                                    {rider.name}
                                  </span>
                                  <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                    {rider.id}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ea690c]">
                                  <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                                <a
                                  href={`tel:${rider.phone}`}
                                  className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm hover:text-[#ea690c]"
                                >
                                  {formatPhoneNumber(rider.phone)}
                                </a>
                              </div>
                              {rider.location && (
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                  <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    {rider.location}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#d1d1d1]">
                              <div className="flex flex-col">
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                  Deliveries
                                </span>
                                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                  {rider.deliveriesCompleted || 0}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                  Rating
                                </span>
                                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                  ⭐ {rider.rating?.toFixed(1) || "N/A"}
                                </span>
                              </div>
                              <Badge
                                className={`${isAvailable
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                                  }`}
                              >
                                {rider.status === "available" ? "Available" : "Busy"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedRider && (
                      <div className="flex justify-end pt-4 border-t border-[#d1d1d1]">
                        <Button
                          onClick={handleAssign}
                          disabled={isAssigning}
                          className="flex items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 disabled:opacity-50"
                        >
                          <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                            {isAssigning
                              ? "Assigning..."
                              : `Assign ${selectedParcelIds.length} Parcel(s) to ${selectedRiderData?.name || "Rider"}`}
                          </span>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
