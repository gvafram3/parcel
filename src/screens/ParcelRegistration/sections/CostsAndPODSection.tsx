import React, { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CalculatorIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import { Parcel } from "../../../types";

interface BulkEntrySession {
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    parcels: Partial<Parcel>[];
}

interface CostsAndPODSectionProps {
    onPrevious: () => void;
    onNext: () => void;
    bulkSession: BulkEntrySession | null;
    singleEntryData?: {
        recipientName: string;
        recipientPhone: string;
        itemDescription?: string;
        shelfLocation: string;
        itemValue: number;
        specialNotes?: string;
    } | null;
    onComplete?: (itemValue: number) => void;
}

export const CostsAndPODSection = ({
    onPrevious,
    onNext,
    bulkSession,
    singleEntryData,
    onComplete,
}: CostsAndPODSectionProps): JSX.Element => {
    const [itemValue, setItemValue] = useState(
        singleEntryData?.itemValue?.toString() || ""
    );

    const handleNext = () => {
        if (singleEntryData && onComplete) {
            const value = itemValue ? parseFloat(itemValue) : 0;
            onComplete(value);
        } else {
            onNext();
        }
    };

    // For bulk entry, this section is skipped or just shows summary
    if (bulkSession) {
        return (
            <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                    <header className="inline-flex items-center gap-2">
                        <CalculatorIcon className="w-6 h-6 text-[#ea690c]" />
                        <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)]">
                            Costs & Payment On Delivery
                        </h1>
                    </header>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            For bulk entries, item values are set per parcel. Delivery fees will be
                            determined during call center operations.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={onPrevious}
                            className="flex w-full items-center justify-center gap-3 rounded border border-[#888888] bg-transparent px-6 py-3 hover:bg-gray-50 sm:w-auto"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                            <span className="font-body-md-semibold">Previous</span>
                        </Button>

                        <Button
                            onClick={onNext}
                            className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
                        >
                            <span className="font-body-md-semibold text-white">Continue to Review</span>
                            <ArrowRightIcon className="w-6 h-6" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Single entry mode
    return (
        <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-sm">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                <header className="inline-flex items-center gap-2">
                    <CalculatorIcon className="w-6 h-6 text-[#ea690c]" />
                    <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)]">
                        Costs & Payment On Delivery (POD)
                    </h1>
                </header>

                <div className="flex flex-col gap-6 w-full">
                    {/* Item Value Section */}
                    <section className="flex flex-col gap-4">
                        <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                            Item Value
                        </h2>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6">
                                    Item Value (GHC)
                                </Label>
                                <span className="text-xs text-[#9a9a9a]">(optional)</span>
                            </div>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={itemValue}
                                onChange={(e) => setItemValue(e.target.value)}
                                className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2"
                            />
                            <p className="text-xs text-[#5d5d5d]">
                                Amount customer must pay for the item (if applicable)
                            </p>
                        </div>
                    </section>

                    <Separator className="bg-[#d1d1d1]" />

                    {/* Summary */}
                    <section className="flex flex-col gap-3">
                        <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                            Summary
                        </h2>
                        <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
                            {singleEntryData && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                            Recipient
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                            {singleEntryData.recipientName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                            Shelf Location
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                            {singleEntryData.shelfLocation}
                                        </span>
                                    </div>
                                    <Separator className="bg-[#d1d1d1] my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                            Item Value
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                            GHC {itemValue ? parseFloat(itemValue).toFixed(2) : "0.00"}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={onPrevious}
                            className="flex w-full items-center justify-center gap-3 rounded border border-[#888888] bg-transparent px-6 py-3 hover:bg-gray-50 sm:w-auto"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                            <span className="font-body-md-semibold text-[#4f4f4f]">Previous</span>
                        </Button>

                        <Button
                            onClick={handleNext}
                            className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
                        >
                            <span className="font-body-md-semibold text-white">Complete Registration</span>
                            <ArrowRightIcon className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
