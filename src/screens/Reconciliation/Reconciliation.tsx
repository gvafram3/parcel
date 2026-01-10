import { useState, useEffect, useMemo } from "react";
import {
  CheckCircleIcon,
  XIcon,
  Loader,
  PackageIcon,
  MapPinIcon,
  Phone,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatPhoneNumber, formatCurrency, formatDateTime } from "../../utils/dataHelpers";
import frontdeskService, { DeliveryAssignmentResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";

export const Reconciliation = (): JSX.Element => {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<DeliveryAssignmentResponse[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  // Fetch all parcel assignments with pagination
  const fetchAssignments = async (page: number = 0, size: number = 20) => {
    setLoading(true);
    try {
      const response = await frontdeskService.getParcelAssignments(page, size);

      if (response.success && response.data) {
        const data = response.data as any;
        const allAssignments = data.content as DeliveryAssignmentResponse[];
        // Filter only delivered assignments that haven't been paid
        const deliveredAssignments = allAssignments.filter(
          assignment => assignment.status === "DELIVERED" && !assignment.payed
        );
        setAssignments(deliveredAssignments);
        setPagination({
          page: data.number || 0,
          size: data.size || size,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        });
      } else {
        showToast(response.message || "Failed to load assignments", "error");
        setAssignments([]);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      showToast("Failed to load assignments. Please try again.", "error");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(pagination.page, pagination.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.size]);

  // Calculate totals for selected assignments
  const selectedAssignmentsData = useMemo(() => {
    return assignments.filter(a => selectedAssignments.has(a.assignmentId));
  }, [assignments, selectedAssignments]);

  const totalAmount = useMemo(() => {
    return selectedAssignmentsData.reduce((sum, assignment) => {
      const parcel = assignment.parcel;
      return sum + (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
        (parcel.inboundCost || 0) + (parcel.storageCost || 0);
    }, 0);
  }, [selectedAssignmentsData]);

  const handleToggleSelection = (assignmentId: string) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAssignments.size === assignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(new Set(assignments.map(a => a.assignmentId)));
    }
  };

  const handleReconcile = async () => {
    if (selectedAssignments.size === 0) {
      showToast("Please select at least one assignment to reconcile", "error");
      return;
    }

    setIsReconciling(true);
    try {
      const assignmentIds = Array.from(selectedAssignments);
      const response = await frontdeskService.reconcileRiderPayments(assignmentIds);

      if (response.success) {
        showToast(`Successfully reconciled ${assignmentIds.length} assignment(s)`, "success");
        setSelectedAssignments(new Set());
        await fetchAssignments(pagination.page, pagination.size);
        setShowConfirmModal(false);
      } else {
        showToast(response.message || "Failed to reconcile assignments", "error");
      }
    } catch (error) {
      console.error("Reconciliation error:", error);
      showToast("Failed to reconcile assignments. Please try again.", "error");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className={`w-full ${showConfirmModal ? "overflow-hidden" : ""}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">Reconciliation</h1>
              <p className="text-sm text-gray-600">Approve and reconcile delivered assignments</p>
            </div>
            {selectedAssignments.size > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-base font-semibold">
                {selectedAssignments.size} Selected
              </Badge>
            )}
          </div>

          {/* Summary Card */}
          {selectedAssignments.size > 0 && (
            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Selected</p>
                    <p className="text-2xl font-bold text-[#ea690c]">{selectedAssignments.size} Assignment(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                  </div>
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedAssignments.size === 0 || isReconciling}
                    className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isReconciling ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Reconciling...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Reconcile Selected
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments Table */}
          <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                  <p className="text-neutral-700 font-semibold text-lg">Loading assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-neutral-800 font-semibold text-lg mb-2">No assignments to reconcile</p>
                  <p className="text-sm text-gray-500">
                    Delivered assignments will appear here for reconciliation
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <input
                            type="checkbox"
                            checked={selectedAssignments.size === assignments.length && assignments.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Rider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Parcel ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Completed</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {assignments.map((assignment, index) => {
                        const parcel = assignment.parcel;
                        const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                          (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                        const isSelected = selectedAssignments.has(assignment.assignmentId);

                        return (
                          <tr
                            key={assignment.assignmentId}
                            className={`hover:bg-gray-50 transition-colors ${index !== assignments.length - 1 ? 'border-b border-gray-200' : ''} ${isSelected ? 'bg-orange-50' : ''}`}
                          >
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelection(assignment.assignmentId)}
                                className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                              />
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="text-sm font-semibold text-neutral-800">
                                {assignment.riderName || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
                                {parcel.parcelId}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="text-sm font-semibold text-neutral-800">
                                {parcel.receiverName || "N/A"}
                              </div>
                              {parcel.parcelDescription && (
                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                  {parcel.parcelDescription}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              {parcel.recieverPhoneNumber ? (
                                <a
                                  href={`tel:${parcel.recieverPhoneNumber}`}
                                  className="text-sm text-[#ea690c] hover:underline font-medium"
                                >
                                  {formatPhoneNumber(parcel.recieverPhoneNumber)}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="text-sm text-neutral-700">
                                {parcel.homeDelivery && parcel.receiverAddress ? (
                                  <div className="flex items-start gap-1">
                                    <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]" title={parcel.receiverAddress}>
                                      {parcel.receiverAddress}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <PackageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-sm">
                                      Shelf: <strong>{parcel.shelfName || "N/A"}</strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <div className="text-sm font-bold text-[#ea690c]">
                                {formatCurrency(totalAmount)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              {assignment.completedAt ? (
                                <div className="text-xs text-gray-600">
                                  {formatDateTime(new Date(assignment.completedAt).toISOString())}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {parcel.recieverPhoneNumber && (
                                <Button
                                  onClick={() => window.location.href = `tel:${parcel.recieverPhoneNumber}`}
                                  variant="outline"
                                  className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2.5 py-1.5"
                                  title={`Call ${parcel.receiverName || 'recipient'}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                  <div className="text-sm text-neutral-700">
                    Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} total assignments
                    {assignments.length > 0 && (
                      <span className="ml-2 text-gray-500">
                        ({assignments.length} unpaid delivered)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                      }}
                      disabled={pagination.page === 0 || loading}
                      variant="outline"
                      size="sm"
                      className="border border-[#d1d1d1]"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => {
                        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      }}
                      disabled={pagination.page >= pagination.totalPages - 1 || loading}
                      variant="outline"
                      size="sm"
                      className="border border-[#d1d1d1]"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Confirm Reconciliation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-[#ea690c]" />
                  <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)]">
                    Confirm Reconciliation
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-[#9a9a9a] hover:text-neutral-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    You are about to reconcile {selectedAssignments.size} assignment(s)
                  </p>
                  <p className="text-sm text-blue-800">
                    Total Amount: <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Parcel ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Rider</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Recipient</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAssignmentsData.map((assignment) => {
                        const parcel = assignment.parcel;
                        const amount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                          (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                        return (
                          <tr key={assignment.assignmentId} className="border-b border-gray-100">
                            <td className="px-3 py-2">{parcel.parcelId}</td>
                            <td className="px-3 py-2">{assignment.riderName}</td>
                            <td className="px-3 py-2">{parcel.receiverName || "N/A"}</td>
                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 border border-[#d1d1d1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReconcile}
                    disabled={isReconciling}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isReconciling ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Reconciling...
                      </>
                    ) : (
                      "Confirm Reconciliation"
                    )}
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
