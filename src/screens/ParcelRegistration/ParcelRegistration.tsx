// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { InfoSection } from "./sections/InfoSection";
// import frontdeskService from "../../services/frontdeskService";
// import authService from "../../services/authService";
// import { useToast } from "../../components/ui/toast";
// import { Package } from "lucide-react";
// import { Card, CardContent } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";

// interface ParcelFormData {
//   driverName?: string;
//   driverPhone?: string;
//   vehicleNumber?: string;
//   senderName?: string;
//   senderPhone?: string;
//   recipientName: string;
//   recipientPhone: string;
//   receiverAddress?: string;
//   itemDescription?: string;
//   shelfLocation: string; // Stores shelf ID
//   shelfName?: string; // Stores shelf name for display
//   itemValue: number;
//   pickUpCost?: number;
// }

// const STORAGE_KEY_PARCELS = "parcel_registration_parcels";
// const STORAGE_KEY_SESSION_DRIVER = "parcel_registration_session_driver";

// export const ParcelRegistration = (): JSX.Element => {
//   const { showToast } = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Load from localStorage on mount
//   const loadFromStorage = (): { parcels: ParcelFormData[]; sessionDriver: { driverName?: string; driverPhone?: string; vehicleNumber?: string } | null } => {
//     try {
//       const storedParcels = localStorage.getItem(STORAGE_KEY_PARCELS);
//       const storedDriver = localStorage.getItem(STORAGE_KEY_SESSION_DRIVER);
//       return {
//         parcels: storedParcels ? JSON.parse(storedParcels) : [],
//         sessionDriver: storedDriver ? JSON.parse(storedDriver) : null,
//       };
//     } catch (error) {
//       console.error("Error loading from localStorage:", error);
//       return { parcels: [], sessionDriver: null };
//     }
//   };

//   const { parcels: initialParcels, sessionDriver: initialDriver } = loadFromStorage();
//   const [sessionDriver, setSessionDriver] = useState<{ driverName?: string; driverPhone?: string; vehicleNumber?: string } | null>(initialDriver);
//   const [parcels, setParcels] = useState<ParcelFormData[]>(initialParcels);
//   const [isSaved, setIsSaved] = useState(false);
//   const [showLeaveModal, setShowLeaveModal] = useState(false);
//   const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // Save to localStorage whenever parcels or sessionDriver changes
//   useEffect(() => {
//     if (parcels.length > 0 || sessionDriver) {
//       try {
//         localStorage.setItem(STORAGE_KEY_PARCELS, JSON.stringify(parcels));
//         if (sessionDriver) {
//           localStorage.setItem(STORAGE_KEY_SESSION_DRIVER, JSON.stringify(sessionDriver));
//         } else {
//           localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
//         }
//       } catch (error) {
//         console.error("Error saving to localStorage:", error);
//       }
//     } else {
//       // Clear storage if no data
//       localStorage.removeItem(STORAGE_KEY_PARCELS);
//       localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
//     }
//   }, [parcels, sessionDriver]);

//   // Block navigation if there are unsaved parcels
//   const hasUnsavedParcels = parcels.length > 0 && !isSaved;

//   // Handle browser refresh/close - data is already saved to localStorage, so just warn
//   useEffect(() => {
//     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//       if (hasUnsavedParcels) {
//         e.preventDefault();
//         e.returnValue = "You have unsaved parcels. Your data has been saved temporarily. Are you sure you want to leave?";
//         return e.returnValue;
//       }
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [hasUnsavedParcels]);

