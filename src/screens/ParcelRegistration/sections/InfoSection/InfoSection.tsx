import {
  ArrowRightIcon,
  DownloadIcon,
  InboxIcon,
  UploadIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

const senderFields = [
  {
    id: "senderName",
    label: "Sender Name",
    placeholder: "John Smith",
    required: true,
  },
  {
    id: "senderPhone",
    label: "Sender Phone number",
    placeholder: "+233 555 555 555",
    required: true,
  },
];

const receiverFields = [
  {
    id: "receiverName",
    label: "Receiver Name",
    placeholder: "Jane Doe",
    required: true,
  },
  {
    id: "receiverPhone",
    label: "Receiver Phone number",
    placeholder: "+233 555 555 123",
    required: true,
  },
];

interface FormData {
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  additionalInfo?: string;
}

// Minimal ParcelFormData (matches ParcelRegistration)
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
  shelfLocation: string;
  shelfName?: string;
  itemValue: number;
  pickUpCost?: number;
  homeDelivery?: boolean;
  deliveryCost?: number;
  hasCalled?: boolean;
}

interface InfoSectionProps {
  // compatibility with single-parcel save flow
  parcels?: ParcelFormData[];
  sessionDriver?: { driverName?: string; driverPhone?: string; vehicleNumber?: string } | null;
  onAddParcel?: (data: ParcelFormData) => void;
  onSaveAll?: (additionalParcel?: ParcelFormData) => Promise<any>;
  onRemoveParcel?: (index: number) => void;
  isSaving?: boolean;

  // existing flow
  onNext?: () => void;
  onStartSession?: (driverName: string, vehicleNumber: string) => void;
  onUpdateFormData?: (data: Partial<FormData>) => void;
  driverName?: string;
  vehicleNumber?: string;
  formData?: Partial<FormData>;

  // NEW: reset trigger from parent
  resetTrigger?: number;
}

