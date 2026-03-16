import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "lucide-react";

type ParcelTransferMode = "LOCAL" | "ONLINE";

interface StationOption {
  id: string;
  name: string;
}

interface ParcelTransferFormState {
  destinationStationId: string;
  transportMethod: string;
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

const mockStations: StationOption[] = [
  // TODO: Replace with real stations from backend
  { id: "accra-main", name: "Accra Main Center" },
  { id: "kumasi-vip", name: "Kumasi VIP Station" },
  { id: "ucc-campus", name: "UCC Campus Station" },
];

export const ParcelTransfer = (): JSX.Element => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<ParcelTransferFormState>({
    destinationStationId: "",
    transportMethod: "",
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

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleFinish = () => {
    // For now we just log; backend integration will be added later
    // eslint-disable-next-line no-console
    console.log("Parcel transfer payload:", form);
  };

  const currentStationLabel =
    mockStations.find((s) => s.id === form.destinationStationId)?.name ||
    "Select a destination";

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-neutral-800">
            Initiate Parcel Transfer
          </h1>
          <p className="text-xs text-[#5d5d5d]">
            Register a parcel for transfer to another station
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-4 rounded-full border border-[#e4e4e4] bg-white px-4 py-3 text-xs sm:text-sm">
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
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step === s.id
                    ? "bg-[#ea690c] text-white"
                    : step > s.id
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step > s.id ? <CheckCircleIcon className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden sm:inline ${
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Destination Station <span className="text-[#e22420]">*</span>
                    </Label>
                    <select
                      className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                      value={form.destinationStationId}
                      onChange={(e) =>
                        handleChange("destinationStationId")(e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select a destination
                      </option>
                      {mockStations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Transport Method <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="eg. VIP, Rider etc"
                      value={form.transportMethod}
                      onChange={(e) => handleChange("transportMethod")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
                  </div>
                </div>
              </section>

              {/* Parcel type */}
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
                      className="border border-[#d1d1d1]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Sender Phone number <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="+233 24 245 8248"
                      value={form.senderPhone}
                      onChange={(e) => handleChange("senderPhone")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
                  </div>
                </div>
              </section>

              {/* Receiver details */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Receiver&apos;s Details
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-800">
                      Receiver Name <span className="text-[#e22420]">*</span>
                    </Label>
                    <Input
                      placeholder="John Doe"
                      value={form.receiverName}
                      onChange={(e) => handleChange("receiverName")(e.target.value)}
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
                      className="border border-[#d1d1d1]"
                    />
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
              </div>

              {/* Station details */}
              <section className="space-y-2 text-xs text-neutral-700">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Station Details
                </h2>
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
              <section className="space-y-2 text-xs text-neutral-700">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Sender&apos;s Details
                </h2>
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
              <section className="space-y-2 text-xs text-neutral-700">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Receiver&apos;s Details
                </h2>
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
              </section>

              {/* Driver details */}
              <section className="space-y-2 text-xs text-neutral-700">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Driver Details
                </h2>
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
              <section className="space-y-2 text-xs text-neutral-700">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Fee Breakdown
                </h2>
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
                  <span>Finish</span>
                  <CheckCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};


