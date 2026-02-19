import { useState } from "react";
import {
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  Loader,
  CheckCircleIcon,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CostInput } from "../../components/ui/CostInput";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../components/ui/toast";
import { validatePhoneNumber, normalizePhoneNumber } from "../../utils/dataHelpers";
import authService from "../../services/authService";
import frontdeskService, { type ParcelRequest } from "../../services/frontdeskService";

export interface PickupRequestFormData {
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  parcelDescription: string;
  itemValue?: number;
  specialInstructions?: string;
  pickupCost?: number;
  deliveryCost?: number;
  preferredPickupDate?: string;
  preferredPickupTime?: string;
}

const initialFormState: PickupRequestFormData = {
  pickupAddress: "",
  pickupContactName: "",
  pickupContactPhone: "",
  deliveryAddress: "",
  recipientName: "",
  recipientPhone: "",
  parcelDescription: "",
  itemValue: undefined,
  specialInstructions: "",
  pickupCost: undefined,
  deliveryCost: undefined,
  preferredPickupDate: "",
  preferredPickupTime: "",
};

export const PickupRequest = (): JSX.Element => {
  const { showToast } = useToast();
  const [form, setForm] = useState<PickupRequestFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const updateField = <K extends keyof PickupRequestFormData>(
    key: K,
    value: PickupRequestFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePhoneField = (key: "pickupContactPhone" | "recipientPhone", value: string) => {
    const digits = value.replace(/\D/g, "").substring(0, 10);
    const normalized = normalizePhoneNumber(digits);
    setForm((prev) => ({ ...prev, [key]: normalized }));
  };

  const validate = (): boolean => {
    if (!form.pickupAddress?.trim()) {
      showToast("Pickup address is required", "error");
      return false;
    }
    if (!form.pickupContactName?.trim()) {
      showToast("Pickup contact name is required", "error");
      return false;
    }
    if (!form.pickupContactPhone?.trim()) {
      showToast("Pickup contact phone is required", "error");
      return false;
    }
    if (!validatePhoneNumber(form.pickupContactPhone)) {
      showToast("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX", "error");
      return false;
    }
    if (!form.deliveryAddress?.trim()) {
      showToast("Delivery address is required", "error");
      return false;
    }
    if (!form.recipientName?.trim()) {
      showToast("Recipient name is required", "error");
      return false;
    }
    if (!form.recipientPhone?.trim()) {
      showToast("Recipient phone is required", "error");
      return false;
    }
    if (!validatePhoneNumber(form.recipientPhone)) {
      showToast("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX", "error");
      return false;
    }
    if (!form.parcelDescription?.trim()) {
      showToast("Parcel description is required", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const userData = authService.getUser();
    const officeId = (userData as any)?.office?.id;

    if (!officeId) {
      showToast("Office ID not found. Please ensure you are logged in with a valid account.", "error");
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Map the pickup form into the backend parcel payload
      // Phones are stored with +233 prefix (normalizePhoneNumber) and sent as-is
      const payload: ParcelRequest = {
        officeId,
        typeofParcel: "PICKUP",

        // Treat pickup contact as sender
        senderName: form.pickupContactName,
        senderPhoneNumber: form.pickupContactPhone,

        // Treat delivery contact as receiver
        receiverName: form.recipientName,
        receiverAddress: form.deliveryAddress,
        recieverPhoneNumber: form.recipientPhone,

        parcelDescription: form.parcelDescription,

        // Pickup / delivery specific fields
        pickupAddress: form.pickupAddress,
        pickupContactName: form.pickupContactName,
        pickupContactPhoneNumber: form.pickupContactPhone,
        pickupInstructions: form.specialInstructions,
        deliveryAddress: form.deliveryAddress,
        deliveryContactName: form.recipientName,
        deliveryContactPhoneNumber: form.recipientPhone,
        specialInstructions: form.specialInstructions,

        // Costs and value (optional – leave undefined when blank)
        itemCost: form.itemValue,
        pickUpCost: form.pickupCost,
        deliveryCost: form.deliveryCost,

        // Default flags for a new pickup request
        homeDelivery: true,
        pod: false,
        delivered: false,
        pickedUp: false,
        parcelAssigned: false,
        fragile: false,
        itemOwnerPaid: false,
      };

      const response = await frontdeskService.addParcel(payload);

      if (response.success) {
        showToast("Pickup request submitted successfully. A rider will be assigned for collection.", "success");
        setSubmitSuccess(true);
        setForm(initialFormState);
      } else {
        showToast(response.message || "Failed to submit pickup request", "error");
      }
    } catch (error) {
      console.error("Pickup request error:", error);
      showToast("Failed to submit pickup request. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setSubmitSuccess(false);
  };

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">
                Pickup Request
              </h1>
              <p className="text-sm text-gray-600">
                Request pickup of a parcel from one location for delivery to another. This is for parcels we need to collect, not ones already at our station.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Location */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <MapPinIcon className="w-5 h-5 text-[#ea690c]" />
                  <h2 className="text-lg font-semibold text-neutral-800">Pickup Location</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Where should we pick up the parcel from?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="pickupAddress" className="text-neutral-800">Pickup Address *</Label>
                    <Input
                      id="pickupAddress"
                      placeholder="e.g. 123 Main Street, Accra"
                      value={form.pickupAddress}
                      onChange={(e) => updateField("pickupAddress", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickupContactName" className="text-neutral-800">Contact Name at Pickup *</Label>
                    <Input
                      id="pickupContactName"
                      placeholder="Person at pickup location"
                      value={form.pickupContactName}
                      onChange={(e) => updateField("pickupContactName", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div className="flex flex-col flex-1 items-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor="pickupContactPhone"
                        className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                      >
                        Contact Phone number
                      </Label>
                      <span className="text-sm font-semibold text-[#e22420]">*</span>
                    </div>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        id="pickupContactPhone"
                        type="tel"
                        value={form.pickupContactPhone.startsWith("+233") ? form.pickupContactPhone.substring(4) : form.pickupContactPhone}
                        onChange={(e) => updatePhoneField("pickupContactPhone", e.target.value)}
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        className="pl-14 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Delivery Location */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TruckIcon className="w-5 h-5 text-[#ea690c]" />
                  <h2 className="text-lg font-semibold text-neutral-800">Delivery Location</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Where should we deliver the parcel to?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="deliveryAddress" className="text-neutral-800">Delivery Address *</Label>
                    <Input
                      id="deliveryAddress"
                      placeholder="e.g. 45 Oak Avenue, Kumasi"
                      value={form.deliveryAddress}
                      onChange={(e) => updateField("deliveryAddress", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientName" className="text-neutral-800">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      placeholder="Person receiving the parcel"
                      value={form.recipientName}
                      onChange={(e) => updateField("recipientName", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div className="flex flex-col flex-1 items-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor="recipientPhone"
                        className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                      >
                        Recipient Phone number
                      </Label>
                      <span className="text-sm font-semibold text-[#e22420]">*</span>
                    </div>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                        +233
                      </span>
                      <Input
                        id="recipientPhone"
                        type="tel"
                        value={form.recipientPhone.startsWith("+233") ? form.recipientPhone.substring(4) : form.recipientPhone}
                        onChange={(e) => updatePhoneField("recipientPhone", e.target.value)}
                        placeholder="0XXXXXXXXX or XXXXXXXXX"
                        className="pl-14 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Parcel Details */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <PackageIcon className="w-5 h-5 text-[#ea690c]" />
                  <h2 className="text-lg font-semibold text-neutral-800">Parcel Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="parcelDescription" className="text-neutral-800">Parcel Description *</Label>
                    <Input
                      id="parcelDescription"
                      placeholder="e.g. Documents, Electronics, Clothing"
                      value={form.parcelDescription}
                      onChange={(e) => updateField("parcelDescription", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemValue" className="text-neutral-800">Item Value (GHC)</Label>
                    <CostInput
                      id="itemValue"
                      value={form.itemValue}
                      onChange={(v) => updateField("itemValue", v)}
                      placeholder="Optional"
                      allowClear
                      className="mt-1"
                      inputClassName="border border-[#d1d1d1]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredPickupDate" className="text-neutral-800">Preferred Pickup Date</Label>
                    <Input
                      id="preferredPickupDate"
                      type="date"
                      value={form.preferredPickupDate}
                      onChange={(e) => updateField("preferredPickupDate", e.target.value)}
                      className="mt-1 border border-[#d1d1d1]"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="specialInstructions" className="text-neutral-800">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      placeholder="Any special handling, access instructions, etc."
                      value={form.specialInstructions ?? ""}
                      onChange={(e) => updateField("specialInstructions", e.target.value)}
                      className="mt-1 border border-[#d1d1d1] min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Costs */}
              <section>
                <h2 className="text-lg font-semibold text-neutral-800 mb-2">Costs (Optional)</h2>
                <p className="text-sm text-gray-600 mb-4">Leave blank if costs will be determined later.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="pickupCost" className="text-neutral-800">Pickup Cost (GHC)</Label>
                    <CostInput
                      id="pickupCost"
                      value={form.pickupCost}
                      onChange={(v) => updateField("pickupCost", v)}
                      placeholder="Optional"
                      allowClear
                      className="mt-1"
                      inputClassName="border border-[#d1d1d1]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryCost" className="text-neutral-800">Delivery Cost (GHC)</Label>
                    <CostInput
                      id="deliveryCost"
                      value={form.deliveryCost}
                      onChange={(v) => updateField("deliveryCost", v)}
                      placeholder="Optional"
                      allowClear
                      className="mt-1"
                      inputClassName="border border-[#d1d1d1]"
                    />
                  </div>
                </div>
              </section>

              {/* Success message */}
              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Pickup request submitted</p>
                    <p className="text-sm text-green-700">
                      The request has been recorded. A rider will be assigned to collect the parcel from the pickup location and deliver it.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border border-[#d1d1d1]"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Pickup Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
