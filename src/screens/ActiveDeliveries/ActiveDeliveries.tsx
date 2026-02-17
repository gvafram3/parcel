import { useState, useEffect, useMemo } from "react";
import {
  PackageIcon,
  SearchIcon,
  XIcon,
  FilterIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";
import { formatPhoneNumber, formatDateTime, formatCurrency } from "../../utils/dataHelpers";
import frontdeskService, { ParcelResponse, RiderResponse } from "../../services/frontdeskService";
import riderService from "../../services/riderService";
import { useToast } from "../../components/ui/toast";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

// Map API assignment statuses to UI statuses
type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";
type UIStatus = "assigned" | "picked-up" | "out-for-delivery" | "delivered" | "delivery-failed";

interface DeliveryItem {
  assignmentId: string;
  parcelId: string;
  parcel: ParcelResponse;
  status: AssignmentStatus;
  assignedAt?: number;
  acceptedAt?: number;
  completedAt?: number;
  riderName?: string;
  delivered?: boolean;
  cancelled?: boolean;
}

interface RiderWithAssignments {
  rider: RiderResponse;
  assignments: DeliveryItem[];
  totalParcels: number;
  activeDeliveries: number;
  pendingPickups: number;
  completedDeliveries: number;
}

// No longer using assignment status mapping - using parcel delivery status instead


export const ActiveDeliveries = (): JSX.Element => {
  const { currentUser, userRole } = useStation();
  const { showToast } = useToast();
  const [ridersWithAssignments, setRidersWithAssignments] = useState<RiderWithAssignments[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UIStatus | "all">("all");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());

  // Get rider ID - if user is a rider, use their id
  const riderId = userRole === "RIDER" ? currentUser?.id : undefined;

  // Fetch riders and their assignments using getParcelAssignments
  const fetchRidersAndAssignments = async () => {
    setLoading(true);
    try {
      console.log("[ActiveDeliveries] Fetching parcel assignments...");
      // Use the same endpoint as Reconciliation page
      const response = await frontdeskService.getParcelAssignments(0, 200);

      if (response.success && response.data) {
        console.log(
          "[ActiveDeliveries] Raw assignments response:",
          response.data
        );
        const rawAssignments = response.data.content || [];

        // Group assignments by rider and filter active parcels
        const ridersMap = new Map<string, {
          rider: RiderResponse;
          assignments: DeliveryItem[];
        }>();

        rawAssignments.forEach((assignment: any) => {
          const assignmentRiderId = assignment.riderInfo?.riderId || assignment.riderId || 'unknown';
          const riderName = assignment.riderInfo?.riderName || assignment.riderName || 'Unknown Rider';
          const riderPhoneNumber = assignment.riderInfo?.riderPhoneNumber || assignment.riderPhoneNumber;

          // Process parcels array
          if (assignment.parcels && Array.isArray(assignment.parcels)) {
            assignment.parcels.forEach((parcel: any) => {
              // Only include parcels where delivered === false AND returned === false
              if (parcel.delivered === false && parcel.returned === false) {
                // Initialize rider if not exists
                if (!ridersMap.has(assignmentRiderId)) {
                  ridersMap.set(assignmentRiderId, {
                    rider: {
                      userId: assignmentRiderId,
                      name: riderName,
                      phoneNumber: riderPhoneNumber,
                      role: "RIDER",
                      status: "ACTIVE",
                    } as RiderResponse,
                    assignments: [],
                  });
                }

                const riderData = ridersMap.get(assignmentRiderId)!;

                // Map parcel to ParcelResponse format
                const mappedParcel: ParcelResponse = {
                  parcelId: parcel.parcelId,
                  receiverName: parcel.receiverName,
                  recieverPhoneNumber: parcel.receiverPhoneNumber,
                  receiverAddress: parcel.receiverAddress,
                  parcelDescription: parcel.parcelDescription,
                  deliveryCost: parcel.parcelAmount || 0,
                  pickUpCost: 0,
                  inboundCost: 0,
                  storageCost: 0,
                  senderName: parcel.senderName,
                  senderPhoneNumber: parcel.senderPhoneNumber,
                };

                // Create delivery item
                const deliveryItem: DeliveryItem = {
                  assignmentId: assignment.assignmentId,
                  parcelId: parcel.parcelId,
                  parcel: mappedParcel,
                  status: assignment.status as AssignmentStatus,
                  assignedAt: assignment.assignedAt,
                  acceptedAt: assignment.acceptedAt,
                  completedAt: assignment.completedAt,
                  riderName: riderName,
                  delivered: parcel.delivered,
                  cancelled: parcel.cancelled,
                };

                riderData.assignments.push(deliveryItem);
              }
            });
          }
        });

        // Convert map to array and filter based on user role
        let ridersData: RiderWithAssignments[] = Array.from(ridersMap.values()).map(riderData => ({
          rider: riderData.rider,
          assignments: riderData.assignments,
          totalParcels: riderData.assignments.length,
          // All parcels in this view are active (not delivered and not cancelled)
          activeDeliveries: riderData.assignments.length,
          pendingPickups: riderData.assignments.length,
          completedDeliveries: 0,
        }));

        // Filter by rider if user is a rider
        if (userRole === "RIDER" && riderId) {
          ridersData = ridersData.filter(r => r.rider.userId === riderId);
          if (ridersData.length > 0) {
            setExpandedRiders(new Set([riderId]));
          }
        } else {
          // Expand all riders by default for managers/admins
          setExpandedRiders(new Set(ridersData.map(r => r.rider.userId)));
        }

        setRidersWithAssignments(ridersData);
      } else {
        console.warn(
          "[ActiveDeliveries] Failed to load deliveries:",
          response.message
        );
        showToast(response.message || "Failed to load deliveries", "error");
      }
    } catch (error) {
      console.error("Failed to fetch riders and assignments:", error);
      showToast("Failed to load deliveries. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "[ActiveDeliveries] useEffect: fetching riders and assignments",
      { userRole, riderId, currentUser }
    );
    fetchRidersAndAssignments();
  }, [userRole, riderId, currentUser, showToast]);

  // Flatten all deliveries for potential future use
  // const allDeliveries = useMemo(() => {
  //   return ridersWithAssignments.flatMap(riderData => riderData.assignments);
  // }, [ridersWithAssignments]);

  // Filter riders and their assignments
  const filteredRidersWithAssignments = useMemo(() => {
    return ridersWithAssignments.map(riderData => {
      const filteredAssignments = riderData.assignments.filter((delivery) => {
        const matchesSearch =
          !searchQuery ||
          delivery.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.parcel.receiverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.parcel.recieverPhoneNumber?.includes(searchQuery) ||
          riderData.rider.name?.toLowerCase().includes(searchQuery.toLowerCase());

        // For status filtering, since all parcels are active (not delivered, not cancelled),
        // we only match "assigned" status filter or "all"
        const matchesStatus = statusFilter === "all" || statusFilter === "assigned";

        return matchesSearch && matchesStatus;
      });

      return {
        ...riderData,
        assignments: filteredAssignments,
      };
    }).filter(riderData => riderData.assignments.length > 0);
  }, [ridersWithAssignments, searchQuery, statusFilter]);

  const toggleRiderExpansion = (riderUserId: string) => {
    const newExpanded = new Set(expandedRiders);
    if (newExpanded.has(riderUserId)) {
      newExpanded.delete(riderUserId);
    } else {
      newExpanded.add(riderUserId);
    }
    setExpandedRiders(newExpanded);
  };

  // This function is now handled in useEffect above

  const handleStatusUpdate = async (assignmentId: string, parcelId: string, newUIStatus: UIStatus, riderUserId: string) => {
    if (!currentUser) return;

    if (newUIStatus === "delivered") {
      console.log(
        "[ActiveDeliveries] Mark delivered clicked",
        assignmentId,
        parcelId
      );
      const riderData = ridersWithAssignments.find(r => r.rider.userId === riderUserId);
      // Find delivery by parcelId to get the correct parcel
      const delivery = riderData?.assignments.find((d) => d.parcelId === parcelId);
      setSelectedDelivery(delivery || null);
      setPaymentMethod("");
      setShowDeliveryModal(true);
      return;
    } else if (newUIStatus === "delivery-failed") {
      console.log(
        "[ActiveDeliveries] Mark delivery failed clicked",
        assignmentId,
        parcelId
      );
      const riderData = ridersWithAssignments.find(r => r.rider.userId === riderUserId);
      // Find delivery by parcelId to get the correct parcel
      const delivery = riderData?.assignments.find((d) => d.parcelId === parcelId);
      setSelectedDelivery(delivery || null);
      setShowFailedModal(true);
      return;
    }

    setUpdatingStatus(assignmentId);
    try {
      // Update parcel status via API
      const updateData: any = {};
      if (newUIStatus === "picked-up") {
        // When marking as picked up, we update the parcel
        updateData.parcelAssigned = true;
      } else if (newUIStatus === "out-for-delivery") {
        // Out for delivery - parcel is still assigned
        updateData.parcelAssigned = true;
      }

      const response = await frontdeskService.updateParcel(parcelId, updateData);

      if (response.success) {
        console.log(
          "[ActiveDeliveries] Parcel status updated successfully",
          { parcelId, updateData }
        );
        showToast("Status updated successfully", "success");
        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
        console.warn(
          "[ActiveDeliveries] Failed to update status",
          response.message
        );
        showToast(response.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast("Failed to update status. Please try again.", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeliveryComplete = async () => {
    if (!selectedDelivery || !currentUser || !paymentMethod) return;

    console.log("[ActiveDeliveries] Completing delivery", {
      assignmentId: selectedDelivery.assignmentId,
      parcelId: selectedDelivery.parcelId,
      paymentMethod,
    });

    setUpdatingStatus(selectedDelivery.assignmentId);
    try {
      // Manager marks parcel as delivered via rider API with payment method
      const response = await riderService.updateAssignmentStatus(
        selectedDelivery.assignmentId,
        "DELIVERED",
        undefined, // confirmationCode is optional
        undefined, // reason
        paymentMethod,
        selectedDelivery.parcelId
      );

      if (response.success) {
        console.log("[ActiveDeliveries] Delivery completed response:", response);
        showToast(
          `Delivery completed! Payment method: ${paymentMethod}`,
          "success"
        );

        setShowDeliveryModal(false);
        setSelectedDelivery(null);
        setPaymentMethod("");

        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
        console.warn(
          "[ActiveDeliveries] Failed to complete delivery",
          response.message
        );
        showToast(response.message || "Failed to complete delivery", "error");
      }
    } catch (error) {
      console.error("Failed to complete delivery:", error);
      showToast("Failed to complete delivery. Please try again.", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeliveryFailed = async () => {
    if (!selectedDelivery || !currentUser || !failureReason.trim()) return;

    console.log("[ActiveDeliveries] Marking delivery as failed", {
      assignmentId: selectedDelivery.assignmentId,
      parcelId: selectedDelivery.parcelId,
      failureReason,
    });

    setUpdatingStatus(selectedDelivery.assignmentId);
    try {
      // Update parcel - mark as not delivered, but we can add failure reason in parcelDescription or create a note
      const response = await frontdeskService.updateParcel(selectedDelivery.parcelId, {
        delivered: false,
        parcelDescription: `${selectedDelivery.parcel.parcelDescription || ''}\n[FAILED: ${failureReason}]`.trim(),
      });

      if (response.success) {
        console.log("[ActiveDeliveries] Delivery failure recorded:", response);
        showToast("Delivery failure recorded", "success");

        setShowFailedModal(false);
        setSelectedDelivery(null);
        setFailureReason("");

        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
        console.warn(
          "[ActiveDeliveries] Failed to record failure",
          response.message
        );
        showToast(response.message || "Failed to record failure", "error");
      }
    } catch (error) {
      console.error("Failed to record failure:", error);
      showToast("Failed to record failure. Please try again.", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Calculate statistics from all deliveries
  // All parcels in this view are active (not delivered and not cancelled)
  // Stats are calculated but commented out in UI

  const getStatusBadge = (delivered?: boolean, cancelled?: boolean) => {
    // Use parcel delivery status instead of assignment status
    if (cancelled === true) {
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    }
    if (delivered === true) {
      return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
    }
    // Default to "Assigned" for active parcels (not delivered and not cancelled)
    return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
  };

  const getNextStatusAction = (delivery: DeliveryItem) => {
    // Use parcel delivery status instead of assignment status
    // For active deliveries page, all parcels shown are not delivered and not cancelled
    // So we just show "Mark Delivered" action
    if (delivery.delivered === false && delivery.cancelled === false) {
      return { label: "Mark Delivered", status: "delivered" as UIStatus, color: "bg-green-600" };
    }
    return null;
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          {/* Header */}
          {/* <div>
            <h1 className="text-2xl font-bold text-neutral-800">Active Deliveries</h1>
            <p className="text-sm text-[#5d5d5d] mt-1">
              {userRole === "RIDER" ? "Your assigned deliveries" : "All active deliveries"}
            </p>
          </div> */}

          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="[font-family:'Lato',Helvetica] font-bold text-blue-600 text-3xl">
                      {pendingCount}
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                      Pending pickup
                    </span>
                  </div>
                  <PackageIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="[font-family:'Lato',Helvetica] font-bold text-green-600 text-3xl">
                      {formatCurrency(totalDeliveryFee)}
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                      Total Delivery Fee
                    </span>
                  </div>
                  <PackageIcon className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="[font-family:'Lato',Helvetica] font-bold text-purple-600 text-3xl">
                      {formatCurrency(totalPickupCost)}
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                      Total Pickup Cost
                    </span>
                  </div>
                  <PackageIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="[font-family:'Lato',Helvetica] font-bold text-[#ea690c] text-3xl">
                      {formatCurrency(expectedCollections)}
                    </span>
                    <span className="[font-family:'Lato',Helvetica] font-normal text-[#5d5d5d] text-sm mt-1">
                      Expected collections
                    </span>
                  </div>
                  <CameraIcon className="w-8 h-8 text-[#ea690c]" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Search and Filter */}
          <Card className="w-full rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
            <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search by Parcel ID or Recipient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ea690c]" />
              </div>

              <div className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5 text-[#5d5d5d]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as UIStatus | "all")}
                  className="rounded border border-[#d1d1d1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked-up">Picked Up</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Riders and Their Assignments */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                  <p className="text-neutral-700 font-medium">Loading riders and assignments...</p>
                </CardContent>
              </Card>
            ) : filteredRidersWithAssignments.length === 0 ? (
              <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <PackageIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                  <p className="text-neutral-700 font-medium">
                    {userRole === "RIDER" ? "No deliveries assigned" : "No active deliveries"}
                  </p>
                  <p className="text-sm text-[#5d5d5d] mt-2">
                    {userRole === "RIDER"
                      ? "Check back later for new assignments"
                      : "Assign parcels to riders to see active deliveries"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRidersWithAssignments.map((riderData) => {
                const isExpanded = expandedRiders.has(riderData.rider.userId);
                const riderName = riderData.rider.name || riderData.rider.email || "Unknown Rider";

                return (
                  <Card
                    key={riderData.rider.userId}
                    className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm"
                  >
                    <CardContent className="p-0">
                      {/* Rider Header - Clickable to expand/collapse */}
                      <div
                        onClick={() => toggleRiderExpansion(riderData.rider.userId)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-[#d1d1d1]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border border-solid border-[#d1d1d1]">
                              <AvatarImage src="/vector.svg" alt={riderName} />
                              <AvatarFallback>
                                {riderName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base">
                                {riderName}
                              </span>
                              {riderData.rider.phoneNumber && (
                                <span className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs">
                                  {formatPhoneNumber(riderData.rider.phoneNumber)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Rider Statistics */}
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-xs text-[#5d5d5d]">Total</p>
                                <p className="text-lg font-bold text-neutral-800">{riderData.totalParcels}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-[#5d5d5d]">Active</p>
                                <p className="text-lg font-bold text-green-600">{riderData.activeDeliveries}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-[#5d5d5d]">Pending</p>
                                <p className="text-lg font-bold text-blue-600">{riderData.pendingPickups}</p>
                              </div>
                            </div>

                            {/* Expand/Collapse Icon */}
                            <ArrowRightIcon
                              className={`w-5 h-5 text-[#5d5d5d] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rider's Assignments - Expandable */}
                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {riderData.assignments.length === 0 ? (
                            <p className="text-sm text-[#5d5d5d] text-center py-4">
                              No assignments match the current filters
                            </p>
                          ) : (
                            riderData.assignments.map((delivery) => {
                              const nextAction = getNextStatusAction(delivery);
                              const parcel = delivery.parcel;
                              const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                                (parcel.inboundCost || 0) + (parcel.storageCost || 0);

                              return (
                                <Card
                                  key={delivery.assignmentId}
                                  className="rounded-lg border border-[#e5e5e5] bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                      {/* Left Column - Receiver and Address */}
                                      <div className="flex-1 flex flex-col gap-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                                            {parcel.parcelId}
                                          </Badge>
                                          {getStatusBadge(delivery.delivered, delivery.cancelled)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <UserIcon className="w-4 h-4 text-[#5d5d5d]" />
                                          <div className="flex flex-col">
                                            <span className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                                              {parcel.receiverName || "N/A"}
                                            </span>
                                            {parcel.recieverPhoneNumber && (
                                              <a
                                                href={`tel:${parcel.recieverPhoneNumber}`}
                                                className="[font-family:'Lato',Helvetica] font-normal text-[#9a9a9a] text-xs hover:text-[#ea690c]"
                                              >
                                                {formatPhoneNumber(parcel.recieverPhoneNumber)}
                                              </a>
                                            )}
                                          </div>
                                        </div>

                                        {parcel.homeDelivery && parcel.receiverAddress && (
                                          <div className="flex items-center gap-2">
                                            <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                              {parcel.receiverAddress}
                                            </span>
                                          </div>
                                        )}

                                        {!parcel.homeDelivery && (
                                          <div className="flex items-center gap-2">
                                            <MapPinIcon className="w-4 h-4 text-[#5d5d5d]" />
                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                              Shelf: <strong>{parcel.shelfName || parcel.shelfNumber || "N/A"}</strong> (Customer Pickup)
                                            </span>
                                          </div>
                                        )}

                                        {delivery.assignedAt && (
                                          <div className="flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4 text-[#5d5d5d]" />
                                            <span className="[font-family:'Lato',Helvetica] font-normal text-neutral-700 text-sm">
                                              Assigned: {formatDateTime(new Date(delivery.assignedAt).toISOString())}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Middle Column - Amount Breakdown */}
                                      <div className="flex-1 flex flex-col gap-3">
                                        <div className="bg-white rounded-lg p-3 border border-[#e5e5e5]">
                                          <p className="text-xs font-semibold text-[#5d5d5d] mb-2">Amount to Collect</p>
                                          <div className="space-y-1">
                                            {(parcel.inboundCost || 0) > 0 && (
                                              <div className="flex justify-between text-xs">
                                                <span className="text-neutral-700">Item Value:</span>
                                                <span className="font-semibold">GHC {(parcel.inboundCost || 0).toFixed(2)}</span>
                                              </div>
                                            )}
                                            {(parcel.deliveryCost || 0) > 0 && (
                                              <div className="flex justify-between text-xs">
                                                <span className="text-neutral-700">Delivery Fee:</span>
                                                <span className="font-semibold">GHC {(parcel.deliveryCost || 0).toFixed(2)}</span>
                                              </div>
                                            )}
                                            {(parcel.pickUpCost || 0) > 0 && (
                                              <div className="flex justify-between text-xs">
                                                <span className="text-neutral-700">Pickup Cost:</span>
                                                <span className="font-semibold">GHC {(parcel.pickUpCost || 0).toFixed(2)}</span>
                                              </div>
                                            )}
                                            {(parcel.storageCost || 0) > 0 && (
                                              <div className="flex justify-between text-xs">
                                                <span className="text-neutral-700">Storage Cost:</span>
                                                <span className="font-semibold">GHC {(parcel.storageCost || 0).toFixed(2)}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between pt-1 border-t border-[#d1d1d1]">
                                              <span className="text-sm font-bold text-neutral-800">Total:</span>
                                              <span className="text-lg font-bold text-[#ea690c]">
                                                {formatCurrency(totalAmount)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {parcel.parcelDescription && (
                                          <p className="text-xs text-neutral-700">
                                            <strong>Item:</strong> {parcel.parcelDescription}
                                          </p>
                                        )}
                                      </div>

                                      {/* Right Column - Actions */}
                                      <div className="flex flex-col items-end gap-3">
                                        {nextAction && (
                                          <Button
                                            onClick={() => handleStatusUpdate(delivery.assignmentId, delivery.parcelId, nextAction.status, riderData.rider.userId)}
                                            disabled={updatingStatus === delivery.assignmentId}
                                            className={`${nextAction.color} text-white hover:opacity-90 disabled:opacity-50`}
                                          >
                                            {updatingStatus === delivery.assignmentId ? (
                                              <>
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Updating...
                                              </>
                                            ) : (
                                              <>
                                                {nextAction.label}
                                                <ArrowRightIcon className="w-4 h-4 ml-2" />
                                              </>
                                            )}
                                          </Button>
                                        )}

                                        {/* Show Mark Delivered and Mark Failed for all active deliveries */}
                                        {/* <div className="flex flex-col gap-2 w-full">
                                          <Button
                                            onClick={() => handleStatusUpdate(delivery.assignmentId, delivery.parcelId, "delivered", riderData.rider.userId)}
                                            disabled={updatingStatus === delivery.assignmentId}
                                            className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 w-full"
                                          >
                                            {updatingStatus === delivery.assignmentId ? (
                                              <>
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Processing...
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                Mark Delivered
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            onClick={() => handleStatusUpdate(delivery.assignmentId, delivery.parcelId, "delivery-failed", riderData.rider.userId)}
                                            disabled={updatingStatus === delivery.assignmentId}
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                                          >
                                            <XCircleIcon className="w-4 h-4 mr-2" />
                                            Mark Failed
                                          </Button>
                                        </div> */}

                                        {delivery.delivered && (
                                          <Badge className="bg-green-100 text-green-800">
                                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                                            Delivered
                                          </Badge>
                                        )}

                                        {delivery.cancelled && (
                                          <Badge className="bg-red-100 text-red-800">
                                            <XCircleIcon className="w-3 h-3 mr-1" />
                                            Failed
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Delivery Confirmation Modal */}
      {showDeliveryModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-800">Confirm Delivery</h3>
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setSelectedDelivery(null);
                    setPaymentMethod("");
                  }}
                  className="text-[#9a9a9a] hover:text-neutral-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                  <p className="font-semibold text-neutral-800">{selectedDelivery.parcel.receiverName || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-[#5d5d5d] mb-1">Parcel ID</p>
                  <p className="font-semibold text-neutral-800">{selectedDelivery.parcelId}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-[#5d5d5d] mb-2">Expected Amount</p>
                  <p className="text-2xl font-bold text-[#ea690c]">
                    {formatCurrency(
                      (selectedDelivery.parcel.deliveryCost || 0) + (selectedDelivery.parcel.pickUpCost || 0) +
                      (selectedDelivery.parcel.inboundCost || 0) + (selectedDelivery.parcel.storageCost || 0)
                    )}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-neutral-800 mb-2">
                    Payment Method <span className="text-[#e22420]">*</span>
                  </Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money (MoMo)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowDeliveryModal(false);
                      setSelectedDelivery(null);
                      setPaymentMethod("");
                    }}
                    variant="outline"
                    className="flex-1 border border-[#d1d1d1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeliveryComplete}
                    disabled={!paymentMethod || updatingStatus === selectedDelivery.assignmentId}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {updatingStatus === selectedDelivery.assignmentId ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Confirm Delivery
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Failed Modal */}
      {showFailedModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-800">Delivery Failed</h3>
                <button
                  onClick={() => {
                    setShowFailedModal(false);
                    setSelectedDelivery(null);
                    setFailureReason("");
                  }}
                  className="text-[#9a9a9a] hover:text-neutral-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                  <p className="font-semibold text-neutral-800">{selectedDelivery.parcel.receiverName || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-[#5d5d5d] mb-1">Parcel ID</p>
                  <p className="font-semibold text-neutral-800">{selectedDelivery.parcelId}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-neutral-800 mb-2">
                    Failure Reason <span className="text-[#e22420]">*</span>
                  </Label>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Enter reason for delivery failure..."
                    className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowFailedModal(false);
                      setSelectedDelivery(null);
                      setFailureReason("");
                    }}
                    variant="outline"
                    className="flex-1 border border-[#d1d1d1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeliveryFailed}
                    disabled={!failureReason.trim() || updatingStatus === selectedDelivery.assignmentId}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {updatingStatus === selectedDelivery.assignmentId ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Mark as Failed
                      </>
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
