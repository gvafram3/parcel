import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SaveIcon,
  PlusIcon,
  TrashIcon,
  Edit2Icon,
  PrinterIcon,
  PackageIcon,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { useStation } from "../../contexts/StationContext";
import { useLocation } from "../../contexts/LocationContext";
import { API_ENDPOINTS } from "../../config/api";
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/dataHelpers";

type ParcelTransferMode = "LOCAL" | "ONLINE";

interface ParcelTransferFormState {
  toOfficeId: string;
  mode: ParcelTransferMode;
  senderName: string;
  senderPhoneNumber: string;
  receiverName: string;
  recieverPhoneNumber: string;
  alternativePhoneNumber: string;
  deliveryAddress: string;
  parcelDescription: string;
  driverName: string;
  driverPhoneNumber: string;
  vehicleNumber: string;
  inboundCost: string;
  itemCost: string;
  pod: boolean;
}

interface BulkParcel {
  id: string;
  receiverName: string;
  recieverPhoneNumber: string;
  alternativePhoneNumber: string;
  deliveryAddress: string;
  parcelDescription: string;
  inboundCost: string;
  itemCost: string;
  pod: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  locationName: string;
  managerName: string;
  createdAt: number;
}

export const ParcelTransfer = (): JSX.Element => {
  const { showToast } = useToast();
  const { currentUser } = useStation();
  const { stations: cachedStations, loading: loadingStations } = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<ParcelTransferFormState>({
    toOfficeId: "",
    mode: "LOCAL",
    senderName: "",
    senderPhoneNumber: "",
    receiverName: "",
    recieverPhoneNumber: "",
    alternativePhoneNumber: "",
    deliveryAddress: "",
    parcelDescription: "",
    driverName: "",
    driverPhoneNumber: "",
    vehicleNumber: "",
    inboundCost: "",
    itemCost: "",
    pod: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkParcels, setBulkParcels] = useState<BulkParcel[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  
  // Filter out current user's station from cached stations
  const stations = (() => {
    const userData = authService.getUser();
    const userStationId = userData?.stationId || userData?.office?.id;
    return userStationId 
      ? cachedStations.filter((station) => station.id !== userStationId)
      : cachedStations;
  })();

  // Fetch stations on mount
  useEffect(() => {
    // Stations are now loaded from LocationContext cache
    // No need to fetch again
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('parcelTransferDraft', JSON.stringify({ form, bulkMode, bulkParcels, step }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, bulkMode, bulkParcels, step]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('parcelTransferDraft');
    if (draft) {
      const parsed = JSON.parse(draft);
      setForm(parsed.form);
      setBulkMode(parsed.bulkMode || false);
      setBulkParcels(parsed.bulkParcels || []);
      setStep(parsed.step || 1);
    }
  }, []);

  const handleChange =
    (field: keyof ParcelTransferFormState) =>
    (value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const totalAmount = (() => {
    if (bulkMode) {
      return bulkParcels.reduce((sum, parcel) => {
        const inbound = parseFloat(parcel.inboundCost || "0") || 0;
        const item = form.mode === "ONLINE" ? parseFloat(parcel.itemCost || "0") || 0 : 0;
        return sum + inbound + item;
      }, 0);
    }
    
    const inbound = parseFloat(form.inboundCost || "0") || 0;
    const item = form.mode === "ONLINE" ? parseFloat(form.itemCost || "0") || 0 : 0;
    return inbound + item;
  })();

  const validateStep = (currentStep: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (currentStep === 1) {
      if (!form.toOfficeId) newErrors.toOfficeId = "Destination station is required";
      if (!form.senderName) newErrors.senderName = "Sender name is required";
      if (!form.senderPhoneNumber) newErrors.senderPhoneNumber = "Sender phone is required";
      if (!form.driverName) newErrors.driverName = "Driver name is required";
      if (!form.vehicleNumber) newErrors.vehicleNumber = "Vehicle number is required";
      
      if (!bulkMode) {
        if (!form.receiverName) newErrors.receiverName = "Receiver name is required";
        if (!form.recieverPhoneNumber) newErrors.recieverPhoneNumber = "Receiver phone is required";
      } else {
        if (bulkParcels.length === 0) newErrors.bulkParcels = "Add at least one parcel";
      }
    }

    if (currentStep === 2) {
      if (bulkMode) {
        const missingPrices = bulkParcels.some(p => !p.inboundCost || (form.mode === "ONLINE" && !p.itemCost));
        if (missingPrices) {
          newErrors.bulkPricing = form.mode === "ONLINE" 
            ? "All parcels must have transportation cost and item cost"
            : "All parcels must have transportation cost";
        }
      } else {
        if (!form.inboundCost) newErrors.inboundCost = "Transportation cost is required";
        if (form.mode === "ONLINE" && !form.itemCost) newErrors.itemCost = "Item cost is required for online parcels";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const addBulkParcel = () => {
    if (!form.receiverName || !form.recieverPhoneNumber) {
      setErrors({ bulkAdd: "Receiver name and phone are required" });
      return;
    }
    
    const newParcel: BulkParcel = {
      id: Date.now().toString(),
      receiverName: form.receiverName,
      recieverPhoneNumber: form.recieverPhoneNumber,
      alternativePhoneNumber: form.alternativePhoneNumber,
      deliveryAddress: form.deliveryAddress,
      parcelDescription: form.parcelDescription,
      inboundCost: "",
      itemCost: "",
      pod: form.mode === "ONLINE",
    };
    
    setBulkParcels([...bulkParcels, newParcel]);
    // Clear receiver fields for next entry
    setForm(prev => ({
      ...prev,
      receiverName: "",
      recieverPhoneNumber: "",
      alternativePhoneNumber: "",
      deliveryAddress: "",
      parcelDescription: "",
    }));
    setErrors({});
  };

  const updateBulkParcelPrice = (id: string, field: 'inboundCost' | 'itemCost', value: string) => {
    setBulkParcels(bulkParcels.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateBulkParcelPOD = (id: string, value: boolean) => {
    setBulkParcels(bulkParcels.map(p => p.id === id ? { ...p, pod: value } : p));
  };

  const removeBulkParcel = (id: string) => {
    setBulkParcels(bulkParcels.filter(p => p.id !== id));
  };

  const clearDraft = () => {
    localStorage.removeItem('parcelTransferDraft');
  };

  const submitParcelTransfer = async () => {
    const userData = authService.getUser();
    const fromOfficeId = userData?.stationId || userData?.office?.id;

    if (!fromOfficeId) {
      showToast("Error: User station not found", "error");
      return;
    }

    const token = authService.getToken();
    if (!token) {
      showToast("Error: Authentication token not found", "error");
      return;
    }

    setSubmitting(true);

    try {
      if (bulkMode) {
        // Submit multiple parcels
        const promises = bulkParcels.map((parcel) => {
          const payload = {
            senderName: form.senderName,
            senderPhoneNumber: form.senderPhoneNumber,
            receiverName: parcel.receiverName,
            recieverPhoneNumber: parcel.recieverPhoneNumber,
            alternativePhoneNumber: parcel.alternativePhoneNumber || undefined,
            deliveryAddress: parcel.deliveryAddress,
            parcelDescription: parcel.parcelDescription,
            driverName: form.driverName,
            driverPhoneNumber: form.driverPhoneNumber,
            vehicleNumber: form.vehicleNumber,
            deliveryCost: 0,
            inboundCost: parseFloat(parcel.inboundCost || "0"),
            itemCost: parcel.pod ? parseFloat(parcel.itemCost || "0") : 0,
            pod: parcel.pod,
            fromOfficeId,
            toOfficeId: form.toOfficeId,
            typeofParcel: parcel.pod ? "ONLINE" : "PARCEL",
            hasArrivedAtOffice: false,
            parcelTransfer: true,
          };

          return axios.post(`${API_ENDPOINTS.FRONTDESK}/parcel`, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        });

        await Promise.all(promises);
        showToast(`Successfully registered ${bulkParcels.length} parcels`, "success");
      } else {
        // Submit single parcel
        const payload = {
          senderName: form.senderName,
          senderPhoneNumber: form.senderPhoneNumber,
          receiverName: form.receiverName,
          recieverPhoneNumber: form.recieverPhoneNumber,
          alternativePhoneNumber: form.alternativePhoneNumber || undefined,
          deliveryAddress: form.deliveryAddress,
          parcelDescription: form.parcelDescription,
          driverName: form.driverName,
          driverPhoneNumber: form.driverPhoneNumber,
          vehicleNumber: form.vehicleNumber,
          deliveryCost: 0,
          inboundCost: parseFloat(form.inboundCost || "0"),
          itemCost: form.pod ? parseFloat(form.itemCost || "0") : 0,
          pod: form.pod,
          fromOfficeId,
          toOfficeId: form.toOfficeId,
          typeofParcel: form.pod ? "ONLINE" : "PARCEL",
          hasArrivedAtOffice: false,
          parcelTransfer: true,
        };

        console.log("Parcel Transfer Payload:", payload);
        console.log("POD Status:", form.pod, "| Item Cost Field Value:", form.itemCost, "| Parsed Item Cost:", form.pod ? parseFloat(form.itemCost || "0") : 0);

        await axios.post(`${API_ENDPOINTS.FRONTDESK}/parcel`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        showToast("Parcel registered successfully", "success");
      }

      return true;
    } catch (error: any) {
      console.error("Parcel transfer error:", error);
      showToast(
        error.response?.data?.message || "Failed to register parcel. Please try again.",
        "error"
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const editStep = (stepNumber: number) => {
    setStep(stepNumber as 1 | 2 | 3);
    setEditingStep(stepNumber);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const generateTrackingNumber = () => {
    const prefix = "MM";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleFinish = async () => {
    // Submit to API
    const success = await submitParcelTransfer();
    
    if (success) {
      // Generate tracking number
      const tracking = generateTrackingNumber();
      setTrackingNumber(tracking);
      
      // Clear draft after successful submission
      clearDraft();
      
      // Show print preview
      setShowPrintPreview(true);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Parcel Label</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .page-break {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleNewTransfer = () => {
    // Reset form
    setForm({
      toOfficeId: "",
      mode: "LOCAL",
      senderName: "",
      senderPhoneNumber: "",
      receiverName: "",
      recieverPhoneNumber: "",
      alternativePhoneNumber: "",
      deliveryAddress: "",
      parcelDescription: "",
      driverName: "",
      driverPhoneNumber: "",
      vehicleNumber: "",
      inboundCost: "",
      itemCost: "",
      pod: false,
    });
    setBulkParcels([]);
    setBulkMode(false);
    setStep(1);
    setShowPrintPreview(false);
    setTrackingNumber("");
    clearDraft();
  };

  const currentStationLabel =
    stations.find((s) => s.id === form.toOfficeId)?.name ||
    "Select a destination";

  return (
    <div className="w-full">
      {/* Loading Modal */}
      {loadingStations && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#ea690c] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-neutral-800 mb-1">Loading Stations</p>
                <p className="text-sm text-gray-600">Please wait while we fetch available stations...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-neutral-800">
                Initiate Parcel Transfer
              </h1>
              <p className="text-xs text-[#5d5d5d]">
                Register a parcel for transfer to another station
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/incoming-parcels")}
                variant="outline"
                className="flex items-center gap-2 border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
              >
                <PackageIcon className="h-4 w-4" />
                <span>View Incoming</span>
              </Button>
              <Button
                onClick={() => navigate("/outgoing-parcels")}
                variant="outline"
                className="flex items-center gap-2 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
              >
                <PackageIcon className="h-4 w-4" />
                <span>View Outgoing</span>
              </Button>
            </div>
          </div>
          
          {/* Draft indicator */}
          {localStorage.getItem('parcelTransferDraft') && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 text-xs">
              <span className="text-blue-800">📝 Draft auto-saved</span>
              <button
                onClick={clearDraft}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Draft
              </button>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e4e4e4] bg-white px-4 py-3 text-xs sm:text-sm">
          {[
            { id: 1, label: "Parcel Details" },
            { id: 2, label: "Costs and POD" },
            { id: 3, label: "Review & Submit" },
          ].map((s) => (
            <div
              key={s.id}
              className="flex flex-1 items-center justify-center gap-2"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  step === s.id
                    ? "bg-[#ea690c] text-white scale-110"
                    : step > s.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step > s.id ? <CheckCircleIcon className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden sm:inline transition-all duration-300 ${
                  step === s.id ? "font-semibold text-neutral-900" : "text-[#5d5d5d]"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#ea690c]">
                  New Parcel Transfer
                </span>
              </div>

              {/* Station information */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Station Information
                </h2>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-800">
                    Destination Station <span className="text-[#e22420]">*</span>
                  </Label>
                  <select
                    className={`w-full rounded border bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#ea690c] ${errors.toOfficeId ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    value={form.toOfficeId}
                    onChange={(e) =>
                      handleChange("toOfficeId")(e.target.value)
                    }
                    disabled={loadingStations}
                  >
                    <option value="" disabled>
                      {loadingStations ? "Loading stations..." : "Select a destination"}
                    </option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.locationName}
                      </option>
                    ))}
                  </select>
                  {errors.toOfficeId && (
                    <p className="text-xs text-red-600">{errors.toOfficeId}</p>
                  )}
                </div>
              </section>

              {/* Bulk mode toggle */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Transfer Mode
                  </h2>
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={bulkMode}
                      onChange={(e) => setBulkMode(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Bulk Transfer Mode
                  </label>
                </div>
              </section>

              {/* Sender details */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Sender&apos;s Details
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Sender Name <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="John Smith"
                      value={form.senderName}
                      onChange={(e) => handleChange("senderName")(e.target.value)}
                      className={`border ${errors.senderName ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.senderName && (
                      <p className="text-xs text-red-600">{errors.senderName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Sender Phone number <span className="text-[#e22420]">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        type="tel"
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        value={form.senderPhoneNumber?.startsWith("+233") ? form.senderPhoneNumber.substring(4) : (form.senderPhoneNumber || "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                          const normalized = normalizePhoneNumber(digits);
                          handleChange("senderPhoneNumber")(normalized);
                        }}
                        className={`pl-14 pr-3 border ${errors.senderPhoneNumber ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                        maxLength={10}
                      />
                    </div>
                    {errors.senderPhoneNumber && (
                      <p className="text-xs text-red-600">{errors.senderPhoneNumber}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Receiver details */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Receiver&apos;s Details
                  </h2>
                  {bulkMode && bulkParcels.length > 0 && (
                    <span className="text-xs text-[#5d5d5d]">
                      {bulkParcels.length} parcel(s) added
                    </span>
                  )}
                </div>
                
                {errors.bulkParcels && (
                  <p className="text-xs text-red-600">{errors.bulkParcels}</p>
                )}
                {errors.bulkAdd && (
                  <p className="text-xs text-red-600">{errors.bulkAdd}</p>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Receiver Name <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="John Doe"
                      value={form.receiverName}
                      onChange={(e) => handleChange("receiverName")(e.target.value)}
                      className={`border ${errors.receiverName ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.receiverName && (
                      <p className="text-xs text-red-600">{errors.receiverName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Receiver Phone number{" "}
                      <span className="text-[#e22420]">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        type="tel"
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        value={form.recieverPhoneNumber?.startsWith("+233") ? form.recieverPhoneNumber.substring(4) : (form.recieverPhoneNumber || "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                          const normalized = normalizePhoneNumber(digits);
                          handleChange("recieverPhoneNumber")(normalized);
                        }}
                        className={`pl-14 pr-3 border ${errors.recieverPhoneNumber ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                        maxLength={10}
                      />
                    </div>
                    {errors.recieverPhoneNumber && (
                      <p className="text-xs text-red-600">{errors.recieverPhoneNumber}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Alternative Phone
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        type="tel"
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        value={form.alternativePhoneNumber?.startsWith("+233") ? form.alternativePhoneNumber.substring(4) : (form.alternativePhoneNumber || "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                          const normalized = digits ? normalizePhoneNumber(digits) : "";
                          handleChange("alternativePhoneNumber")(normalized);
                        }}
                        className="pl-14 pr-3 border border-[#d1d1d1]"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Delivery Address
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Enter address"
                      value={form.deliveryAddress}
                      onChange={(e) => handleChange("deliveryAddress")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Parcel Description
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Describe the item(s) being sent"
                      value={form.parcelDescription}
                      onChange={(e) => handleChange("parcelDescription")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
                  </div>
                </div>
                
                {/* Bulk mode: Add parcel button and list */}
                {bulkMode && (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={addBulkParcel}
                      className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Parcel to Batch
                    </Button>
                    
                    {bulkParcels.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-neutral-800">Parcels in Batch:</h3>
                        {bulkParcels.map((parcel, idx) => (
                          <div key={parcel.id} className="flex items-center justify-between rounded-lg border border-[#d1d1d1] bg-gray-50 px-3 py-2">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-neutral-800">
                                {idx + 1}. {parcel.receiverName} - {parcel.recieverPhoneNumber}
                              </p>
                              {parcel.alternativePhoneNumber && (
                                <p className="text-[11px] text-[#5d5d5d]">Alt: {parcel.alternativePhoneNumber}</p>
                              )}
                              {parcel.deliveryAddress && (
                                <p className="text-[11px] text-[#5d5d5d]">{parcel.deliveryAddress}</p>
                              )}
                              {parcel.parcelDescription && (
                                <p className="text-[11px] text-[#5d5d5d] italic">Item: {parcel.parcelDescription}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeBulkParcel(parcel.id)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Driver details */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Driver&apos;s Information
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Driver Name <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="John Smith"
                      value={form.driverName}
                      onChange={(e) => handleChange("driverName")(e.target.value)}
                      className={`border ${errors.driverName ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.driverName && (
                      <p className="text-xs text-red-600">{errors.driverName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Driver Phone
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        type="tel"
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        value={form.driverPhoneNumber?.startsWith("+233") ? form.driverPhoneNumber.substring(4) : (form.driverPhoneNumber || "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                          const normalized = normalizePhoneNumber(digits);
                          handleChange("driverPhoneNumber")(normalized);
                        }}
                        className="pl-14 pr-3 border border-[#d1d1d1]"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Vehicle Number <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="AK-1234-25"
                      value={form.vehicleNumber}
                      onChange={(e) => handleChange("vehicleNumber")(e.target.value)}
                      className={`border ${errors.vehicleNumber ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.vehicleNumber && (
                      <p className="text-xs text-red-600">{errors.vehicleNumber}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Navigation */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleNext}
                  className="flex w-full items-center justify-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 sm:w-auto"
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#ea690c]">
                  Costs &amp; Payment On Delivery (POD)
                </span>
              </div>

              {/* Parcel Type Selection */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Parcel Type
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="radio"
                      name="parcelType"
                      value="LOCAL"
                      checked={form.mode === "LOCAL"}
                      onChange={() => {
                        handleChange("mode")("LOCAL");
                        handleChange("pod")(false);
                      }}
                    />
                    Local Parcel
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="radio"
                      name="parcelType"
                      value="ONLINE"
                      checked={form.mode === "ONLINE"}
                      onChange={() => {
                        handleChange("mode")("ONLINE");
                        handleChange("pod")(true);
                      }}
                    />
                    Online Parcel (POD)
                  </label>
                </div>
                {form.mode === "ONLINE" && (
                  <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    Online parcels automatically enable POD. Sender&apos;s name should be the name of the online company
                    (e.g. Jumia, Alibaba). The recipient will pay the item cost plus delivery cost on delivery.
                  </p>
                )}
              </section>

              {errors.bulkPricing && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded">{errors.bulkPricing}</p>
              )}

              {/* Bulk mode: Individual parcel pricing */}
              {bulkMode ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Set Prices for Each Parcel
                  </h3>
                  <div className="space-y-4">
                    {bulkParcels.map((parcel, idx) => (
                      <div key={parcel.id} className="border border-[#d1d1d1] rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-neutral-800">
                            Parcel {idx + 1}: {parcel.receiverName}
                          </h4>
                          <span className="text-xs text-[#5d5d5d]">{parcel.recieverPhoneNumber}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-800">
                              Transportation Cost <span className="text-[#e22420]">*</span>
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="eg. 30"
                              value={parcel.inboundCost}
                              onChange={(e) => updateBulkParcelPrice(parcel.id, 'inboundCost', e.target.value)}
                              className="border border-[#d1d1d1]"
                            />
                          </div>
                          {form.mode === "ONLINE" && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-neutral-800">
                                Item Cost <span className="text-[#e22420]">*</span>
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="eg. 350"
                                value={parcel.itemCost}
                                onChange={(e) => updateBulkParcelPrice(parcel.id, 'itemCost', e.target.value)}
                                className="border border-[#d1d1d1]"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-xs text-[#5d5d5d]">Subtotal: </span>
                          <span className="text-sm font-bold text-[#ea690c]">
                            GHC {(
                              (parseFloat(parcel.inboundCost || "0") || 0) +
                              (form.mode === "ONLINE" ? (parseFloat(parcel.itemCost || "0") || 0) : 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                /* Single parcel pricing */
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Pricing
                  </h3>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Transportation Cost <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="eg. 30"
                      value={form.inboundCost}
                      onChange={(e) =>
                        handleChange("inboundCost")(e.target.value)
                      }
                      className={`border ${errors.inboundCost ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.inboundCost && (
                      <p className="text-xs text-red-600">{errors.inboundCost}</p>
                    )}
                  </div>

                  {form.mode === "ONLINE" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Item Cost (Cost of Product){" "}
                        <span className="text-[#e22420]">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="eg. 350"
                        value={form.itemCost}
                        onChange={(e) => handleChange("itemCost")(e.target.value)}
                        className={`border ${errors.itemCost ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                      />
                      {errors.itemCost && (
                        <p className="text-xs text-red-600">{errors.itemCost}</p>
                      )}
                      <p className="text-[11px] text-[#5d5d5d]">
                        This amount will be collected from the recipient upon delivery.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Summary */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Summary
                </h3>
                {bulkMode ? (
                  <div className="space-y-2">
                    {bulkParcels.map((parcel, idx) => {
                      const parcelTotal = 
                        (parseFloat(parcel.inboundCost || "0") || 0) +
                        (parcel.pod ? (parseFloat(parcel.itemCost || "0") || 0) : 0);
                      return (
                        <div key={parcel.id} className="flex justify-between text-xs text-[#5d5d5d] border-b border-gray-200 pb-1">
                          <span>Parcel {idx + 1} ({parcel.receiverName})</span>
                          <span>GHC {parcelTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                      <span>Total Amount ({bulkParcels.length} parcels)</span>
                      <span>GHC {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-xs text-[#5d5d5d]">
                    <div className="flex justify-between">
                      <span>Transportation cost</span>
                      <span>GHC {parseFloat(form.inboundCost || "0").toFixed(2)}</span>
                    </div>
                    {form.pod && (
                      <div className="flex justify-between">
                        <span>Item cost (POD)</span>
                        <span>
                          GHC {parseFloat(form.itemCost || "0").toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                      <span>Total Amount</span>
                      <span>GHC {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Navigation */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex w-full items-center justify-center gap-2 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50 sm:w-auto"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex w-full items-center justify-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 sm:w-auto"
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#ea690c]">
                  Review Parcel Registered
                </span>
                <span className="text-xs text-[#5d5d5d]">
                  Click any section to edit
                </span>
              </div>

              {/* Station details */}
              <section className="space-y-2 text-xs text-neutral-700 rounded-lg border border-[#e4e4e4] p-4 hover:border-[#ea690c] transition-colors cursor-pointer" onClick={() => editStep(1)}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Station Details
                  </h2>
                  <Edit2Icon className="h-4 w-4 text-[#ea690c]" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">From</p>
                    <p className="text-sm text-neutral-900">Current Station</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">To</p>
                    <p className="text-sm text-neutral-900">{currentStationLabel}</p>
                  </div>
                </div>
              </section>

              {/* Sender details */}
              <section className="space-y-2 text-xs text-neutral-700 rounded-lg border border-[#e4e4e4] p-4 hover:border-[#ea690c] transition-colors cursor-pointer" onClick={() => editStep(1)}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Sender&apos;s Details
                  </h2>
                  <Edit2Icon className="h-4 w-4 text-[#ea690c]" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">Name</p>
                    <p className="text-sm text-neutral-900">
                      {form.senderName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">
                      Phone Number
                    </p>
                    <p className="text-sm text-neutral-900">
                      {form.senderPhoneNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">Mode</p>
                    <p className="text-sm text-neutral-900">
                      {form.mode === "LOCAL" ? "Local Parcel" : "Online Parcel"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Receiver details */}
              <section className="space-y-2 text-xs text-neutral-700 rounded-lg border border-[#e4e4e4] p-4 hover:border-[#ea690c] transition-colors cursor-pointer" onClick={() => editStep(1)}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Receiver&apos;s Details {bulkMode && `(${bulkParcels.length} parcels)`}
                  </h2>
                  <Edit2Icon className="h-4 w-4 text-[#ea690c]" />
                </div>
                {bulkMode ? (
                  <div className="space-y-2">
                    {bulkParcels.map((parcel, idx) => (
                      <div key={parcel.id} className="rounded bg-gray-50 p-2">
                        <p className="text-xs font-medium text-neutral-900">
                          {idx + 1}. {parcel.receiverName} - {parcel.recieverPhoneNumber}
                        </p>
                        {parcel.alternativePhoneNumber && (
                          <p className="text-[11px] text-[#5d5d5d]">Alt: {parcel.alternativePhoneNumber}</p>
                        )}
                        {parcel.deliveryAddress && (
                          <p className="text-[11px] text-[#5d5d5d]">{parcel.deliveryAddress}</p>
                        )}
                        {parcel.parcelDescription && (
                          <p className="text-[11px] text-[#5d5d5d] italic">Item: {parcel.parcelDescription}</p>
                        )}
                        <div className="mt-1 text-[11px] text-[#5d5d5d]">
                          Transport: GHC {parseFloat(parcel.inboundCost || "0").toFixed(2)}
                          {parcel.pod && ` | Item (POD): GHC ${parseFloat(parcel.itemCost || "0").toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase text-[#9a9a9a]">Name</p>
                      <p className="text-sm text-neutral-900">
                        {form.receiverName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-[#9a9a9a]">
                        Phone Number
                      </p>
                      <p className="text-sm text-neutral-900">
                        {form.recieverPhoneNumber || "—"}
                      </p>
                      {form.alternativePhoneNumber && (
                        <p className="text-xs text-[#5d5d5d] mt-0.5">
                          Alt: {form.alternativePhoneNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-[#9a9a9a]">Address</p>
                      <p className="text-sm text-neutral-900">
                        {form.deliveryAddress || "—"}
                      </p>
                    </div>
                    {form.parcelDescription && (
                      <div className="md:col-span-3">
                        <p className="text-[11px] uppercase text-[#9a9a9a]">Parcel Description</p>
                        <p className="text-sm text-neutral-900">
                          {form.parcelDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Driver details */}
              <section className="space-y-2 text-xs text-neutral-700 rounded-lg border border-[#e4e4e4] p-4 hover:border-[#ea690c] transition-colors cursor-pointer" onClick={() => editStep(1)}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Driver Details
                  </h2>
                  <Edit2Icon className="h-4 w-4 text-[#ea690c]" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">Name</p>
                    <p className="text-sm text-neutral-900">
                      {form.driverName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">
                      Phone Number
                    </p>
                    <p className="text-sm text-neutral-900">
                      {form.driverPhoneNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#9a9a9a]">
                      Vehicle Number
                    </p>
                    <p className="text-sm text-neutral-900">
                      {form.vehicleNumber || "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Fee breakdown */}
              <section className="space-y-2 text-xs text-neutral-700 rounded-lg border border-[#e4e4e4] p-4 hover:border-[#ea690c] transition-colors cursor-pointer" onClick={() => editStep(2)}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Fee Breakdown
                  </h2>
                  <Edit2Icon className="h-4 w-4 text-[#ea690c]" />
                </div>
                {bulkMode ? (
                  <div className="space-y-2">
                    {bulkParcels.map((parcel, idx) => {
                      const parcelTotal = 
                        (parseFloat(parcel.inboundCost || "0") || 0) +
                        (parcel.pod ? (parseFloat(parcel.itemCost || "0") || 0) : 0);
                      return (
                        <div key={parcel.id} className="border-b border-gray-200 pb-2">
                          <p className="text-xs font-medium text-neutral-800 mb-1">
                            Parcel {idx + 1}: {parcel.receiverName}
                          </p>
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex justify-between">
                              <span>Transportation cost</span>
                              <span>GHC {parseFloat(parcel.inboundCost || "0").toFixed(2)}</span>
                            </div>
                            {parcel.pod && (
                              <div className="flex justify-between">
                                <span>Item cost (POD)</span>
                                <span>GHC {parseFloat(parcel.itemCost || "0").toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-[#ea690c]">
                              <span>Subtotal</span>
                              <span>GHC {parcelTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                      <span>Total Amount ({bulkParcels.length} parcels)</span>
                      <span>GHC {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Package fee</span>
                      <span>
                        GHC {parseFloat(form.inboundCost || "0").toFixed(2)}
                      </span>
                    </div>
                    {form.pod && (
                      <div className="flex justify-between">
                        <span>Item cost (POD)</span>
                        <span>
                          GHC {parseFloat(form.itemCost || "0").toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                      <span>Total Amount</span>
                      <span>GHC {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Navigation */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex w-full items-center justify-center gap-2 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50 sm:w-auto"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Finish & Print Label</span>
                      <CheckCircleIcon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Print Preview Modal */}
        {showPrintPreview && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-800">Print Parcel Labels</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    onClick={handleNewTransfer}
                    variant="outline"
                    className="border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                  >
                    New Transfer
                  </Button>
                </div>
              </div>
              
              <div className="p-6" ref={printRef}>
                {bulkMode ? (
                  <div className="space-y-6">
                    {bulkParcels.map((parcel, idx) => (
                      <div key={parcel.id}>
                        <ParcelLabel
                          trackingNumber={`${trackingNumber}-${idx + 1}`}
                          form={form}
                          receiver={{
                            name: parcel.receiverName,
                            phone: parcel.recieverPhoneNumber,
                            address: parcel.deliveryAddress,
                          }}
                          parcelDescription={parcel.parcelDescription}
                          inboundCost={parcel.inboundCost}
                          itemCost={parcel.itemCost}
                          pod={parcel.pod}
                          currentStationLabel={currentStationLabel}
                          totalAmount={(parseFloat(parcel.inboundCost || "0") || 0) + (parcel.pod ? (parseFloat(parcel.itemCost || "0") || 0) : 0)}
                        />
                        {idx < bulkParcels.length - 1 && (
                          <div className="page-break border-t-2 border-dashed border-gray-300 my-6" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <ParcelLabel
                      trackingNumber={trackingNumber}
                      form={form}
                      receiver={{
                        name: form.receiverName,
                        phone: form.recieverPhoneNumber,
                        address: form.deliveryAddress,
                      }}
                      parcelDescription={form.parcelDescription}
                      inboundCost={form.inboundCost}
                      itemCost={form.itemCost}
                      pod={form.pod}
                      currentStationLabel={currentStationLabel}
                      totalAmount={totalAmount}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Parcel Label Component for printing
interface ParcelLabelProps {
  trackingNumber: string;
  form: ParcelTransferFormState;
  receiver: {
    name: string;
    phone: string;
    address: string;
  };
  parcelDescription: string;
  inboundCost: string;
  itemCost: string;
  pod: boolean;
  currentStationLabel: string;
  totalAmount: number;
}

const ParcelLabel: React.FC<ParcelLabelProps> = ({
  trackingNumber,
  form,
  receiver,
  parcelDescription,
  inboundCost,
  itemCost,
  pod,
  currentStationLabel,
  totalAmount,
}) => {
  return (
    <div className="bg-white border-2 border-black p-6 print:border print:p-4">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src="/logo-1.png"
            alt="M&M Logo"
            className="h-16 w-16 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-black">
              Mealex & Mailex (M&M)
            </h1>
            <p className="text-sm text-black">Parcel Delivery System</p>
          </div>
        </div>
      </div>

      {/* Tracking Number - Large and prominent */}
      <div className="text-center mb-4 bg-black text-white py-3 px-4">
        <p className="text-xs font-semibold mb-1">TRACKING NUMBER</p>
        <p className="text-3xl font-bold tracking-wider">{trackingNumber}</p>
      </div>

      {/* Route Information */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-2 border-black p-3">
        <div>
          <p className="text-xs font-bold text-black mb-1">FROM:</p>
          <p className="text-sm font-semibold text-black">Current Station</p>
        </div>
        <div>
          <p className="text-xs font-bold text-black mb-1">TO:</p>
          <p className="text-sm font-semibold text-black">{currentStationLabel}</p>
        </div>
      </div>

      {/* Sender & Receiver */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border-2 border-black p-3">
          <p className="text-xs font-bold text-black mb-2">SENDER</p>
          <p className="text-sm font-semibold text-black">{form.senderName}</p>
          <p className="text-xs text-black">{form.senderPhoneNumber}</p>
        </div>
        <div className="border-2 border-black p-3">
          <p className="text-xs font-bold text-black mb-2">RECEIVER</p>
          <p className="text-sm font-semibold text-black">{receiver.name}</p>
          <p className="text-xs text-black">{receiver.phone}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {receiver.address && (
        <div className="border-2 border-black p-3 mb-4">
          <p className="text-xs font-bold text-black mb-1">DELIVERY ADDRESS:</p>
          <p className="text-sm text-black">{receiver.address}</p>
        </div>
      )}

      {/* Item Description */}
      {parcelDescription && (
        <div className="border-2 border-black p-3 mb-4">
          <p className="text-xs font-bold text-black mb-1">ITEM DESCRIPTION:</p>
          <p className="text-sm text-black">{parcelDescription}</p>
        </div>
      )}

      {/* Transport & Driver Info */}
      <div className="border border-black p-2 mb-4">
        <p className="text-xs font-bold text-black">VEHICLE:</p>
        <p className="text-sm text-black">{form.vehicleNumber}</p>
      </div>

      <div className="border border-black p-2 mb-4">
        <p className="text-xs font-bold text-black">DRIVER:</p>
        <p className="text-sm text-black">
          {form.driverName} {form.driverPhoneNumber && `- ${form.driverPhoneNumber}`}
        </p>
      </div>

      {/* Payment Details */}
      <div className="border-2 border-black p-3 mb-4">
        <p className="text-xs font-bold text-black mb-2">PAYMENT DETAILS</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black">Transportation Cost:</span>
            <span className="font-semibold text-black">
              GHC {parseFloat(inboundCost || "0").toFixed(2)}
            </span>
          </div>
          {pod && (
            <div className="flex justify-between">
              <span className="text-black">Item Cost (POD):</span>
              <span className="font-semibold text-black">
                GHC {parseFloat(itemCost || "0").toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-2 mt-2">
            <span className="font-bold text-black">TOTAL AMOUNT:</span>
            <span className="font-bold text-lg text-black">
              GHC {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Parcel Type Badge */}
      <div className="text-center">
        <span className="inline-block bg-black text-white px-4 py-2 text-sm font-bold">
          {pod ? "POD PARCEL" : "REGULAR PARCEL"}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-black text-center">
        <p className="text-xs text-black">
          Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}
        </p>
        <p className="text-xs text-black mt-1">
          For inquiries, contact M&M Parcel Services
        </p>
      </div>
    </div>
  );
};
