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
} from "lucide-react";
import locationService from "../../services/locationService";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { useStation } from "../../contexts/StationContext";

type ParcelTransferMode = "LOCAL" | "ONLINE";

interface ParcelTransferFormState {
  destinationStationId: string;
  mode: ParcelTransferMode;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  packageFee: string;
  transportationFee: string;
  itemValue: string; // for ONLINE mode
  pod: boolean;
}

interface BulkParcel {
  id: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  packageFee: string;
  itemValue: string;
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<ParcelTransferFormState>({
    destinationStationId: "",
    mode: "LOCAL",
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    packageFee: "",
    transportationFee: "",
    itemValue: "",
    pod: false,
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkParcels, setBulkParcels] = useState<BulkParcel[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  // Fetch stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      setLoadingStations(true);
      try {
        const response = await locationService.getAllStations();
        if (response.success && response.data) {
          // Get current user's station ID from stationId or office.id
          const userData = authService.getUser();
          const userStationId = userData?.stationId || userData?.office?.id;
          
          console.log('Full user data:', userData);
          console.log('User station ID:', userStationId);
          
          // Filter out current user's station
          const filteredStations = userStationId 
            ? response.data.filter((station) => station.id !== userStationId)
            : response.data;
          
          console.log('All stations:', response.data.map(s => ({ id: s.id, name: s.name })));
          console.log('Filtered stations:', filteredStations.map(s => ({ id: s.id, name: s.name })));
          
          setStations(filteredStations);
        } else {
          showToast("Failed to load stations", "error");
        }
      } catch (error) {
        showToast("Error loading stations", "error");
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
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
    const pkg = parseFloat(form.packageFee || "0") || 0;
    const transport = parseFloat(form.transportationFee || "0") || 0;
    const item = form.mode === "ONLINE" ? parseFloat(form.itemValue || "0") || 0 : 0;
    return pkg + transport + item;
  })();

  const validateStep = (currentStep: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (currentStep === 1) {
      if (!form.destinationStationId) newErrors.destinationStationId = "Destination station is required";
      if (!form.senderName) newErrors.senderName = "Sender name is required";
      if (!form.senderPhone) newErrors.senderPhone = "Sender phone is required";
      if (!form.driverName) newErrors.driverName = "Driver name is required";
      if (!form.vehicleNumber) newErrors.vehicleNumber = "Vehicle number is required";
      
      if (!bulkMode) {
        if (!form.receiverName) newErrors.receiverName = "Receiver name is required";
        if (!form.receiverPhone) newErrors.receiverPhone = "Receiver phone is required";
      } else {
        if (bulkParcels.length === 0) newErrors.bulkParcels = "Add at least one parcel";
      }
    }

    if (currentStep === 2) {
      if (!form.packageFee) newErrors.packageFee = "Package fee is required";
      if (!form.transportationFee) newErrors.transportationFee = "Transportation fee is required";
      if (form.mode === "ONLINE" && !form.itemValue) newErrors.itemValue = "Item value is required for online parcels";
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
    if (!form.receiverName || !form.receiverPhone) {
      setErrors({ bulkAdd: "Receiver name and phone are required" });
      return;
    }
    
    const newParcel: BulkParcel = {
      id: Date.now().toString(),
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      receiverAddress: form.receiverAddress,
      packageFee: form.packageFee,
      itemValue: form.itemValue,
    };
    
    setBulkParcels([...bulkParcels, newParcel]);
    // Clear receiver fields for next entry
    setForm(prev => ({
      ...prev,
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      packageFee: "",
      itemValue: "",
    }));
    setErrors({});
  };

  const removeBulkParcel = (id: string) => {
    setBulkParcels(bulkParcels.filter(p => p.id !== id));
  };

  const clearDraft = () => {
    localStorage.removeItem('parcelTransferDraft');
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

  const handleFinish = () => {
    // Generate tracking number
    const tracking = generateTrackingNumber();
    setTrackingNumber(tracking);
    
    // For now we just log; backend integration will be added later
    // eslint-disable-next-line no-console
    console.log("Parcel transfer payload:", bulkMode ? { ...form, bulkParcels, trackingNumber: tracking } : { ...form, trackingNumber: tracking });
    
    // Show print preview
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewTransfer = () => {
    // Reset form
    setForm({
      destinationStationId: "",
      mode: "LOCAL",
      senderName: "",
      senderPhone: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      driverName: "",
      driverPhone: "",
      vehicleNumber: "",
      packageFee: "",
      transportationFee: "",
      itemValue: "",
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
    stations.find((s) => s.id === form.destinationStationId)?.name ||
    "Select a destination";

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-neutral-800">
              Initiate Parcel Transfer
            </h1>
            <p className="text-xs text-[#5d5d5d]">
              Register a parcel for transfer to another station
            </p>
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
                    className={`w-full rounded border bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#ea690c] ${errors.destinationStationId ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    value={form.destinationStationId}
                    onChange={(e) =>
                      handleChange("destinationStationId")(e.target.value)
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
                  {errors.destinationStationId && (
                    <p className="text-xs text-red-600">{errors.destinationStationId}</p>
                  )}
                </div>
              </section>

              {/* Parcel type and Bulk mode */}
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
                      onChange={() => handleChange("mode")("LOCAL")}
                    />
                    Local Parcel
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="radio"
                      name="parcelType"
                      value="ONLINE"
                      checked={form.mode === "ONLINE"}
                      onChange={() => handleChange("mode")("ONLINE")}
                    />
                    Online Parcel
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-800 ml-auto">
                    <input
                      type="checkbox"
                      checked={bulkMode}
                      onChange={(e) => setBulkMode(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Bulk Transfer Mode
                  </label>
                </div>
                {form.mode === "ONLINE" && (
                  <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    Sender&apos;s name should be the name of the online company
                    (e.g. Jumia, Alibaba). The recipient will pay the item cost
                    plus delivery and driver cost on delivery.
                  </p>
                )}
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
                    <Input
                      placeholder="+233 24 245 8248"
                      value={form.senderPhone}
                      onChange={(e) => handleChange("senderPhone")(e.target.value)}
                      className={`border ${errors.senderPhone ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.senderPhone && (
                      <p className="text-xs text-red-600">{errors.senderPhone}</p>
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
                    <Input
                      placeholder="+233 24 245 8248"
                      value={form.receiverPhone}
                      onChange={(e) => handleChange("receiverPhone")(e.target.value)}
                      className={`border ${errors.receiverPhone ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.receiverPhone && (
                      <p className="text-xs text-red-600">{errors.receiverPhone}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Receiver Address
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Enter address"
                      value={form.receiverAddress}
                      onChange={(e) => handleChange("receiverAddress")(e.target.value)}
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
                                {idx + 1}. {parcel.receiverName} - {parcel.receiverPhone}
                              </p>
                              {parcel.receiverAddress && (
                                <p className="text-[11px] text-[#5d5d5d]">{parcel.receiverAddress}</p>
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
                    <Input
                      placeholder="+233 24 245 8248"
                      value={form.driverPhone}
                      onChange={(e) => handleChange("driverPhone")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
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

              {/* POD toggle explanation */}
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Payment on Delivery (POD)
                </h2>
                <p className="text-xs text-[#5d5d5d]">
                  For online parcels, the recipient pays the item value plus
                  delivery and transportation fee upon successful delivery.
                </p>
              </section>

              {/* Fees */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Delivery Fee
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Package Fee <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="eg. 100"
                      value={form.packageFee}
                      onChange={(e) => handleChange("packageFee")(e.target.value)}
                      className={`border ${errors.packageFee ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.packageFee && (
                      <p className="text-xs text-red-600">{errors.packageFee}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Transportation Fee <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="eg. 30"
                      value={form.transportationFee}
                      onChange={(e) =>
                        handleChange("transportationFee")(e.target.value)
                      }
                      className={`border ${errors.transportationFee ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.transportationFee && (
                      <p className="text-xs text-red-600">{errors.transportationFee}</p>
                    )}
                  </div>
                </div>

                {form.mode === "ONLINE" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Item Value (Cost of Product){" "}
                      <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="eg. 350"
                      value={form.itemValue}
                      onChange={(e) => handleChange("itemValue")(e.target.value)}
                      className={`border ${errors.itemValue ? 'border-red-500' : 'border-[#d1d1d1]'}`}
                    />
                    {errors.itemValue && (
                      <p className="text-xs text-red-600">{errors.itemValue}</p>
                    )}
                    <p className="text-[11px] text-[#5d5d5d]">
                      This amount will be collected from the recipient together
                      with the delivery and transportation fee.
                    </p>
                  </div>
                )}
              </section>

              {/* Summary */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Summary
                </h3>
                <div className="flex flex-col gap-1 text-xs text-[#5d5d5d]">
                  <div className="flex justify-between">
                    <span>Package fee</span>
                    <span>GHC {parseFloat(form.packageFee || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation fee</span>
                    <span>
                      GHC {parseFloat(form.transportationFee || "0").toFixed(2)}
                    </span>
                  </div>
                  {form.mode === "ONLINE" && (
                    <div className="flex justify-between">
                      <span>Item value</span>
                      <span>
                        GHC {parseFloat(form.itemValue || "0").toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                    <span>Total Amount</span>
                    <span>GHC {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
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
                      {form.senderPhone || "—"}
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
                          {idx + 1}. {parcel.receiverName} - {parcel.receiverPhone}
                        </p>
                        {parcel.receiverAddress && (
                          <p className="text-[11px] text-[#5d5d5d]">{parcel.receiverAddress}</p>
                        )}
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
                        {form.receiverPhone || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-[#9a9a9a]">Address</p>
                      <p className="text-sm text-neutral-900">
                        {form.receiverAddress || "—"}
                      </p>
                    </div>
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
                      {form.driverPhone || "—"}
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
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Package fee</span>
                    <span>
                      GHC {parseFloat(form.packageFee || "0").toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation fee</span>
                    <span>
                      GHC {parseFloat(form.transportationFee || "0").toFixed(2)}
                    </span>
                  </div>
                  {form.mode === "ONLINE" && (
                    <div className="flex justify-between">
                      <span>Item value</span>
                      <span>
                        GHC {parseFloat(form.itemValue || "0").toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-900">
                    <span>Total Amount</span>
                    <span>GHC {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
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
                  className="flex w-full items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                >
                  <span>Finish & Print Label</span>
                  <CheckCircleIcon className="h-4 w-4" />
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
              
              <div className="p-6">
                {bulkMode ? (
                  <div className="space-y-6">
                    {bulkParcels.map((parcel, idx) => (
                      <div key={parcel.id} ref={idx === 0 ? printRef : null}>
                        <ParcelLabel
                          trackingNumber={`${trackingNumber}-${idx + 1}`}
                          form={form}
                          receiver={{
                            name: parcel.receiverName,
                            phone: parcel.receiverPhone,
                            address: parcel.receiverAddress,
                          }}
                          packageFee={parcel.packageFee}
                          itemValue={parcel.itemValue}
                          currentStationLabel={currentStationLabel}
                          totalAmount={parseFloat(parcel.packageFee || "0") + parseFloat(form.transportationFee || "0") + (form.mode === "ONLINE" ? parseFloat(parcel.itemValue || "0") : 0)}
                        />
                        {idx < bulkParcels.length - 1 && (
                          <div className="border-t-2 border-dashed border-gray-300 my-6" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div ref={printRef}>
                    <ParcelLabel
                      trackingNumber={trackingNumber}
                      form={form}
                      receiver={{
                        name: form.receiverName,
                        phone: form.receiverPhone,
                        address: form.receiverAddress,
                      }}
                      packageFee={form.packageFee}
                      itemValue={form.itemValue}
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
  packageFee: string;
  itemValue: string;
  currentStationLabel: string;
  totalAmount: number;
}

const ParcelLabel: React.FC<ParcelLabelProps> = ({
  trackingNumber,
  form,
  receiver,
  packageFee,
  itemValue,
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
          <p className="text-xs text-black">{form.senderPhone}</p>
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

      {/* Transport & Driver Info */}
      <div className="border border-black p-2 mb-4">
        <p className="text-xs font-bold text-black">VEHICLE:</p>
        <p className="text-sm text-black">{form.vehicleNumber}</p>
      </div>

      <div className="border border-black p-2 mb-4">
        <p className="text-xs font-bold text-black">DRIVER:</p>
        <p className="text-sm text-black">
          {form.driverName} {form.driverPhone && `- ${form.driverPhone}`}
        </p>
      </div>

      {/* Payment Details */}
      <div className="border-2 border-black p-3 mb-4">
        <p className="text-xs font-bold text-black mb-2">PAYMENT DETAILS</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black">Package Fee:</span>
            <span className="font-semibold text-black">
              GHC {parseFloat(packageFee || "0").toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Transport Fee:</span>
            <span className="font-semibold text-black">
              GHC {parseFloat(form.transportationFee || "0").toFixed(2)}
            </span>
          </div>
          {form.mode === "ONLINE" && (
            <div className="flex justify-between">
              <span className="text-black">Item Value:</span>
              <span className="font-semibold text-black">
                GHC {parseFloat(itemValue || "0").toFixed(2)}
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
          {form.mode === "LOCAL" ? "LOCAL PARCEL" : "ONLINE PARCEL - POD"}
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
