
import { ArrowLeftIcon, CheckCircleIcon, FileCheckIcon } from "lucide-react";
import { ErrorNotificationSection } from "../ParcelRegistration/sections/ErrorNotificationSection";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

export const ParcelReview = (): JSX.Element => {
  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          <ErrorNotificationSection />

          <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
              <header className="inline-flex items-center gap-2">
                <FileCheckIcon className="w-6 h-6 text-[#ea690c]" />
                <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                  Parcel Review
                </h1>
              </header>

              <div className="flex flex-col gap-6 w-full">
                {/* Sender Details */}
                <section className="flex flex-col gap-3">
                  <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                    Sender&apos;s Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        John Smith
                      </p>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        +233 555 555 555
                      </p>
                    </div>
                  </div>
                </section>

                <Separator className="bg-[#d1d1d1]" />

                {/* Receiver Details */}
                <section className="flex flex-col gap-3">
                  <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                    Receiver&apos;s Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        Jane Doe
                      </p>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        +233 555 555 123
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Delivery Address:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        123 Main Street, Accra, Ghana
                      </p>
                    </div>
                  </div>
                </section>

                <Separator className="bg-[#d1d1d1]" />

                {/* Parcel Details */}
                <section className="flex flex-col gap-3">
                  <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                    Parcel Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Item Description:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        Electronics Package
                      </p>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Item Value:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        GHC 500.00
                      </p>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Delivery Type:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        Standard Delivery
                      </p>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Payment Method:</span>
                      <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                        Cash
                      </p>
                    </div>
                  </div>
                </section>

                <Separator className="bg-[#d1d1d1]" />

                {/* Cost Summary */}
                <section className="flex flex-col gap-3">
                  <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                    Cost Summary
                  </h2>
                  <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
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
                    <Separator className="bg-[#d1d1d1] my-1" />
                    <div className="flex justify-between items-center">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                        Total Cost
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                        GHC 50.00
                      </span>
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
                    <CheckCircleIcon className="w-6 h-6" />
                    <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                      Confirm
                    </span>
                  </Button>
                </nav>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

