import React from "react";
import { ArrowLeftIcon, CheckCircleIcon, FileCheckIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { Parcel } from "../../../types";

interface BulkEntrySession {
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    parcels: Partial<Parcel>[];
}

interface ReviewSectionProps {
    onPrevious: () => void;
    bulkSession: BulkEntrySession | null;
    onEndBulk: () => void;
}

export const ReviewSection = ({
    onPrevious,
    bulkSession,
    onEndBulk,
}: ReviewSectionProps): JSX.Element => {
    if (!bulkSession || bulkSession.parcels.length === 0) {
        return (
            <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                    <p className="text-neutral-700">No parcels to review.</p>
                    <Button onClick={onPrevious} variant="outline">
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const totalItemValue = bulkSession.parcels.reduce(
        (sum, p) => sum + (p.itemValue || 0),
        0
    );

    return (
        <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-sm">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                <header className="inline-flex items-center gap-2">
                    <FileCheckIcon className="w-6 h-6 text-[#ea690c]" />
                    <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)]">
                        Review Bulk Entry
                    </h1>
                </header>

                <div className="flex flex-col gap-6 w-full">
                    {/* Session Summary */}
                    <section className="flex flex-col gap-3">
                        <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                            Session Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                            <div>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                                    Driver Name:
                                </span>
                                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                                    {bulkSession.driverName}
                                </p>
                            </div>
                            <div>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                                    Vehicle Number:
                                </span>
                                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                                    {bulkSession.vehicleNumber}
                                </p>
                            </div>
                            <div>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                                    Entry Date:
                                </span>
                                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                                    {new Date(bulkSession.entryDate).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">
                                    Total Parcels:
                                </span>
                                <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm mt-1">
                                    {bulkSession.parcels.length}
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-[#d1d1d1]" />

                    {/* Parcels List */}
                    <section className="flex flex-col gap-3">
                        <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                            Parcels ({bulkSession.parcels.length})
                        </h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {bulkSession.parcels.map((parcel, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-[#d1d1d1]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                                {parcel.recipientName}
                                            </p>
                                            <p className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-xs mt-1">
                                                {parcel.recipientPhone}
                                            </p>
                                            {parcel.itemDescription && (
                                                <p className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-xs mt-1">
                                                    {parcel.itemDescription}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {parcel.shelfLocation}
                                            </span>
                                            {parcel.itemValue && parcel.itemValue > 0 && (
                                                <span className="text-xs font-semibold text-[#ea690c]">
                                                    GHC {parcel.itemValue.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator className="bg-[#d1d1d1]" />

                    {/* Summary */}
                    <section className="flex flex-col gap-3">
                        <h2 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                            Summary
                        </h2>
                        <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                    Total Parcels
                                </span>
                                <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                    {bulkSession.parcels.length}
                                </span>
                            </div>
                            {totalItemValue > 0 && (
                                <>
                                    <Separator className="bg-[#d1d1d1] my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                            Total Item Value
                                        </span>
                                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                            GHC {totalItemValue.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    <div className="flex w-full flex-col gap-3 pt-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                variant="outline"
                                onClick={onPrevious}
                                className="flex w-full items-center justify-center gap-3 rounded border border-[#888888] bg-transparent px-6 py-3 hover:bg-gray-50 sm:w-auto"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                                <span className="font-body-md-semibold text-[#4f4f4f]">Previous</span>
                            </Button>

                            <Button
                                onClick={onEndBulk}
                                className="flex w-full items-center justify-center gap-3 rounded bg-green-600 px-6 py-3 hover:bg-green-700 sm:w-auto"
                            >
                                <CheckCircleIcon className="w-6 h-6" />
                                <span className="font-body-md-semibold text-white">
                                    Complete Bulk Entry
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
