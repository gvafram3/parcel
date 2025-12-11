import { useState, useEffect } from "react";
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
import { useStation } from "../../contexts/StationContext";
import { getRemittanceItems, markParcelAsCollected, RemittanceItem as RemittanceItemType } from "../../data/mockData";
import { formatPhoneNumber, formatCurrency } from "../../utils/dataHelpers";

export const Reconciliation = (): JSX.Element => {
  const { currentStation, currentUser, userRole } = useStation();
  const [remittanceItems, setRemittanceItems] = useState<RemittanceItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<RemittanceItemType | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Always load remittance items - filter by station if not admin
    const items = getRemittanceItems(
      userRole === "admin" ? undefined : currentStation?.id
    );
    setRemittanceItems(items);
  }, [currentStation, userRole]);

  const receivedAmount = parseFloat(amountReceived) || 0;
  const discrepancy = selectedItem ? selectedItem.totalAmount - receivedAmount : 0;
  const hasDiscrepancy = discrepancy > 0 && amountReceived !== "";

  const handleProceed = () => {
    if (!hasDiscrepancy && amountReceived && selectedItem) {
      setShowModal(true);
    }
  };

  const handleCompleteReconciliation = () => {
    if (!selectedItem || !currentUser || !amountReceived) return;

    const success = markParcelAsCollected(
      selectedItem.parcelId,
      receivedAmount,
      currentUser.id
    );

    if (success) {
      // Remove from remittance queue
      setRemittanceItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setShowModal(false);
      setSelectedItem(null);
      setAmountReceived("");
      alert("Reconciliation completed successfully!");
      
      // Refresh items
      const items = getRemittanceItems(
        userRole === "admin" ? undefined : currentStation?.id
      );
      setRemittanceItems(items);
    } else {
      alert("Failed to complete reconciliation. Please try again.");
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
                            {selectedItem.recipientPhone && (
                              <span className="text-xs text-neutral-600 mt-1">
                                {formatPhoneNumber(selectedItem.recipientPhone)}
                              </span>
                            )}
                            {selectedItem.deliveryAddress && (
                              <span className="text-xs text-neutral-600 mt-1">
                                {selectedItem.deliveryAddress}
                              </span>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            Delivered
                          </Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                            Total Amount: {formatCurrency(selectedItem.totalAmount)}
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
                          placeholder="eg. 100.00"
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
                            Discrepancy detected: {formatCurrency(discrepancy)} short
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
                      {remittanceItems.length} waiting
                    </Badge>
                  </header>

                  {remittanceItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#5d5d5d]">No items in remittance queue</p>
                      <p className="text-xs text-[#9a9a9a] mt-2">
                        Delivered parcels will appear here for reconciliation
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                      {remittanceItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setAmountReceived(item.amountCollected?.toString() || "");
                          }}
                          className={`rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedItem?.id === item.id
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
                                {item.parcelId}
                              </Badge>
                              <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                                {formatCurrency(item.totalAmount)}
                              </span>
                            </div>
                            <span className="text-xs text-[#5d5d5d]">
                              {item.recipientName}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
                        {selectedItem.recipientName}
                      </span>
                    </div>
                    <div>
                      <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Phone Number: </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        {formatPhoneNumber(selectedItem.recipientPhone)}
                      </span>
                    </div>
                    {selectedItem.deliveryAddress && (
                      <div>
                        <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-sm">Address: </span>
                        <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                          {selectedItem.deliveryAddress}
                        </span>
                      </div>
                    )}
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
                        Item Value
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        {formatCurrency(selectedItem.itemValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                        Delivery Fee
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        {formatCurrency(selectedItem.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#d1d1d1]">
                      <span className="[font-family:'Lato',Helvetica] font-bold text-neutral-800 text-base">
                        Total Amount
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-lg">
                        {formatCurrency(selectedItem.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#d1d1d1]">
                      <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                        Amount Received
                      </span>
                      <span className="[font-family:'Lato',Helvetica] font-bold text-green-600 text-lg">
                        {formatCurrency(receivedAmount)}
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
                    onClick={handleCompleteReconciliation}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    Complete Reconciliation
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
