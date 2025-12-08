import React from "react";
import { CheckCircleIcon, DollarSignIcon, HomeIcon } from "lucide-react";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

export const ReconciliationConfirmation = (): JSX.Element => {
  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-2xl rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              <header className="inline-flex items-center gap-2">
                <DollarSignIcon className="w-6 h-6 text-[#ea690c]" />
                <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                  Reconciliation Confirmation
                </h1>
              </header>

              <div className="flex flex-col items-center gap-4 text-center py-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
                <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
                  Reconciliation has been confirmed successfully
                </p>
              </div>

              <Separator className="bg-[#d1d1d1]" />

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                      Date
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                      2024-12-08
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                      Rider
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                      Kwame Asante
                    </span>
                  </div>
                </div>

                <Separator className="bg-[#d1d1d1]" />

                <div className="flex flex-col gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                      Total Deliveries
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                      3
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                      Total Cash Collected
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                      GHC 130.00
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                      Total Commission
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                      GHC 13.00
                    </span>
                  </div>
                  <Separator className="bg-[#d1d1d1] my-1" />
                  <div className="flex justify-between items-center">
                    <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                      Net Amount
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                      GHC 117.00
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="flex items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                    Confirm
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

