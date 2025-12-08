import React from "react";
import { ArrowLeftIcon, CheckCircleIcon, FileCheckIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

interface ReviewSectionProps {
  onPrevious: () => void;
}

export const ReviewSection = ({ onPrevious }: ReviewSectionProps): JSX.Element => {
  const navigate = useNavigate();

  const handleFinish = () => {
    navigate("/parcel-sms-success");
  };

  return (
    <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
        <header className="inline-flex items-center gap-2">
          <FileCheckIcon className="w-6 h-6 text-[#ea690c]" />
          <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
            Review Parcel Registered
          </h1>
        </header>

        <div className="flex flex-col gap-6 w-full">
          {/* Receiver Details */}
          <section className="flex flex-col gap-3">
            <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Receiver&apos;s Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  John Kofitse Amekudzi
                </p>
              </div>
              <div>
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone Number:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  +233 24 245 8248
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Address:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  UCC Campus
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-[#d1d1d1]" />

          {/* Sender Details */}
          <section className="flex flex-col gap-3">
            <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Sender&apos;s Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  John Doe
                </p>
              </div>
              <div>
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone Number:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  +233 24 245 8248
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Address:</span>
                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                  Accra
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-[#d1d1d1]" />

          {/* Fee Breakdown */}
          <section className="flex flex-col gap-3">
            <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Fee Breakdown
            </h2>
            <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                  Package fee
                </span>
                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  100.00
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                  Transportation Fee
                </span>
                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  30.00
                </span>
              </div>
              <Separator className="bg-[#d1d1d1] my-1" />
              <div className="flex justify-between items-center">
                <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                  Total Amount
                </span>
                <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                  GHC 130.00
                </span>
              </div>
            </div>
          </section>

          <nav className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex w-full items-center justify-center gap-3 rounded border border-[#888888] bg-transparent px-6 py-3 hover:bg-gray-50 sm:w-auto"
            >
              <ArrowLeftIcon className="w-6 h-6" />
              <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#4f4f4f] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                Previous
              </span>
            </Button>

            <Button
              onClick={handleFinish}
              className="flex w-full items-center justify-center gap-3 rounded bg-green-600 px-6 py-3 hover:bg-green-700 sm:w-auto"
            >
              <CheckCircleIcon className="w-6 h-6" />
              <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                Finish
              </span>
            </Button>
          </nav>
        </div>
      </CardContent>
    </Card>
  );
};

