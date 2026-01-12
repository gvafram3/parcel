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
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatPhoneNumber, formatCurrency, formatDateTime } from "../../utils/dataHelpers";
import frontdeskService, { DeliveryAssignmentResponse } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";

interface ReconciliationParcel {
  parcelId: string;
  parcelDescription?: string;
  receiverName?: string;
  receiverPhoneNumber?: string;
  receiverAddress?: string;
  parcelAmount: number;
  delivered: boolean;
  cancelled: boolean;
  paymentMethod?: string | null;
}

interface RiderGroup {
  riderId: string;
  riderName: string;
  riderPhoneNumber?: string;
  deliveredParcels: ReconciliationParcel[];
  totalDeliveredAmount: number;
  totalDeliveredCount: number;
  totalParcelsCount: number; // Total parcels (delivered + not delivered)
  assignmentIds: string[]; // All assignment IDs for this rider
}

export const Reconciliation = (): JSX.Element => {
  const { showToast } = useToast();
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 200, // Fetch at least 200 items
    totalElements: 0,
    totalPages: 0,
  });

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

  // Group assignments by rider and filter only delivered parcels
  const riderGroups = useMemo(() => {
    const groupsMap = new Map<string, RiderGroup>();

    rawAssignments.forEach((assignment: any) => {
      const riderId = assignment.riderInfo?.riderId || assignment.riderId || 'unknown';
      const riderName = assignment.riderInfo?.riderName || assignment.riderName || 'Unknown Rider';
      const riderPhoneNumber = assignment.riderInfo?.riderPhoneNumber || assignment.riderPhoneNumber;

      if (!groupsMap.has(riderId)) {
        groupsMap.set(riderId, {
          riderId,
          riderName,
          riderPhoneNumber,
          deliveredParcels: [],
          totalDeliveredAmount: 0,
          totalDeliveredCount: 0,
          totalParcelsCount: 0,
          assignmentIds: [],
        });
      }

      const group = groupsMap.get(riderId)!;
      
      // Add assignment ID
      if (!group.assignmentIds.includes(assignment.assignmentId)) {
        group.assignmentIds.push(assignment.assignmentId);
      }

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
              parcelAmount,
              delivered: true,
              cancelled: false,
              paymentMethod: parcel.paymentMethod,
            });
            group.totalDeliveredAmount += parcelAmount;
            group.totalDeliveredCount++;
          }
        });
      }
    });

    // Filter out riders with no delivered parcels and sort by rider name
    return Array.from(groupsMap.values())
      .filter(group => group.deliveredParcels.length > 0)
      .sort((a, b) => a.riderName.localeCompare(b.riderName));
  }, [rawAssignments]);

  // Calculate totals for selected riders
  const selectedRidersData = useMemo(() => {
    return riderGroups.filter(group => selectedRiders.has(group.riderId));
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
      setSelectedRiders(new Set(riderGroups.map(g => g.riderId)));
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
      // Get all assignment IDs from selected riders
      const assignmentIds: string[] = [];
      selectedRidersData.forEach(group => {
        assignmentIds.push(...group.assignmentIds);
      });

      console.log('Reconciling assignments:', assignmentIds);
      const response = await frontdeskService.reconcileRiderPayments(assignmentIds);

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
        <main className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">Reconciliation</h1>
              <p className="text-sm text-gray-600">Approve and reconcile delivered assignments</p>
            </div>
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Stats</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {riderGroups.map((group, groupIndex) => {
                        const isSelected = selectedRiders.has(group.riderId);
                        const isExpanded = expandedRiders.has(group.riderId);

                        return (
                          <>
                            {/* Rider Group Header Row */}
                            <tr
                              key={group.riderId}
                              className={`hover:bg-gray-50 transition-colors ${groupIndex !== riderGroups.length - 1 ? 'border-b border-gray-200' : ''} ${isSelected ? 'bg-orange-50' : ''}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleRiderSelection(group.riderId)}
                                  className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                />
                              </td>
                              <td className="px-4 py-4 border-r border-gray-100">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleRiderExpansion(group.riderId)}
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
                                      {group.riderPhoneNumber && (
                                        <div className="text-xs text-gray-500">
                                          {formatPhoneNumber(group.riderPhoneNumber)}
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
                                  {formatCurrency(group.totalDeliveredAmount)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  {group.totalDeliveredCount} Delivered
                                </Badge>
                              </td>
                            </tr>
                            {/* Expanded Parcels Rows */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="px-0 py-0">
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
                        <tr key={group.riderId} className="border-b border-gray-100">
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
    </div>
  );
};
