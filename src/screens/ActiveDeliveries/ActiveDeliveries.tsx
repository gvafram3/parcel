import { useState } from "react";
import {
  TruckIcon,
  PackageIcon,
  CameraIcon,
  AlertCircleIcon,
  SearchIcon,
  XIcon,
  FilterIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
} from "lucide-react";
import { HeaderSection } from "../ParcelRegistration/sections/HeaderSection";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const deliveries = [
  {
    trackingId: "PAK - 72897368",
    status: "In Transit",
    receiver: {
      name: "John Kofitse Amekudzi",
      phone: "+233 24 245 8248",
    },
    address: "45 UCC Campus Cape Coast",
    rider: {
      name: "John Davies",
      phone: "+233 24 245 8248",
    },
    assignedTime: "02:20 PM",
    eta: "3:30 PM",
    podAmount: "GHC 100",
  },
  {
    trackingId: "PAK - 72897369",
    status: "In Transit",
    receiver: {
      name: "John Kofitse Amekudzi",
      phone: "+233 24 245 8248",
    },
    address: "45 UCC Campus Cape Coast",
    rider: {
      name: "John Davies",
      phone: "+233 24 245 8248",
    },
    assignedTime: "02:20 PM",
    eta: "3:30 PM",
    podAmount: "GHC 100",
  },
  {
    trackingId: "PAK - 72897370",
    status: "In Transit",
    receiver: {
      name: "John Kofitse Amekudzi",
      phone: "+233 24 245 8248",
    },
    address: "45 UCC Campus Cape Coast",
    rider: {
      name: "John Davies",
      phone: "+233 24 245 8248",
    },
    assignedTime: "02:20 PM",
    eta: "3:30 PM",
    podAmount: "GHC 100",
  },
];

export const ActiveDeliveries = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 space-y-6">
          <HeaderSection />

          <main className="flex-1 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-green-600 text-3xl">
                        10
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                        Currently making deliveries
                      </span>
                    </div>
                    <PackageIcon className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-blue-600 text-3xl">
                        3
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                        Packages that will be delivered soon
                      </span>
                    </div>
                    <PackageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-3xl">
                        GHC 300.00
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                        Expected collections
                      </span>
                    </div>
                    <CameraIcon className="w-8 h-8 text-[#ea690c]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-red-600 text-3xl">
                        3
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                        Requires follow-up
                      </span>
                    </div>
                    <AlertCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search by Tracking ID, Receiver or Rider"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 pr-10 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#9a9a9a]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ea690c]" />
                </div>

                <div className="flex items-center gap-2">
                  <FilterIcon className="w-5 h-5 text-[#5d5d5d]" />
                  <select className="rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                    <option>Filter</option>
                    <option>In Transit</option>
                    <option>Delivered</option>
                    <option>Failed</option>
                  </select>
                </div>

                <select className="rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                  <option>All Riders</option>
                  <option>John Davies</option>
                  <option>Kwame Asante</option>
                  <option>Ama Mensah</option>
                </select>
              </CardContent>
            </Card>

            {/* Delivery List */}
            <div className="flex flex-col gap-4">
              {deliveries.map((delivery) => (
                <Card
                  key={delivery.trackingId}
                  className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left Column - Receiver and Address */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                            {delivery.trackingId}
                          </Badge>
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {delivery.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-[#5d5d5d]" />
                          <div className="flex flex-col">
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                              {delivery.receiver.name}
                            </span>
                            <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                              {delivery.receiver.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                          <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                            {delivery.address}
                          </span>
                        </div>
                      </div>

                      {/* Middle Column - Rider and Timing */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="w-4 h-4 text-[#5d5d5d]" />
                          <div className="flex flex-col">
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                              {delivery.rider.name}
                            </span>
                            <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                              {delivery.rider.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                              Assigned: {delivery.assignedTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                              ETA: {delivery.eta}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - POD Amount and Action */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 mb-1">
                            <CameraIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                              POD Amount
                            </span>
                          </div>
                          <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-lg">
                            {delivery.podAmount}
                          </span>
                        </div>

                        <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                          <PhoneIcon className="w-4 h-4" />
                          <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                            Contact Rider
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