//   // Handle visibility change (tab switch)
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.hidden && hasUnsavedParcels) {
//         // Tab switched - data is already saved to localStorage
//         console.log("Tab switched - parcel data saved to localStorage");
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
//   }, [hasUnsavedParcels]);

//   // Intercept navigation attempts
//   useEffect(() => {
//     const handleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const link = target.closest('a[href]') as HTMLAnchorElement;

//       if (link && hasUnsavedParcels) {
//         const href = link.getAttribute('href');
//         if (href && href.startsWith('/') && href !== location.pathname) {
//           e.preventDefault();
//           setPendingNavigation(href);
//           setShowLeaveModal(true);
//         }
//       }
//     };

//     document.addEventListener('click', handleClick, true);
//     return () => document.removeEventListener('click', handleClick, true);
//   }, [hasUnsavedParcels, location.pathname]);

//   const handleAddParcel = (parcelData: ParcelFormData) => {
//     // If this is the first parcel and has driver info, set session driver
//     // This will be used when "Add Another Parcel (Same Driver)" is clicked
//     if (parcels.length === 0 && parcelData.driverName && parcelData.vehicleNumber) {
//       setSessionDriver({
//         driverName: parcelData.driverName,
//         driverPhone: parcelData.driverPhone,
//         vehicleNumber: parcelData.vehicleNumber,
//       });
//     }

//     setParcels([...parcels, parcelData]);
//   };

//   const handleRemoveParcel = (index: number) => {
//     const newParcels = parcels.filter((_, i) => i !== index);
//     setParcels(newParcels);

//     // If no parcels left, clear session driver
//     if (newParcels.length === 0) {
//       setSessionDriver(null);
//     }
//   };

//   const handleSaveAll = async () => {
//     if (parcels.length === 0) {
//       showToast("No parcels to save", "warning");
//       return;
//     }

//     // Get office ID from user stored in localStorage
//     const userData = authService.getUser();
//     const officeId = (userData as any)?.office?.id;

//     if (!officeId) {
//       showToast("Office ID not found. Please ensure you are logged in with a valid account.", "error");
//       return;
//     }

//     // Validate required fields for each parcel - FIXED: Changed validation
//     const invalidParcels = parcels.filter(p => {
//       const isInvalid =
//         !p.recipientName?.trim() ||
//         !p.recipientPhone?.trim() ||
//         !p.shelfLocation?.trim() ||
//         !p.driverName?.trim() ||
//         !p.driverPhone?.trim() ||
//         !p.vehicleNumber?.trim() ||
//         p.pickUpCost === undefined ||
//         p.pickUpCost === null ||
//         p.itemValue === undefined;

//       if (isInvalid) {
//         console.log("Invalid parcel:", p); // Debug log
//       }
//       return isInvalid;
//     });

//     if (invalidParcels.length > 0) {
//       console.log("Invalid parcels found:", invalidParcels); // Debug log
//       showToast(`${invalidParcels.length} parcel(s) have missing required fields. Please check:\n- Recipient Name & Phone\n- Shelf Location\n- Driver Info\n- Vehicle Number\n- Pickup Cost\n- Item Value`, "error");
//       return;
//     }

//     setIsSaving(true);

//     try {
//       // Save all parcels to backend API
//       const savePromises = parcels.map(async (parcelData) => {
//         const parcelRequest = {
//           senderName: parcelData.senderName || undefined,
//           senderPhoneNumber: parcelData.senderPhone || "", // API requires this field
//           receiverName: parcelData.recipientName,
//           receiverAddress: parcelData.receiverAddress || undefined,
//           recieverPhoneNumber: parcelData.recipientPhone, // Note: API has typo "reciever"
//           parcelDescription: parcelData.itemDescription || undefined,
//           driverName: parcelData.driverName!,
//           driverPhoneNumber: parcelData.driverPhone!,
//           inboundCost: parcelData.itemValue > 0 ? parcelData.itemValue : undefined,
//           pickUpCost: parcelData.pickUpCost || 0,
//           deliveryCost: undefined,
//           storageCost: undefined,
//           shelfNumber: parcelData.shelfLocation, // shelfLocation now contains shelf ID
//           hasCalled: false,
//           vehicleNumber: parcelData.vehicleNumber!,
//           officeId: officeId,
//           pod: false,
//           delivered: false,
//           parcelAssigned: false,
//           fragile: false,
//         };

//         return frontdeskService.addParcel(parcelRequest);
//       });

//       const results = await Promise.all(savePromises);

//       // Check if all saves were successful
//       const failedSaves = results.filter(r => !r.success);

//       if (failedSaves.length > 0) {
//         const errorMessages = failedSaves.map(r => r.message).join(", ");
//         showToast(`Failed to save ${failedSaves.length} parcel(s): ${errorMessages}`, "error");
//         return;
//       }

//       const parcelCount = parcels.length;
//       const driverInfo = sessionDriver?.driverName
//         ? ` for driver ${sessionDriver.driverName}`
//         : "";

//       showToast(`Successfully saved ${parcelCount} parcel${parcelCount > 1 ? "s" : ""}${driverInfo}!`, "success");

//       // Clear everything and localStorage
//       setParcels([]);
//       setSessionDriver(null);
//       setIsSaved(true);
//       localStorage.removeItem(STORAGE_KEY_PARCELS);
//       localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
//     } catch (error: any) {
//       console.error("Error saving parcels:", error);
//       showToast("An error occurred while saving parcels. Please try again.", "error");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDiscard = () => {
//     if (window.confirm("Are you sure you want to discard all unsaved parcels? This will also clear the temporarily saved data.")) {
//       setParcels([]);
//       setSessionDriver(null);
//       setIsSaved(true);
//       localStorage.removeItem(STORAGE_KEY_PARCELS);
//       localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
//       setShowLeaveModal(false);
//       if (pendingNavigation) {
//         navigate(pendingNavigation);
//         setPendingNavigation(null);
//       }
//     }
//   };

//   const handleCancelLeave = () => {
//     setShowLeaveModal(false);
//     setPendingNavigation(null);
//   };

//   const handleSaveAndLeave = () => {
//     handleSaveAll();
//     setShowLeaveModal(false);
//     if (pendingNavigation) {
//       navigate(pendingNavigation);
//       setPendingNavigation(null);
//     }
//   };

//   return (
//     <div className="w-full bg-gray-50 min-h-screen">
//       <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
//         {/* Header */}
//         {/* <div className="mb-8">
//           <h1 className="text-3xl font-bold text-neutral-800">Parcel Registration</h1>
//           <p className="text-sm text-[#5d5d5d] mt-2">
//             {currentStation?.name} - Register new parcels for processing
//           </p>
//         </div> */}

//         {/* Session Banner - Only show if there's an active session */}
//         {sessionDriver && parcels.length > 0 && (
//           <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-blue-500 rounded-lg">
//                     <Package className="w-5 h-5 text-white" />
//                   </div>
//                   <div>
//                     <p className="font-semibold text-blue-900">Active Session</p>
//                     <p className="text-sm text-blue-700">
//                       Driver: <strong>{sessionDriver.driverName}</strong> | Vehicle:{" "}
//                       <strong>{sessionDriver.vehicleNumber}</strong> | Parcels:{" "}
//                       <strong className="text-blue-900">{parcels.length}</strong>
//                     </p>
//                   </div>
//                 </div>
//                 <div className="px-4 py-2 bg-blue-500 rounded-lg">
//                   <span className="text-white font-bold text-lg">{parcels.length}</span>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Navigation Blocker Modal */}
//         {showLeaveModal && (
//           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             <Card className="w-full max-w-md rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
//               <CardContent className="p-6">
//                 <div className="mb-4">
//                   <h3 className="text-lg font-bold text-neutral-800 mb-2">Unsaved Parcels</h3>
//                   <p className="text-sm text-neutral-700 mb-2">
//                     You have {parcels.length} unsaved parcel{parcels.length > 1 ? "s" : ""}. Your data has been temporarily saved.
//                   </p>
//                   <p className="text-xs text-neutral-500">
//                     What would you like to do?
//                   </p>
//                 </div>
//                 <div className="flex gap-3">
//                   <Button
//                     onClick={handleDiscard}
//                     variant="outline"
//                     className="flex-1 border border-red-300 text-red-600 hover:bg-red-50"
//                   >
//                     Discard
//                   </Button>
//                   <Button
//                     onClick={handleCancelLeave}
//                     variant="outline"
//                     className="flex-1 border border-[#d1d1d1]"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleSaveAndLeave}
//                     className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
//                   >
//                     Save & Leave
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         <InfoSection
//           parcels={parcels}
//           sessionDriver={sessionDriver}
//           onAddParcel={(data) => {
//             handleAddParcel(data);
//             setIsSaved(false);
//           }}
//           onSaveAll={handleSaveAll}
//           onRemoveParcel={(index) => {
//             handleRemoveParcel(index);
//             if (parcels.length === 1) {
//               setIsSaved(true);
//             }
//           }}
//           isSaving={isSaving}
//         />
//       </div>
//     </div>
//   );
// };




import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InfoSection } from "./sections/InfoSection";
import frontdeskService from "../../services/frontdeskService";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { Package } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

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

