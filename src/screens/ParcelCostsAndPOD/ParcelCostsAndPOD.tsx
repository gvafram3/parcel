import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, CalculatorIcon, FileTextIcon, ReceiptIcon, UploadIcon } from "lucide-react";
import { ErrorNotificationSection } from "../ParcelRegistration/sections/ErrorNotificationSection";
import { HeaderSection } from "../ParcelRegistration/sections/HeaderSection";
import { NavigationSidebarSection } from "../ParcelRegistration/sections/NavigationSidebarSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";

export const ParcelCostsAndPOD = (): JSX.Element => {
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
                  <CalculatorIcon className="w-6 h-6 text-[#ea690c]" />
                  <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                    Parcel Costs & POD
                  </h1>
                </header>

                <div className="flex flex-col gap-6 w-full">
                  {/* Parcel Details Section */}
                  <section className="flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2">
                      <FileTextIcon className="w-5 h-5 text-[#5d5d5d]" />
                      <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                        Parcel Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Parcel ID
                        </Label>
                        <div className="rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 text-neutral-700">
                          PRC-2024-001234
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Item Description
                        </Label>
                        <div className="rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 text-neutral-700">
                          Electronics Package
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Item Value
                        </Label>
                        <div className="rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 text-neutral-700">
                          GHC 500.00
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Delivery Type
                        </Label>
                        <div className="rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 text-neutral-700">
                          Standard Delivery
                        </div>
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-[#d1d1d1]" />

                  {/* Cost Breakdown Section */}
                  <section className="flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2">
                      <ReceiptIcon className="w-5 h-5 text-[#5d5d5d]" />
                      <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                        Cost Breakdown
                      </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                          Base Delivery Fee
                        </span>
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          GHC 25.00
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                          Distance Charge
                        </span>
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          GHC 15.00
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                          Insurance Fee
                        </span>
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          GHC 10.00
                        </span>
                      </div>
                      <Separator className="bg-[#d1d1d1]" />
                      <div className="flex justify-between items-center">
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                          Total Cost
                        </span>
                        <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                          GHC 50.00
                        </span>
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-[#d1d1d1]" />

                  {/* Payment Summary Section */}
                  <section className="flex flex-col gap-4">
                    <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                      Payment Summary
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Payment Method
                        </Label>
                        <select className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700">
                          <option>Cash</option>
                          <option>Mobile Money</option>
                          <option>Card</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Amount Paid
                        </Label>
                        <Input
                          placeholder="0.00"
                          className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700"
                        />
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-[#d1d1d1]" />

                  {/* Proof of Delivery Section */}
                  <section className="flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2">
                      <UploadIcon className="w-5 h-5 text-[#5d5d5d]" />
                      <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                        Proof of Delivery
                      </h2>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        Upload POD Document (optional)
                      </Label>
                      <div className="flex items-center justify-center w-full border-2 border-dashed border-[#d1d1d1] rounded-lg p-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <UploadIcon className="w-8 h-8 text-[#5d5d5d]" />
                          <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                            Click to upload or drag and drop
                          </span>
                          <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                            PNG, JPG, PDF up to 10MB
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <nav className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-3 rounded border border-[#888888] bg-transparent px-6 py-3 hover:bg-gray-50 sm:w-auto"
                    >
                      <ArrowLeftIcon className="w-6 h-6" />
                      <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#4f4f4f] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                        Previous
                      </span>
                    </Button>

                    <Button className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto">
                      <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                        Continue
                      </span>
                      <ArrowRightIcon className="w-6 h-6" />
                    </Button>
                  </nav>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

