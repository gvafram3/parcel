import { useState, useEffect, useMemo } from "react";
import {
  CheckCircleIcon,
  XIcon,
  Loader,
  PackageIcon,
  MapPinIcon,
  Phone,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  History,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatPhoneNumber, formatCurrency, formatDateTime } from "../../utils/dataHelpers";
import frontdeskService from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import { ReconciliationHistory } from "../ReconciliationHistory/ReconciliationHistory";

interface ReconciliationParcel {
  parcelId: string;
  parcelDescription?: string;
  receiverName?: string;
  receiverPhoneNumber?: string;
  receiverAddress?: string;
  senderName?: string | null;
  senderPhoneNumber?: string;
  parcelAmount: number;
  deliveryCost?: number;
  inboundCost?: number;
  delivered: boolean;
  cancelled: boolean;
  returned?: boolean;
  paymentMethod?: string | null;
}

interface AssignmentData {
  assignmentId: string;
  totalAmount: number; // Total amount for delivered parcels in this assignment
}

interface RiderGroup {
  assignmentId: string; // Use assignmentId as unique key instead of riderId
  riderId: string;
  riderName: string;
  riderPhoneNumber?: string;
  assignedAt?: number; // Timestamp for the assignment date
  amount: number; // Total amount from assignment (for payedAmount in reconciliation)
  deliveryCost: number; // Total delivery cost (driver's money)
  inboundCost: number; // Total inbound cost (driver's money)
  deliveredParcels: ReconciliationParcel[];
  totalDeliveredAmount: number;
  totalDeliveredCount: number;
  totalParcelsCount: number; // Total parcels (delivered + not delivered)
  assignments: Map<string, AssignmentData>; // Map of assignmentId to assignment data with amounts
}