const STORAGE_KEY_PARCELS = "parcel_registration_parcels";
const STORAGE_KEY_SESSION_DRIVER = "parcel_registration_session_driver";

export const ParcelRegistration = (): JSX.Element => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Load from localStorage on mount
  const loadFromStorage = (): { parcels: ParcelFormData[]; sessionDriver: { driverName?: string; driverPhone?: string; vehicleNumber?: string } | null } => {
    try {
      const storedParcels = localStorage.getItem(STORAGE_KEY_PARCELS);
      const storedDriver = localStorage.getItem(STORAGE_KEY_SESSION_DRIVER);
      return {
        parcels: storedParcels ? JSON.parse(storedParcels) : [],
        sessionDriver: storedDriver ? JSON.parse(storedDriver) : null,
      };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return { parcels: [], sessionDriver: null };
    }
  };

  const { parcels: initialParcels, sessionDriver: initialDriver } = loadFromStorage();
  const [sessionDriver, setSessionDriver] = useState<{ driverName?: string; driverPhone?: string; vehicleNumber?: string } | null>(initialDriver);
  const [parcels, setParcels] = useState<ParcelFormData[]>(initialParcels);
  const [isSaved, setIsSaved] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Save to localStorage whenever parcels or sessionDriver changes
  useEffect(() => {
    if (parcels.length > 0 || sessionDriver) {
      try {
        localStorage.setItem(STORAGE_KEY_PARCELS, JSON.stringify(parcels));
        if (sessionDriver) {
          localStorage.setItem(STORAGE_KEY_SESSION_DRIVER, JSON.stringify(sessionDriver));
        } else {
          localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
        }
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    } else {
      // Clear storage if no data
      localStorage.removeItem(STORAGE_KEY_PARCELS);
      localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
    }
  }, [parcels, sessionDriver]);

  // Block navigation if there are unsaved parcels
  const hasUnsavedParcels = parcels.length > 0 && !isSaved;

  // Handle browser refresh/close - data is already saved to localStorage, so just warn
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedParcels) {
        e.preventDefault();
        e.returnValue = "You have unsaved parcels. Your data has been saved temporarily. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedParcels]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedParcels) {
        // Tab switched - data is already saved to localStorage
        console.log("Tab switched - parcel data saved to localStorage");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        driverPhone: parcelData.driverPhone,
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

  const handleSaveAll = async (additionalParcel?: ParcelFormData) => {
    // Combine existing parcels with additional parcel if provided
    const parcelsToSave = additionalParcel ? [...parcels, additionalParcel] : parcels;

    if (parcelsToSave.length === 0) {
      showToast("No parcels to save", "warning");
      return;
    }

    // Get office ID from user stored in localStorage
    const userData = authService.getUser();
    const officeId = (userData as any)?.office?.id;

    if (!officeId) {
      showToast("Office ID not found. Please ensure you are logged in with a valid account.", "error");
      return;
    }

    // Validate required fields for each parcel
    const invalidParcels = parcelsToSave.filter(p =>
      !p.recipientName ||
      !p.recipientPhone ||
      !p.shelfLocation ||
      (p.homeDelivery && (!p.deliveryCost || p.deliveryCost === undefined))
    );

    if (invalidParcels.length > 0) {
      showToast("Please ensure all required fields are filled for all parcels", "error");
      return;
    }

    setIsSaving(true);

    try {
      // Save all parcels to backend API
      const savePromises = parcelsToSave.map(async (parcelData) => {
        const parcelRequest = {
          senderName: parcelData.senderName || undefined,
          senderPhoneNumber: parcelData.senderPhone || "", // API requires this field
          receiverName: parcelData.recipientName,
          receiverAddress: parcelData.receiverAddress || undefined,
          recieverPhoneNumber: parcelData.recipientPhone, // Note: API has typo "reciever"
          parcelDescription: parcelData.itemDescription || undefined,
          driverName: parcelData.driverName || "",
          driverPhoneNumber: parcelData.driverPhone || "",
          inboundCost: parcelData.itemValue > 0 ? parcelData.itemValue : undefined,
          pickUpCost: 0, // Default to 0
          deliveryCost: parcelData.deliveryCost || undefined,
          storageCost: undefined,
          shelfNumber: parcelData.shelfLocation, // shelfLocation now contains shelf ID
          hasCalled: parcelData.hasCalled || false,
          homeDelivery: parcelData.homeDelivery || false,
          vehicleNumber: parcelData.vehicleNumber || "",
          officeId: officeId,
          pod: false,
          delivered: false,
          parcelAssigned: false,
          fragile: false,
        };

        return frontdeskService.addParcel(parcelRequest);
      });

      const results = await Promise.all(savePromises);

      // Check if all saves were successful
      const failedSaves = results.filter(r => !r.success);

      if (failedSaves.length > 0) {
        const errorMessages = failedSaves.map(r => r.message).join(", ");
        showToast(`Failed to save ${failedSaves.length} parcel(s): ${errorMessages}`, "error");
        return;
      }

      const parcelCount = parcelsToSave.length;
      const driverInfo = sessionDriver?.driverName
        ? ` for driver ${sessionDriver.driverName}`
        : "";

      showToast(`Successfully saved ${parcelCount} parcel${parcelCount > 1 ? "s" : ""}${driverInfo}!`, "success");

      // Clear everything and localStorage
      setParcels([]);
      setSessionDriver(null);
      setIsSaved(true);

      localStorage.removeItem(STORAGE_KEY_PARCELS);
      localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
    } catch (error: any) {
      console.error("Error saving parcels:", error);
      showToast("An error occurred while saving parcels. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard all unsaved parcels? This will also clear the temporarily saved data.")) {
      setParcels([]);
      setSessionDriver(null);
      setIsSaved(true);
      localStorage.removeItem(STORAGE_KEY_PARCELS);
      localStorage.removeItem(STORAGE_KEY_SESSION_DRIVER);
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
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Session Banner - Only show if there's an active session */}
        {sessionDriver && parcels.length > 0 && (
          <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 ">
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
                  <p className="text-sm text-neutral-700 mb-2">
                    You have {parcels.length} unsaved parcel{parcels.length > 1 ? "s" : ""}. Your data has been temporarily saved.
                  </p>
                  <p className="text-xs text-neutral-500">
                    What would you like to do?
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

        {/* Content Area */}
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
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};