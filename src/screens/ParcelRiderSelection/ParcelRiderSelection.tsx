import React from "react";
import { CheckIcon, UserIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { ErrorNotificationSection } from "../ParcelRegistration/sections/ErrorNotificationSection";
import { HeaderSection } from "../ParcelRegistration/sections/HeaderSection";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

const riders = [
  {
    id: "RDR-001",
    name: "Kwame Asante",
    phone: "+233 555 123 456",
    location: "Accra Central",
    status: "Available",
    deliveries: 12,
    rating: 4.8,
  },
  {
    id: "RDR-002",
    name: "Ama Mensah",
    phone: "+233 555 234 567",
    location: "East Legon",
    status: "Available",
    deliveries: 8,
    rating: 4.9,
  },
  {
    id: "RDR-003",
    name: "Kofi Boateng",
    phone: "+233 555 345 678",
    location: "Tema",
    status: "Busy",
    deliveries: 15,
    rating: 4.7,
  },
];

export const ParcelRiderSelection = (): JSX.Element => {
  const [selectedRider, setSelectedRider] = React.useState<string | null>(null);

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 space-y-6">
          <HeaderSection />

          <main className="flex-1 space-y-6">
            <ErrorNotificationSection />

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riders.map((rider) => (
                      <div
                        key={rider.id}
                        onClick={() => rider.status === "Available" && setSelectedRider(rider.id)}
                        className={`flex flex-col gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedRider === rider.id
                            ? "border-[#ea690c] bg-orange-50"
                            : rider.status === "Available"
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

                          {selectedRider === rider.id && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ea690c]">
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                              {rider.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                              {rider.location}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#d1d1d1]">
                          <div className="flex flex-col">
                            <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                              Deliveries
                            </span>
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                              {rider.deliveries}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                              Rating
                            </span>
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                              ⭐ {rider.rating}
                            </span>
                          </div>
                          <Badge
                            className={`${
                              rider.status === "Available"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                          >
                            {rider.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedRider && (
                    <div className="flex justify-end pt-4">
                      <Button className="flex items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90">
                        <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                          Assign Rider
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

