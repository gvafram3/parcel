import React from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalculatorIcon,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Separator } from "../../../../components/ui/separator";

interface CostsAndPODSectionProps {
  onPrevious: () => void;
  onNext: () => void;
}

export const CostsAndPODSection = ({
  onPrevious,
  onNext,
}: CostsAndPODSectionProps): JSX.Element => {
  const [isPODEnabled, setIsPODEnabled] = React.useState(false);

  return (
    <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
        <header className="inline-flex items-center gap-2">
          <CalculatorIcon className="w-6 h-6 text-[#ea690c]" />
          <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
            Costs & Payment On Delivery (POD)
          </h1>
        </header>

        <div className="flex flex-col gap-6 w-full">
          {/* Payment on Delivery Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                  Payment on Delivery (POD)
                </Label>
                <p className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm">
                  Mark if inbound driver owes payment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPODEnabled(!isPODEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:ring-offset-2 ${
                  isPODEnabled ? "bg-[#ea690c]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPODEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          <Separator className="bg-[#d1d1d1]" />

          {/* Delivery Fee Section */}
          <section className="flex flex-col gap-4">
            <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Delivery Fee
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6">
                    Package Fee
                  </Label>
                  <span className="text-sm font-semibold text-[#e22420]">*</span>
                </div>
                <Input
                  placeholder="eg. 100"
                  className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6">
                    Transportation Fee
                  </Label>
                  <span className="text-sm font-semibold text-[#e22420]">*</span>
                </div>
                <Input
                  placeholder="eg. 30"
                  className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                />
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
              onClick={onNext}
              className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
            >
              <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
                Continue
              </span>
              <ArrowRightIcon className="w-6 h-6" />
            </Button>
          </nav>
        </div>
      </CardContent>
    </Card>
  );
};

