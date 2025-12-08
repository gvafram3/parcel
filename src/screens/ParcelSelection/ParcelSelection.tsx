import { useState } from "react";
import {
  CheckIcon,
  FilterIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
} from "lucide-react";
import { HeaderSection } from "../ParcelRegistration/sections/HeaderSection";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

type ParcelStatus = "waiting-response" | "no-response" | "delivery" | "pickup";

interface Parcel {
  id: string;
  receiverName: string;
  busNumber?: string;
  phoneNumber: string;
  address: string;
  eta: string;
  amount: string;
  status: ParcelStatus;
}

const parcels: Parcel[] = [
  {
    id: "PAK - 21764912",
    receiverName: "John Kofitse Amekudzi",
    busNumber: "BUS-001",
    phoneNumber: "+233 24 245 8248",
    address: "45 Street UCC Campus",
    eta: "30 min(s)",
    amount: "GHC 130.00",
    status: "waiting-response",
  },
  {
    id: "PAK - 21764913",
    receiverName: "John Doe",
    busNumber: "BUS-002",
    phoneNumber: "+233 24 245 8249",
    address: "123 Main Street, Accra",
    eta: "45 min(s)",
    amount: "GHC 150.00",
    status: "delivery",
  },
  {
    id: "PAK - 21764914",
    receiverName: "Jane Smith",
    busNumber: "BUS-003",
    phoneNumber: "+233 24 245 8250",
    address: "78 Market Circle, Kumasi",
    eta: "20 min(s)",
    amount: "GHC 100.00",
    status: "no-response",
  },
  {
    id: "PAK - 21764915",
    receiverName: "Alice Johnson",
    busNumber: "BUS-004",
    phoneNumber: "+233 24 245 8251",
    address: "12 Airport Road, Tema",
    eta: "60 min(s)",
    amount: "GHC 200.00",
    status: "pickup",
  },
  {
    id: "PAK - 21764916",
    receiverName: "Bob Williams",
    busNumber: "BUS-005",
    phoneNumber: "+233 24 245 8252",
    address: "56 High Street, Takoradi",
    eta: "25 min(s)",
    amount: "GHC 120.00",
    status: "waiting-response",
  },
  {
    id: "PAK - 21764917",
    receiverName: "Charlie Brown",
    busNumber: "BUS-006",
    phoneNumber: "+233 24 245 8253",
    address: "90 Independence Ave, Accra",
    eta: "35 min(s)",
    amount: "GHC 180.00",
    status: "delivery",
  },
];

const statusConfig: Record<
  ParcelStatus,
  {
    label: string;
    badgeColor: string;
    message: string;
    messageBgColor: string;
    buttonText: string;
    buttonVariant: "default" | "outline";
    buttonColor: string;
  }
> = {
  "waiting-response": {
    label: "Waiting response",
    badgeColor: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    message: "Waiting for response from customer",
    messageBgColor: "bg-orange-50 border-orange-200",
    buttonText: "Call Receiver",
    buttonVariant: "outline",
    buttonColor: "border-gray-300 text-gray-700 hover:bg-gray-50",
  },
  "no-response": {
    label: "No Response",
    badgeColor: "bg-red-100 text-red-800 hover:bg-red-100",
    message: "No response received. Call required",
    messageBgColor: "bg-red-50 border-red-200",
    buttonText: "Call Receiver",
    buttonVariant: "default",
    buttonColor: "bg-[#ea690c] text-white hover:bg-[#ea690c]/90",
  },
  delivery: {
    label: "Delivery",
    badgeColor: "bg-green-100 text-green-800 hover:bg-green-100",
    message: "Package waiting to be delivered",
    messageBgColor: "bg-green-50 border-green-200",
    buttonText: "Select for Assignment",
    buttonVariant: "outline",
    buttonColor: "border-[#ea690c] text-[#ea690c] hover:bg-orange-50",
  },
  pickup: {
    label: "Pickup",
    badgeColor: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    message: "Waiting for customer to pickup item",
    messageBgColor: "bg-purple-50 border-purple-200",
    buttonText: "Clear item",
    buttonVariant: "outline",
    buttonColor: "border-[#ea690c] text-[#ea690c] hover:bg-orange-50",
  },
};

interface ParcelCardProps {
  parcel: Parcel;
  isSelected: boolean;
  onToggle: () => void;
}

const ParcelCard = ({ parcel, isSelected, onToggle }: ParcelCardProps) => {
  const config = statusConfig[parcel.status];

  return (
    <Card className={`rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow ${
      isSelected ? "border-[#ea690c]" : "border-[#d1d1d1]"
    }`}>
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
                  {parcel.receiverName}
                </span>
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                  {parcel.id}
                </span>
              </div>
            </div>
            <Badge className={config.badgeColor}>{config.label}</Badge>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
              <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                {parcel.phoneNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
              <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                {parcel.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
              <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                {parcel.eta}
              </span>
            </div>
            {parcel.busNumber && (
              <div className="flex items-center gap-2">
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                  Bus:
                </span>
                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  {parcel.busNumber}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                Amount to collect: {parcel.amount}
              </span>
            </div>
          </div>

          {/* Status message */}
          <div
            className={`rounded-lg border p-3 ${config.messageBgColor}`}
          >
            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
              {config.message}
            </span>
          </div>

          {/* Action button */}
          <Button
            variant={config.buttonVariant}
            className={`w-full ${config.buttonColor}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {config.buttonText === "Call Receiver" && (
              <PhoneIcon className="w-4 h-4" />
            )}
            <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
              {config.buttonText}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const ParcelSelection = (): JSX.Element => {
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
  const [selectedRider, setSelectedRider] = useState<string>("");

  const toggleParcel = (id: string) => {
    const newSelected = new Set(selectedParcels);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 10) {
        return; // Maximum 10 parcels
      }
      newSelected.add(id);
    }
    setSelectedParcels(newSelected);
  };

  const handleAssign = () => {
    if (selectedParcels.size > 0 && selectedRider) {
      // Handle assignment logic here
      console.log("Assigning parcels:", Array.from(selectedParcels), "to rider:", selectedRider);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 space-y-6">
          <HeaderSection />

          <main className="flex-1 space-y-6">
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
                  <select className="rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                    <option>All Status</option>
                    <option>Waiting Response</option>
                    <option>No Response</option>
                    <option>Delivery</option>
                    <option>Pickup</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 ml-auto" style={{ width: "300px" }}>
                  <label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm whitespace-nowrap">
                    Select rider:
                  </label>
                  <select
                    value={selectedRider}
                    onChange={(e) => setSelectedRider(e.target.value)}
                    className="flex-1 rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                  >
                    <option value="">Choose a rider</option>
                    <option value="rider-1">Kwame Asante</option>
                    <option value="rider-2">Ama Mensah</option>
                    <option value="rider-3">Kofi Boateng</option>
                  </select>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={selectedParcels.size === 0 || !selectedRider}
                  className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </Button>
              </CardContent>
            </Card>

            {/* Parcel Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcels.map((parcel) => (
                <ParcelCard
                  key={parcel.id}
                  parcel={parcel}
                  isSelected={selectedParcels.has(parcel.id)}
                  onToggle={() => toggleParcel(parcel.id)}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
