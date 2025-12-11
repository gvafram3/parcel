import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStation } from "../../contexts/StationContext";
import { InfoSection } from "./sections/InfoSection";
import { addParcel } from "../../data/mockData";
import { generateParcelId } from "../../utils/dataHelpers";
import { Parcel } from "../../types";
import { Package } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface ParcelFormData {
  driverName?: string;
  vehicleNumber?: string;
  recipientName: string;
  recipientPhone: string;
  itemDescription?: string;
  shelfLocation: string;
  itemValue: number;
}

export const ParcelRegistration = (): JSX.Element => {
  const { currentStation, currentUser } = useStation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionDriver, setSessionDriver] = useState<{ driverName?: string; vehicleNumber?: string } | null>(null);
  const [parcels, setParcels] = useState<ParcelFormData[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Block navigation if there are unsaved parcels
  const hasUnsavedParcels = parcels.length > 0 && !isSaved;

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedParcels) {
        e.preventDefault();
        e.returnValue = "You have unsaved parcels. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedParcels]);

  // Intercept navigation attempts
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && hasUnsavedParcels) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && href !== location.pathname) {
          e.preventDefault();
          setPendingNavigation(href);
          setShowLeaveModal(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedParcels, location.pathname]);

  const handleAddParcel = (parcelData: ParcelFormData) => {
    // If this is the first parcel and has driver info, set session driver
    // This will be used when "Add Another Parcel (Same Driver)" is clicked
    if (parcels.length === 0 && parcelData.driverName && parcelData.vehicleNumber) {
      setSessionDriver({
        driverName: parcelData.driverName,
        vehicleNumber: parcelData.vehicleNumber,
      });
    }

    setParcels([...parcels, parcelData]);
  };

  const handleRemoveParcel = (index: number) => {
    const newParcels = parcels.filter((_, i) => i !== index);
    setParcels(newParcels);
    
    // If no parcels left, clear session driver
    if (newParcels.length === 0) {
      setSessionDriver(null);
    }
  };

  const handleSaveAll = () => {
    if (parcels.length === 0 || !currentStation || !currentUser) {
      return;
    }

    // Save all parcels to database
    parcels.forEach((parcelData) => {
      const parcel: Parcel = {
        id: generateParcelId(),
        stationId: currentStation.id,
        recipientName: parcelData.recipientName,
        recipientPhone: parcelData.recipientPhone,
        itemDescription: parcelData.itemDescription,
        itemValue: parcelData.itemValue || 0,
        shelfLocation: parcelData.shelfLocation,
        registeredDate: new Date().toISOString(),
        registeredBy: currentUser.id,
        driverName: parcelData.driverName,
        vehicleNumber: parcelData.vehicleNumber,
        status: "registered",
        updatedAt: new Date().toISOString(),
      };

      addParcel(parcel);
    });

    const parcelCount = parcels.length;
    const driverInfo = sessionDriver?.driverName 
      ? ` for driver ${sessionDriver.driverName}` 
      : "";

    alert(`Successfully saved ${parcelCount} parcel${parcelCount > 1 ? "s" : ""}${driverInfo}!`);

    // Clear everything
    setParcels([]);
    setSessionDriver(null);
    setIsSaved(true);
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard all unsaved parcels?")) {
      setParcels([]);
      setSessionDriver(null);
      setIsSaved(true);
      setShowLeaveModal(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    setPendingNavigation(null);
  };

  const handleSaveAndLeave = () => {
    handleSaveAll();
    setShowLeaveModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">Parcel Registration</h1>
          <p className="text-sm text-[#5d5d5d] mt-2">
            {currentStation?.name} - Register new parcels for processing
          </p>
        </div>

        {/* Session Banner - Only show if there's an active session */}
        {sessionDriver && parcels.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Active Session</p>
                    <p className="text-sm text-blue-700">
                      Driver: <strong>{sessionDriver.driverName}</strong> | Vehicle:{" "}
                      <strong>{sessionDriver.vehicleNumber}</strong> | Parcels:{" "}
                      <strong className="text-blue-900">{parcels.length}</strong>
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-blue-500 rounded-lg">
                  <span className="text-white font-bold text-lg">{parcels.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Blocker Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-neutral-800 mb-2">Unsaved Parcels</h3>
                  <p className="text-sm text-neutral-700">
                    You have {parcels.length} unsaved parcel{parcels.length > 1 ? "s" : ""}. What would you like to do?
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDiscard}
                    variant="outline"
                    className="flex-1 border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleCancelLeave}
                    variant="outline"
                    className="flex-1 border border-[#d1d1d1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAndLeave}
                    className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                  >
                    Save & Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <InfoSection
          parcels={parcels}
          sessionDriver={sessionDriver}
          onAddParcel={(data) => {
            handleAddParcel(data);
            setIsSaved(false);
          }}
          onSaveAll={handleSaveAll}
          onRemoveParcel={(index) => {
            handleRemoveParcel(index);
            if (parcels.length === 1) {
              setIsSaved(true);
            }
          }}
          onClearSessionDriver={() => setSessionDriver(null)}
        />
      </div>
    </div>
  );
};
