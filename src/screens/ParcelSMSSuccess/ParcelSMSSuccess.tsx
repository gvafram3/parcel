import React from "react";
import { CheckCircleIcon, HomeIcon } from "lucide-react";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const ParcelSMSSuccess = (): JSX.Element => {
  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
            <CardContent className="flex flex-col items-center justify-center gap-6 p-8 sm:p-12 text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                  SMS Sent Successfully
                </h1>
                <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
                  Your parcel has been registered and confirmation SMS has been sent to the recipient.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full pt-4">
                <div className="flex flex-col gap-1 bg-gray-50 rounded-lg p-4">
                  <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Parcel ID</span>
                  <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                    PRC-2024-001234
                  </span>
                </div>
              </div>

              <Button className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90">
                <HomeIcon className="w-5 h-5" />
                <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                  Return to Dashboard
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