export const InfoSection = ({
  onNext,
  onStartSession,
  onUpdateFormData,
  driverName,
  vehicleNumber,
  formData = {},
  // parcel flow props (optional)
  parcels,
  sessionDriver,
  onAddParcel,
  onSaveAll,
  onRemoveParcel,
  isSaving,
  resetTrigger = 0,
}: InfoSectionProps): JSX.Element => {
  const [showingDriverSelection, setShowingDriverSelection] = useState(!driverName);
  const [formDriverName, setFormDriverName] = useState(driverName || "");
  const [formVehicleNumber, setFormVehicleNumber] = useState(vehicleNumber || "");

  const [senderName, setSenderName] = useState(formData.senderName || "");
  const [senderPhone, setSenderPhone] = useState(formData.senderPhone || "");
  const [receiverName, setReceiverName] = useState(formData.receiverName || "");
  const [receiverPhone, setReceiverPhone] = useState(formData.receiverPhone || "");
  const [receiverAddress, setReceiverAddress] = useState(formData.receiverAddress || "");
  const [additionalInfo, setAdditionalInfo] = useState(formData.additionalInfo || "");

  // Reset all form fields (including driver) when parent bumps resetTrigger
  useEffect(() => {
    setFormDriverName("");
    setFormVehicleNumber("");
    setShowingDriverSelection(true);

    setSenderName("");
    setSenderPhone("");
    setReceiverName("");
    setReceiverPhone("");
    setReceiverAddress("");
    setAdditionalInfo("");
  }, [resetTrigger]);

  const handleContinueDriverSelection = () => {
    if (formDriverName.trim() && formVehicleNumber.trim() && onStartSession) {
      onStartSession(formDriverName, formVehicleNumber);
      setShowingDriverSelection(false);
    }
  };

  const handleContinueParcelInfo = () => {
    if (senderName.trim() && senderPhone.trim() && receiverName.trim() && receiverPhone.trim()) {
      const formPayload = {
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        receiverAddress,
        additionalInfo,
      };

      // If parent expects a ParcelFormData (ParcelRegistration flow), construct and send it
      if (onAddParcel) {
        const parcelData: ParcelFormData = {
          driverName: formDriverName || sessionDriver?.driverName || undefined,
          driverPhone: undefined,
          vehicleNumber: formVehicleNumber || sessionDriver?.vehicleNumber || undefined,
          senderName: senderName || undefined,
          senderPhone: senderPhone || undefined,
          recipientName: receiverName,
          recipientPhone: receiverPhone,
          receiverAddress: receiverAddress || undefined,
          itemDescription: additionalInfo || undefined,
          shelfLocation: "", // left empty; parent or UI should collect actual shelf
          shelfName: undefined,
          itemValue: 0, // default; parent should update if needed
          pickUpCost: undefined,
          homeDelivery: false,
          deliveryCost: undefined,
          hasCalled: false,
        };

        onAddParcel(parcelData);
        // also notify update for any parent that uses formData flow
        onUpdateFormData?.(formPayload);
      } else {
        // Existing behavior for onNext/onUpdateFormData flow
        onUpdateFormData?.(formPayload);
        onNext?.();
      }

      // Clear local parcel inputs after submit
      setSenderName("");
      setSenderPhone("");
      setReceiverName("");
      setReceiverPhone("");
      setReceiverAddress("");
      setAdditionalInfo("");
      // keep driver selection state as-is unless resetTrigger triggers a full reset
    }
  };

  if (showingDriverSelection) {
    return (
      <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-black shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
        <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
          <header className="inline-flex items-center gap-2">
            <InboxIcon className="w-6 h-6 text-[#ea690c]" />
            <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
              Driver Informationsss
            </h1>
          </header>
          <div className="flex flex-col items-start gap-4 w-full">
            <section className="flex flex-col items-start gap-4 w-full">
              <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                Enter Driver Details
              </h2>
              <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="flex flex-col flex-1 items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="driverName"
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      Driver Name
                    </Label>
                    <span className="text-sm font-semibold text-[#e22420]">*</span>
                  </div>
                  <Input
                    id="driverName"
                    placeholder="John Smith"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
                <div className="flex flex-col flex-1 items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="vehicleNumber"
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      Vehicle Number
                    </Label>
                    <span className="text-sm font-semibold text-[#e22420]">*</span>
                  </div>
                  <Input
                    id="vehicleNumber"
                    placeholder="GH-1234-22"
                    value={formVehicleNumber}
                    onChange={(e) => setFormVehicleNumber(e.target.value)}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              </div>
            </section>
          </div>
          <nav className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              onClick={handleContinueDriverSelection}
              className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
            >
              <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                Continue
              </span>
              <ArrowRightIcon className="w-6 h-6" />
            </Button>
          </nav>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
        <header className="inline-flex items-center gap-2">
          <InboxIcon className="w-6 h-6 text-[#ea690c]" />
          <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
            New Parcel Registration
          </h1>
        </header>

        <div className="flex flex-col items-start gap-4 w-full">
          <section className="flex flex-col items-start gap-4 w-full">
            <div className="inline-flex items-center gap-2">
              <UploadIcon className="w-6 h-6 text-[#5d5d5d]" />
              <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                Sender&apos;s Details
              </h2>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
              {senderFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <span className="text-sm font-semibold text-[#e22420]">
                        *
                      </span>
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={field.id === "senderName" ? senderName : senderPhone}
                    onChange={(e) => field.id === "senderName" ? setSenderName(e.target.value) : setSenderPhone(e.target.value)}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-start gap-4 w-full">
            <div className="inline-flex items-center gap-2">
              <DownloadIcon className="w-6 h-6 text-[#5d5d5d]" />
              <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                Receiver&apos;s Details
              </h2>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
              {receiverFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <span className="text-sm font-semibold text-[#e22420]">
                        *
                      </span>
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={field.id === "receiverName" ? receiverName : receiverPhone}
                    onChange={(e) => field.id === "receiverName" ? setReceiverName(e.target.value) : setReceiverPhone(e.target.value)}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-col items-start gap-2">
                <Label
                  htmlFor="receiverAddress"
                  className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                >
                  Receiver Address
                </Label>
                <Input
                  id="receiverAddress"
                  placeholder="Enter address"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                />
              </div>
            </div>
          </section>

          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="additionalInfo"
                className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-800 text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]"
              >
                Additional Information
              </Label>
              <span className="text-sm text-[#9a9a9a]">(optional)</span>
            </div>

            <Textarea
              id="additionalInfo"
              placeholder="Message goes here..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[160px] w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-700 text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)] placeholder:text-[#b0b0b0] resize-y"
            />
          </div>
        </div>

        <nav className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            onClick={handleContinueParcelInfo}
            className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
          >
            <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Continue
            </span>
            <ArrowRightIcon className="w-6 h-6" />
          </Button>
        </nav>
      </CardContent>
    </Card>
  );
};