export const Reconciliation = (): JSX.Element => {
  const { showToast } = useToast();
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ReconciliationParcel | null>(null);
  const [showParcelDetailsModal, setShowParcelDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 200, // Fetch at least 200 items
    totalElements: 0,
    totalPages: 0,
  });
  const [view, setView] = useState<"reconcile" | "history">("reconcile");

  // Fetch all parcel assignments with pagination (fetch at least 200)
  const fetchAssignments = async (page: number = 0, size: number = 200) => {
    setLoading(true);
    try {
      const response = await frontdeskService.getParcelAssignments(page, size);

      if (response.success && response.data) {
        const data = response.data as any;
        const allAssignments = data.content || [];
        console.log('Fetched assignments:', allAssignments.length);
        setRawAssignments(allAssignments);
        setPagination({
          page: data.number || 0,
          size: data.size || size,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        });
      } else {
        showToast(response.message || "Failed to load assignments", "error");
        setRawAssignments([]);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      showToast("Failed to load assignments. Please try again.", "error");
      setRawAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(pagination.page, pagination.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.size]);

  // Group assignments by assignmentId (don't merge same rider's assignments)
  const riderGroups = useMemo(() => {
    const groupsMap = new Map<string, RiderGroup>();

    rawAssignments.forEach((assignment: any) => {
      const assignmentId = assignment.assignmentId;
      if (!assignmentId) return; // Skip if no assignmentId

      const riderId = assignment.riderInfo?.riderId || assignment.riderId || 'unknown';
      const riderName = assignment.riderInfo?.riderName || assignment.riderName || 'Unknown Rider';
      const riderPhoneNumber = assignment.riderInfo?.riderPhoneNumber || assignment.riderPhoneNumber;
      const assignedAt = assignment.assignedAt;
      const assignmentAmount = assignment.amount || 0;
      const assignmentDeliveryCost = assignment.deliveryCost || 0;
      const assignmentInboundCost = assignment.inboundCost || 0;

      // Create a unique group for each assignment (not merged by rider)
      if (!groupsMap.has(assignmentId)) {
        groupsMap.set(assignmentId, {
          assignmentId,
          riderId,
          riderName,
          riderPhoneNumber,
          assignedAt,
          amount: assignmentAmount,
          deliveryCost: assignmentDeliveryCost,
          inboundCost: assignmentInboundCost,
          deliveredParcels: [],
          totalDeliveredAmount: 0,
          totalDeliveredCount: 0,
          totalParcelsCount: 0,
          assignments: new Map<string, AssignmentData>(),
        });
      }

      const group = groupsMap.get(assignmentId)!;

      // Initialize assignment data if not exists
      if (!group.assignments.has(assignmentId)) {
        group.assignments.set(assignmentId, {
          assignmentId: assignmentId,
          totalAmount: 0,
        });
      }

      const assignmentData = group.assignments.get(assignmentId)!;

      // Process parcels array
      if (assignment.parcels && Array.isArray(assignment.parcels)) {
        assignment.parcels.forEach((parcel: any) => {
          group.totalParcelsCount++;

          // Only include delivered parcels (not cancelled)
          if (parcel.delivered && !parcel.cancelled) {
            const parcelAmount = parcel.parcelAmount || 0;
            group.deliveredParcels.push({
              parcelId: parcel.parcelId,
              parcelDescription: parcel.parcelDescription,
              receiverName: parcel.receiverName,
              receiverPhoneNumber: parcel.receiverPhoneNumber,
              receiverAddress: parcel.receiverAddress,
              senderName: parcel.senderName,
              senderPhoneNumber: parcel.senderPhoneNumber,
              parcelAmount,
              deliveryCost: parcel.deliveryCost,
              inboundCost: parcel.inboundCost,
              delivered: true,
              cancelled: false,
              returned: parcel.returned || false,
              paymentMethod: parcel.paymentMethod,
            });
            group.totalDeliveredAmount += parcelAmount;
            assignmentData.totalAmount += parcelAmount;
            group.totalDeliveredCount++;
          }
        });
      }
    });

    // Filter out assignments with no delivered parcels and sort by rider name, then by assigned date (newest first)
    return Array.from(groupsMap.values())
      .filter(group => group.deliveredParcels.length > 0)
      .sort((a, b) => {
        // Sort by rider name first, then by assigned date (newest first)
        if (a.riderName !== b.riderName) {
          return a.riderName.localeCompare(b.riderName);
        }
        const dateA = a.assignedAt || 0;
        const dateB = b.assignedAt || 0;
        return dateB - dateA; // Newest first
      });
  }, [rawAssignments]);

  // Calculate totals for selected assignments
  const selectedRidersData = useMemo(() => {
    return riderGroups.filter(group => selectedRiders.has(group.assignmentId));
  }, [riderGroups, selectedRiders]);

  const totalAmount = useMemo(() => {
    return selectedRidersData.reduce((sum, group) => sum + group.totalDeliveredAmount, 0);
  }, [selectedRidersData]);

  const totalParcels = useMemo(() => {
    return selectedRidersData.reduce((sum, group) => sum + group.totalDeliveredCount, 0);
  }, [selectedRidersData]);

  const handleToggleRiderSelection = (riderId: string) => {
    setSelectedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riderId)) {
        newSet.delete(riderId);
      } else {
        newSet.add(riderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRiders.size === riderGroups.length) {
      setSelectedRiders(new Set());
    } else {
      setSelectedRiders(new Set(riderGroups.map(g => g.assignmentId)));
    }
  };

  const handleToggleRiderExpansion = (riderId: string) => {
    setExpandedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riderId)) {
        newSet.delete(riderId);
      } else {
        newSet.add(riderId);
      }
      return newSet;
    });
  };

  const handleReconcile = async () => {
    if (selectedRiders.size === 0) {
      showToast("Please select at least one rider to reconcile", "error");
      return;
    }

    setIsReconciling(true);
    try {
      // Build reconciliation payload with assignmentId, reconciledAt, and payedAmount
      const reconciliationPayload: Array<{
        assignmentId: string;
        reconciledAt: number;
        payedAmount: number;
      }> = [];

      selectedRidersData.forEach(group => {
        // Use assignmentId and amount from the group (assignment level)
        if (group.amount > 0) {
          reconciliationPayload.push({
            assignmentId: group.assignmentId,
            reconciledAt: Date.now(), // Current timestamp in milliseconds
            payedAmount: group.amount, // Use assignment.amount
          });
        }
      });

      console.log('Reconciling assignments with payload:', reconciliationPayload);
      const response = await frontdeskService.reconcileRiderPayments(reconciliationPayload);

      if (response.success) {
        showToast(`Successfully reconciled ${selectedRiders.size} rider(s) with ${totalParcels} parcel(s)`, "success");
        setSelectedRiders(new Set());
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
        {/* View toggle: Reconcile | View History */}
        <div className="flex gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setView("reconcile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "reconcile"
                ? "bg-[#ea690c] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Reconcile
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "history"
                ? "bg-[#ea690c] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <History className="w-4 h-4" />
            View History
          </button>
        </div>

        {view === "history" ? (
          <ReconciliationHistory embedded />
        ) : (
        <main className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            {/* <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">Reconciliation</h1>
              <p className="text-sm text-gray-600">Approve and reconcile delivered assignments</p>
            </div> */}
            {selectedRiders.size > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-base font-semibold">
                {selectedRiders.size} Rider{selectedRiders.size !== 1 ? 's' : ''} Selected
              </Badge>
            )}
          </div>

          {/* Summary Card */}
          {selectedRiders.size > 0 && (
            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Riders Selected</p>
                      <p className="text-2xl font-bold text-[#ea690c]">{selectedRiders.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivered Parcels</p>
                      <p className="text-2xl font-bold text-blue-600">{totalParcels}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedRiders.size === 0 || isReconciling}
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
              ) : riderGroups.length === 0 ? (
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
                            checked={selectedRiders.size === riderGroups.length && riderGroups.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Rider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Delivered Parcels</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Exp Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Deliverd Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Delivery Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Inbound Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {riderGroups.map((group, groupIndex) => {
                        const isSelected = selectedRiders.has(group.assignmentId);
                        const isExpanded = expandedRiders.has(group.assignmentId);

                        return (
                          <>
                            {/* Rider Group Header Row */}
                            <tr
                              key={group.assignmentId}
                              className={`hover:bg-gray-50 transition-colors ${groupIndex !== riderGroups.length - 1 ? 'border-b border-gray-200' : ''} ${isSelected ? 'bg-orange-50' : ''}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleRiderSelection(group.assignmentId)}
                                  className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                />
                              </td>
                              <td className="px-4 py-4 border-r border-gray-100">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleRiderExpansion(group.assignmentId)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronDownIcon className="w-4 h-4" />
                                    ) : (
                                      <ChevronRightIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-blue-500" />
                                    <div>
                                      <div className="text-sm font-semibold text-neutral-800">
                                        {group.riderName}
                                      </div>
                                      {group.assignedAt && (
                                        <div className="text-xs text-gray-500">
                                          {formatDateTime(new Date(group.assignedAt).toISOString())}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-semibold text-blue-600">
                                  {group.totalDeliveredCount} / {group.totalParcelsCount}
                                </div>
                                <div className="text-xs text-gray-500">Delivered / Total</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-bold text-[#ea690c]">
                                  {formatCurrency(group.amount)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-bold text-[#ea690c]">
                                  {formatCurrency(group.totalDeliveredAmount)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-bold text-green-600">
                                  {formatCurrency(group.deliveryCost)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-blue-600">
                                  {formatCurrency(group.inboundCost)}
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Parcels Rows */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="px-0 py-0">
                                  <div className="bg-gray-50 border-t border-gray-200">
                                    <table className="w-full">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Recipient</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Location</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Payment</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Details</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.deliveredParcels.map((parcel, parcelIndex) => (
                                          <tr
                                            key={parcel.parcelId}
                                            className={`${parcelIndex !== group.deliveredParcels.length - 1 ? 'border-b border-gray-200' : ''}`}
                                          >
                                            <td className="px-4 py-3">
                                              <div className="text-sm font-semibold text-neutral-800">
                                                {parcel.receiverName || "N/A"}
                                              </div>
                                              {parcel.parcelDescription && (
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                                  {parcel.parcelDescription}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              {parcel.receiverPhoneNumber ? (
                                                <a
                                                  href={`tel:${parcel.receiverPhoneNumber}`}
                                                  className="text-sm text-[#ea690c] hover:underline font-medium"
                                                >
                                                  {formatPhoneNumber(parcel.receiverPhoneNumber)}
                                                </a>
                                              ) : (
                                                <span className="text-sm text-gray-400">N/A</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="text-sm text-neutral-700">
                                                {parcel.receiverAddress ? (
                                                  <div className="flex items-start gap-1">
                                                    <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]" title={parcel.receiverAddress}>
                                                      {parcel.receiverAddress}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-400">N/A</span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="text-sm font-bold text-[#ea690c]">
                                                {formatCurrency(parcel.parcelAmount)}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <Badge className={`${parcel.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : parcel.paymentMethod === 'momo' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} border text-xs`}>
                                                {parcel.paymentMethod || 'N/A'}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center gap-2">
                                                {parcel.receiverPhoneNumber && (
                                                  <Button
                                                    onClick={() => window.location.href = `tel:${parcel.receiverPhoneNumber}`}
                                                    variant="outline"
                                                    className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2.5 py-1.5"
                                                    title={`Call ${parcel.receiverName || 'recipient'}`}
                                                  >
                                                    <Phone className="w-3.5 h-3.5" />
                                                  </Button>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <Button
                                                onClick={() => {
                                                  setSelectedParcel(parcel);
                                                  setShowParcelDetailsModal(true);
                                                }}
                                                variant="outline"
                                                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2.5 py-1.5"
                                                title="View parcel details"
                                              >
                                                View Details
                                              </Button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
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
                    {riderGroups.length > 0 && (
                      <span className="ml-2 text-gray-500">
                        ({riderGroups.length} riders with delivered parcels)
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
        )}
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
                    You are about to reconcile {selectedRiders.size} rider(s)
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <p className="text-sm text-blue-800">
                      Total Parcels: <span className="font-bold">{totalParcels}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Total Amount: <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Rider</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Parcels</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRidersData.map((group) => (
                        <tr key={group.assignmentId} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-semibold">{group.riderName}</td>
                          <td className="px-3 py-2">{group.totalDeliveredCount} delivered</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(group.totalDeliveredAmount)}</td>
                        </tr>
                      ))}
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

      {/* Parcel Details Modal */}
      {showParcelDetailsModal && selectedParcel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                <button
                  onClick={() => {
                    setShowParcelDetailsModal(false);
                    setSelectedParcel(null);
                  }}
                  className="text-[#9a9a9a] hover:text-neutral-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-sm font-semibold px-3 py-1 shadow-sm">
                    {selectedParcel.parcelId}
                  </Badge>
                  <Badge className={`${selectedParcel.delivered ? 'bg-green-100 text-green-800' : selectedParcel.cancelled ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'} border text-xs`}>
                    {selectedParcel.delivered ? 'Delivered' : selectedParcel.cancelled ? 'Cancelled' : 'Pending'}
                  </Badge>
                  {selectedParcel.returned && (
                    <Badge className="bg-orange-100 text-orange-800 border text-xs">
                      Returned
                    </Badge>
                  )}
                </div>

                {/* Recipient Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Recipient Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-semibold text-neutral-800">{selectedParcel.receiverName || "N/A"}</p>
                    </div>
                    {selectedParcel.receiverPhoneNumber && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Phone</p>
                        <a
                          href={`tel:${selectedParcel.receiverPhoneNumber}`}
                          className="text-sm font-semibold text-[#ea690c] hover:underline"
                        >
                          {formatPhoneNumber(selectedParcel.receiverPhoneNumber)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                {selectedParcel.receiverAddress && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      Delivery Address
                    </h4>
                    <p className="text-sm text-neutral-800">
                      {selectedParcel.receiverAddress}
                    </p>
                  </div>
                )}

                {/* Sender Information */}
                {(selectedParcel.senderName || selectedParcel.senderPhoneNumber) && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Sender Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedParcel.senderName && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Name</p>
                          <p className="text-sm font-semibold text-neutral-800">{selectedParcel.senderName}</p>
                        </div>
                      )}
                      {selectedParcel.senderPhoneNumber && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Phone</p>
                          <a
                            href={`tel:${selectedParcel.senderPhoneNumber}`}
                            className="text-sm font-semibold text-[#ea690c] hover:underline"
                          >
                            {formatPhoneNumber(selectedParcel.senderPhoneNumber)}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Item Description */}
                {selectedParcel.parcelDescription && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Item Description</h4>
                    <p className="text-sm text-neutral-800">{selectedParcel.parcelDescription}</p>
                  </div>
                )}

                {/* Amount Breakdown */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                  <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <PackageIcon className="w-4 h-4" />
                    Amount Breakdown
                  </h4>
                  <div className="space-y-3 bg-white/60 rounded-lg p-4">
                    {/* Inbound Cost - Always shown */}
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <div>
                        <span className="text-sm font-semibold text-gray-700 block">Inbound Cost</span>
                        <span className="text-xs text-gray-500">(Driver's money)</span>
                      </div>
                      <span className="text-base font-bold text-blue-600">
                        {formatCurrency(selectedParcel.inboundCost || 0)}
                      </span>
                    </div>
                    {/* Delivery Cost - Always shown */}
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <div>
                        <span className="text-sm font-semibold text-gray-700 block">Delivery Cost</span>
                        <span className="text-xs text-gray-500">(Driver's money)</span>
                      </div>
                      <span className="text-base font-bold text-green-600">
                        {formatCurrency(selectedParcel.deliveryCost || 0)}
                      </span>
                    </div>
                    {/* Total Amount */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold text-orange-900">Total Parcel Amount:</span>
                      <span className="text-xl font-bold text-[#ea690c]">
                        {formatCurrency(selectedParcel.parcelAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Payment Method:</span>
                      <Badge className={`${selectedParcel.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : selectedParcel.paymentMethod === 'momo' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} border text-xs`}>
                        {selectedParcel.paymentMethod || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Status:</span>
                      <Badge className={`${selectedParcel.delivered ? 'bg-green-100 text-green-800' : selectedParcel.cancelled ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} border text-xs`}>
                        {selectedParcel.delivered ? 'Delivered' : selectedParcel.cancelled ? 'Cancelled' : 'Pending'}
                      </Badge>
                      {selectedParcel.returned && (
                        <Badge className="bg-orange-100 text-orange-800 border text-xs">
                          Returned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
