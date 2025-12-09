import { useState } from "react";
import {
  ArrowRightIcon,
  DollarSignIcon,
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  CameraIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";

interface RemittanceItem {
  id: string;
  riderName: string;
  parcelCount: number;
  amount: string;
  parcelId: string;
  recipientName: string;
  totalAmount: number;
}

const remittanceQueue: RemittanceItem[] = [
  {
    id: "1",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764912",
    recipientName: "Visca Afram Gyebi",
    totalAmount: 100.00,
  },
  {
    id: "2",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764913",
    recipientName: "Jane Smith",
    totalAmount: 100.00,
  },
  {
    id: "3",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764914",
    recipientName: "Alice Johnson",
    totalAmount: 100.00,
  },
  {
    id: "4",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764915",
    recipientName: "Bob Williams",
    totalAmount: 100.00,
  },
  {
    id: "5",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764916",
    recipientName: "Charlie Brown",
    totalAmount: 100.00,
  },
  {
    id: "6",
    riderName: "John Kofi Amekudzi",
    parcelCount: 1,
    amount: "GHC 100.00",
    parcelId: "PAK - 21764917",
    recipientName: "Diana Prince",
    totalAmount: 100.00,
  },
];

export const Reconciliation = (): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState<RemittanceItem | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [showModal, setShowModal] = useState(false);

  const receivedAmount = parseFloat(amountReceived) || 0;
  const discrepancy = selectedItem ? selectedItem.totalAmount - receivedAmount : 0;
  const hasDiscrepancy = discrepancy > 0 && amountReceived !== "";

  const handleProceed = () => {
    if (!hasDiscrepancy && amountReceived && selectedItem) {
      setShowModal(true);
    }
  };

  return (
    <div className={`w-full ${showModal ? "overflow-hidden" : ""}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Cash Reconciliation - Center */}
            <div className="lg:col-span-3">
              {selectedItem ? (
                <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                  <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                    <header className="inline-flex items-center gap-2">
                      <DollarSignIcon className="w-6 h-6 text-[#ea690c]" />
                      <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                        Cash Reconciliation
                      </h2>
                    </header>

                    <div className="flex flex-col gap-4">
                      {/* Select Rider */}
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Select Rider<span className="text-[#e22420]">*</span>
                        </Label>
                        <select
                          value={selectedItem.riderName}
                          disabled
                          className="w-full rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 cursor-not-allowed"
                        >
                          <option>{selectedItem.riderName}</option>
                        </select>
                      </div>

                      {/* Parcel ID */}
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Parcel ID<span className="text-[#e22420]">*</span>
                        </Label>
                        <select
                          value={selectedItem.parcelId}
                          disabled
                          className="w-full rounded border border-[#d1d1d1] bg-gray-50 px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 cursor-not-allowed"
                        >
                          <option>{selectedItem.parcelId}</option>
                        </select>
                      </div>

                      {/* Parcel Details Box */}
                      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col">
                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base mb-1">
                              {selectedItem.recipientName}
                            </span>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 w-fit">
                              {selectedItem.parcelId}
                            </Badge>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            Delivery
                          </Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                            Total Amount: GHC {selectedItem.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Amount Received */}
                      <div className="flex flex-col gap-2">
                        <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          Amount Received<span className="text-[#e22420]">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="eg. 20"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700"
                        />
                      </div>

                      {/* Discrepancy Alert */}
                      {hasDiscrepancy && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 flex items-start gap-2">
                          <AlertCircleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="[font-family:'Lato',Helvetica] font-normal text-orange-800 text-sm">
                            Discrepancy detected: GHC {discrepancy.toFixed(2)} short
                          </span>
                        </div>
                      )}

                      {/* Proceed Button */}
                      <Button
                        onClick={handleProceed}
                        disabled={!amountReceived || hasDiscrepancy}
                        className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                          Proceed
                        </span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                  <CardContent className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <DollarSignIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4" />
                      <p className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-base">
                        Select an item from the Remittance Queue to begin reconciliation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Remittance Queue - Right Side */}
            <div className="lg:col-span-1">
              <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm h-full">
                <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
                  <header className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <UserIcon className="w-6 h-6 text-[#ea690c]" />
                      <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                        Remittance Queue
                      </h2>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                      28 waiting
                    </Badge>
                  </header>

                  <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                    {remittanceQueue.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setAmountReceived("");
                        }}
                        className={`rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors ${selectedItem?.id === item.id
                            ? "border-[#ea690c] bg-orange-50"
                            : "border-[#d1d1d1] bg-white"
                          }`}
                      >
                        <div className="flex flex-col gap-2">
                          <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                            {item.riderName}
                          </span>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
                              {item.parcelCount} Parcel
                            </Badge>
                            <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                              {item.amount}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Confirm Reconciliation Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2">
                  <CameraIcon className="w-6 h-6 text-[#ea690c]" />
                  <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)]">
                    Confirm Reconciliation
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#9a9a9a] hover:text-neutral-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Receiver's Details */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                    Receiver&apos;s Details
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        John Kofitse Amekudzi
                      </span>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone Number: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        +233 24 245 8248
                      </span>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Address: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        UCC Campus
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sender's Details */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                    Sender&apos;s Details
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Name: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        John Doe
                      </span>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone Number: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        +233 24 245 8248
                      </span>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Address: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        Accra
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)]">
                    Fee Breakdown
                  </h3>
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
                    <div className="flex justify-between items-center pt-2 border-t border-[#d1d1d1]">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                        Total Amount
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                        GHC 130.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowModal(false);
                      // Handle complete reconciliation
                    }}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
