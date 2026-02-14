import React, { useEffect, useMemo, useState } from "react";
import {
  Loader,
  PackageIcon,
  MapPinIcon,
  Phone,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  CalendarIcon,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { useLocation } from "../../../contexts/LocationContext";
import { useToast } from "../../../components/ui/toast";
import adminService from "../../../services/adminService";
import { formatCurrency, formatPhoneNumber } from "../../../utils/dataHelpers";

interface ReconciliationParcel {
  parcelId: string;
  parcelDescription?: string;
  receiverName?: string;
  receiverPhoneNumber?: string;
  receiverAddress?: string;
  parcelAmount: number;
  delivered: boolean;
  cancelled?: boolean;
  paymentMethod?: string | null;
}

interface RiderGroup {
  riderId: string;
  riderName: string;
  riderPhoneNumber?: string;
  deliveredParcels: ReconciliationParcel[];
  totalDeliveredAmount: number;
  totalDeliveredCount: number;
  totalParcelsCount: number;
  assignmentIds: string[];
}

export const AdminReconciliation = (): JSX.Element => {
  const { stations } = useLocation();
  const { showToast } = useToast();

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());

  // Ensure default office when stations load
  useEffect(() => {
    if (!selectedOfficeId && stations.length > 0) {
      setSelectedOfficeId(stations[0].id);
    }
  }, [stations, selectedOfficeId]);

  const fetchReconciliations = async (
    officeId: string,
    date: Date
  ): Promise<void> => {
    if (!officeId) return;
    setLoading(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const dateInMillis = startOfDay.getTime();

      const response = await adminService.getOfficeReconciliationsByDate(
        officeId,
        dateInMillis
      );

      if (response.success && response.data) {
        const data = response.data as any;
        const content = Array.isArray(data) ? data : data.content || [];
        setRawAssignments(content);
      } else {
        showToast(
          response.message || "Failed to load reconciliations",
          "error"
        );
        setRawAssignments([]);
      }
    } catch (error) {
      console.error("Failed to fetch admin reconciliations:", error);
      showToast(
        "Failed to load reconciliations. Please try again.",
        "error"
      );
      setRawAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOfficeId) {
      fetchReconciliations(selectedOfficeId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfficeId, selectedDate]);

  // Group assignments by rider (same logic as ReconciliationHistory)
  const riderGroups = useMemo(() => {
    const groupsMap = new Map<string, RiderGroup>();

    rawAssignments.forEach((assignment: any) => {
      const riderId =
        assignment.riderInfo?.riderId || assignment.riderId || "unknown";
      const riderName =
        assignment.riderInfo?.riderName ||
        assignment.riderName ||
        "Unknown Rider";
      const riderPhoneNumber =
        assignment.riderInfo?.riderPhoneNumber || assignment.riderPhoneNumber;

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

      if (assignment.assignmentId && !group.assignmentIds.includes(assignment.assignmentId)) {
        group.assignmentIds.push(assignment.assignmentId);
      }

      if (assignment.parcels && Array.isArray(assignment.parcels)) {
        assignment.parcels.forEach((parcel: any) => {
          group.totalParcelsCount++;
          const delivered = parcel.delivered === true;
          const cancelled = parcel.returned === true;
          if (delivered && !cancelled) {
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

    return Array.from(groupsMap.values())
      .filter((g) => g.deliveredParcels.length > 0)
      .sort((a, b) => a.riderName.localeCompare(b.riderName));
  }, [rawAssignments]);

  const totalAmount = useMemo(
    () => riderGroups.reduce((sum, g) => sum + g.totalDeliveredAmount, 0),
    [riderGroups]
  );
  const totalParcels = useMemo(
    () => riderGroups.reduce((sum, g) => sum + g.totalDeliveredCount, 0),
    [riderGroups]
  );

  const handleToggleRiderExpansion = (riderId: string) => {
    setExpandedRiders((prev) => {
      const next = new Set(prev);
      if (next.has(riderId)) next.delete(riderId);
      else next.add(riderId);
      return next;
    });
  };

  const selectedOfficeName =
    stations.find((s) => s.id === selectedOfficeId)?.name || "Select office";

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          {/* Header */}
       

          {/* Filters */}
          <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Office
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={selectedOfficeId}
                      onChange={(e) => setSelectedOfficeId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea690c] text-sm bg-white"
                    >
                      <option value="">Select office</option>
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        d.setHours(0, 0, 0, 0);
                        setSelectedDate(d);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea690c] text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => setSelectedDate(new Date())}
                    variant="outline"
                    className="border border-gray-300 text-neutral-800 hover:bg-gray-50"
                  >
                    Today
                  </Button>
                  <Button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() - 1);
                      setSelectedDate(d);
                    }}
                    variant="outline"
                    className="border border-gray-300 text-neutral-800 hover:bg-gray-50"
                  >
                    Previous Day
                  </Button>
                  <Button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() + 1);
                      if (d <= new Date()) setSelectedDate(d);
                    }}
                    variant="outline"
                    className="border border-gray-300 text-neutral-800 hover:bg-gray-50"
                    disabled={
                      new Date(selectedDate).setHours(23, 59, 59, 999) >=
                      new Date().getTime()
                    }
                  >
                    Next Day
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Office:{" "}
                <span className="font-semibold text-neutral-800">
                  {selectedOfficeName}
                </span>
                {" • "}
                Date:{" "}
                <span className="font-semibold text-neutral-800">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {riderGroups.length > 0 && (
            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Total Riders</p>
                    <p className="text-base font-bold text-[#ea690c]">
                      {riderGroups.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">
                      Delivered Parcels
                    </p>
                    <p className="text-base font-bold text-blue-600">
                      {totalParcels}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Total Amount</p>
                    <p className="text-base font-bold text-green-600">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments Table (same layout as Manager Reconciliation) */}
          <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                  <p className="text-neutral-700 font-semibold text-lg">
                    Loading reconciliations...
                  </p>
                </div>
              ) : !selectedOfficeId ? (
                <div className="text-center py-12">
                  <p className="text-neutral-800 font-semibold text-lg mb-2">
                    Select an office
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose an office to view reconciliation data.
                  </p>
                </div>
              ) : riderGroups.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-neutral-800 font-semibold text-lg mb-2">
                    No reconciliation data found
                  </p>
                  <p className="text-sm text-gray-500">
                    No delivered assignments found for the selected office and
                    date.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          Rider
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          Delivered Parcels
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          Stats
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {riderGroups.map((group, groupIndex) => {
                        const isExpanded = expandedRiders.has(group.riderId);
                        return (
                          <React.Fragment key={group.riderId}>
                            <tr
                              key={group.riderId}
                              className={`hover:bg-gray-50 transition-colors ${
                                groupIndex !== riderGroups.length - 1
                                  ? "border-b border-gray-200"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-4 border-r border-gray-100">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleToggleRiderExpansion(group.riderId)
                                    }
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
                                          {formatPhoneNumber(
                                            group.riderPhoneNumber
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-semibold text-blue-600">
                                  {group.totalDeliveredCount} /{" "}
                                  {group.totalParcelsCount}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Delivered / Total
                                </div>
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
                            {isExpanded && (
                              <tr>
                                <td colSpan={4} className="px-0 py-0">
                                  <div className="bg-gray-50 border-t border-gray-200">
                                    <table className="w-full">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Recipient
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Phone
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Location
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Amount
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Payment
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.deliveredParcels.map(
                                          (parcel, parcelIndex) => (
                                            <tr
                                              key={parcel.parcelId}
                                              className={
                                                parcelIndex !==
                                                group.deliveredParcels.length - 1
                                                  ? "border-b border-gray-200"
                                                  : ""
                                              }
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
                                                    {formatPhoneNumber(
                                                      parcel.receiverPhoneNumber
                                                    )}
                                                  </a>
                                                ) : (
                                                  <span className="text-sm text-gray-400">
                                                    N/A
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="text-sm text-neutral-700">
                                                  {parcel.receiverAddress ? (
                                                    <div className="flex items-start gap-1">
                                                      <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                      <span
                                                        className="truncate max-w-[200px]"
                                                        title={
                                                          parcel.receiverAddress
                                                        }
                                                      >
                                                        {
                                                          parcel.receiverAddress
                                                        }
                                                      </span>
                                                    </div>
                                                  ) : (
                                                    <span className="text-gray-400">
                                                      N/A
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-bold text-[#ea690c]">
                                                  {formatCurrency(
                                                    parcel.parcelAmount
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge
                                                  className={`${
                                                    parcel.paymentMethod ===
                                                    "cash"
                                                      ? "bg-green-100 text-green-800"
                                                      : parcel.paymentMethod ===
                                                        "momo"
                                                      ? "bg-purple-100 text-purple-800"
                                                      : "bg-gray-100 text-gray-800"
                                                  } border text-xs`}
                                                >
                                                  {parcel.paymentMethod || "N/A"}
                                                </Badge>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                {parcel.receiverPhoneNumber && (
                                                  <Button
                                                    onClick={() =>
                                                      (window.location.href = `tel:${parcel.receiverPhoneNumber}`)
                                                    }
                                                    variant="outline"
                                                    className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2.5 py-1.5"
                                                    title={`Call ${parcel.receiverName || "recipient"}`}
                                                  >
                                                    <Phone className="w-3.5 h-3.5" />
                                                  </Button>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
