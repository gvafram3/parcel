import { useState, useEffect, useMemo } from "react";
import {
  PackageIcon,
  CameraIcon,
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
import frontdeskService, { DeliveryAssignmentResponse, ParcelResponse, RiderResponse } from "../../services/frontdeskService";
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
}

interface RiderWithAssignments {
  rider: RiderResponse;
  assignments: DeliveryItem[];
  totalParcels: number;
  activeDeliveries: number;
  pendingPickups: number;
  completedDeliveries: number;
}

const mapAssignmentStatusToUI = (status: AssignmentStatus): UIStatus => {
  switch (status) {
    case "ASSIGNED":
    case "ACCEPTED":
      return "assigned";
    case "PICKED_UP":
      return "picked-up";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "delivery-failed";
    default:
      return "assigned";
  }
};


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
  const [amountCollected, setAmountCollected] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());

  // Get rider ID - if user is a rider, use their id
  const riderId = userRole === "RIDER" ? currentUser?.id : undefined;

  // Fetch riders and their assignments
  useEffect(() => {
    const fetchRidersAndAssignments = async () => {
      setLoading(true);
      try {
        if (userRole === "RIDER" && riderId) {
          // For riders: fetch only their assignments
          const response = await frontdeskService.getRiderAssignments(riderId, false);

          if (response.success && response.data) {
            const assignments = response.data as DeliveryAssignmentResponse[];
            const deliveryItems: DeliveryItem[] = assignments
              .filter(assignment => assignment.status !== "DELIVERED" && assignment.status !== "CANCELLED") // Only show active assignments, exclude delivered and failed
              .map(assignment => ({
                assignmentId: assignment.assignmentId,
                parcelId: assignment.parcel.parcelId,
                parcel: assignment.parcel,
                status: assignment.status,
                assignedAt: assignment.assignedAt,
                acceptedAt: assignment.acceptedAt,
                completedAt: assignment.completedAt,
                riderName: assignment.riderName,
              }));

            // Create a single rider entry for the current rider
            const riderData: RiderWithAssignments = {
              rider: {
                userId: riderId,
                name: currentUser?.name || "You",
                phoneNumber: (currentUser as any)?.phone || "",
                email: currentUser?.email,
                role: "RIDER",
                status: "ACTIVE",
              } as RiderResponse,
              assignments: deliveryItems,
              totalParcels: deliveryItems.length,
              activeDeliveries: deliveryItems.filter(d => {
                const uiStatus = mapAssignmentStatusToUI(d.status);
                return uiStatus === "picked-up" || uiStatus === "out-for-delivery";
              }).length,
              pendingPickups: deliveryItems.filter(d => {
                const uiStatus = mapAssignmentStatusToUI(d.status);
                return uiStatus === "assigned";
              }).length,
              completedDeliveries: deliveryItems.filter(d => {
                const uiStatus = mapAssignmentStatusToUI(d.status);
                return uiStatus === "delivered";
              }).length,
            };
            setRidersWithAssignments([riderData]);
            setExpandedRiders(new Set([riderId]));
          } else {
            showToast(response.message || "Failed to load deliveries", "error");
          }
        } else if (userRole === "MANAGER" || userRole === "ADMIN" || userRole === "FRONTDESK") {
          // For managers/admins: fetch all riders and their assignments
          const ridersResponse = await frontdeskService.getRiders();

          if (!ridersResponse.success || !ridersResponse.data) {
            showToast(ridersResponse.message || "Failed to load riders", "error");
            setLoading(false);
            return;
          }

          const riders = ridersResponse.data as RiderResponse[];
          const ridersData: RiderWithAssignments[] = [];

          // Fetch assignments for each rider
          for (const rider of riders) {
            try {
              const assignmentsResponse = await frontdeskService.getRiderAssignments(rider.userId, false);

              if (assignmentsResponse.success && assignmentsResponse.data) {
                const assignments = assignmentsResponse.data as DeliveryAssignmentResponse[];
                const deliveryItems: DeliveryItem[] = assignments
                  .filter(assignment => assignment.status !== "DELIVERED" && assignment.status !== "CANCELLED") // Only show active assignments, exclude delivered and failed
                  .map(assignment => ({
                    assignmentId: assignment.assignmentId,
                    parcelId: assignment.parcel.parcelId,
                    parcel: assignment.parcel,
                    status: assignment.status,
                    assignedAt: assignment.assignedAt,
                    acceptedAt: assignment.acceptedAt,
                    completedAt: assignment.completedAt,
                    riderName: assignment.riderName,
                  }));

                if (deliveryItems.length > 0) {
                  ridersData.push({
                    rider,
                    assignments: deliveryItems,
                    totalParcels: deliveryItems.length,
                    activeDeliveries: deliveryItems.filter(d => {
                      const uiStatus = mapAssignmentStatusToUI(d.status);
                      return uiStatus === "picked-up" || uiStatus === "out-for-delivery";
                    }).length,
                    pendingPickups: deliveryItems.filter(d => {
                      const uiStatus = mapAssignmentStatusToUI(d.status);
                      return uiStatus === "assigned";
                    }).length,
                    completedDeliveries: deliveryItems.filter(d => {
                      const uiStatus = mapAssignmentStatusToUI(d.status);
                      return uiStatus === "delivered";
                    }).length,
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to fetch assignments for rider ${rider.userId}:`, error);
            }
          }

          setRidersWithAssignments(ridersData);
          // Expand all riders by default
          setExpandedRiders(new Set(ridersData.map(r => r.rider.userId)));
        }
      } catch (error) {
        console.error("Failed to fetch riders and assignments:", error);
        showToast("Failed to load deliveries. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRidersAndAssignments();
  }, [userRole, riderId, currentUser, showToast]);

  // Flatten all deliveries for statistics
  const allDeliveries = useMemo(() => {
    return ridersWithAssignments.flatMap(riderData => riderData.assignments);
  }, [ridersWithAssignments]);

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

        const uiStatus = mapAssignmentStatusToUI(delivery.status);
        const matchesStatus = statusFilter === "all" || uiStatus === statusFilter;

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

  const fetchRidersAndAssignments = async () => {
    setLoading(true);
    try {
      if (userRole === "RIDER" && riderId) {
        const response = await frontdeskService.getRiderAssignments(riderId, false);

        if (response.success && response.data) {
          const assignments = response.data as DeliveryAssignmentResponse[];
          const deliveryItems: DeliveryItem[] = assignments
            .filter(assignment => assignment.status !== "DELIVERED" && assignment.status !== "CANCELLED") // Only show active assignments, exclude delivered and failed
            .map(assignment => ({
              assignmentId: assignment.assignmentId,
              parcelId: assignment.parcel.parcelId,
              parcel: assignment.parcel,
              status: assignment.status,
              assignedAt: assignment.assignedAt,
              acceptedAt: assignment.acceptedAt,
              completedAt: assignment.completedAt,
              riderName: assignment.riderName,
            }));

          const riderData: RiderWithAssignments = {
            rider: {
              userId: riderId,
              name: currentUser?.name || "You",
              phoneNumber: (currentUser as any)?.phone || "",
              email: currentUser?.email,
              role: "RIDER",
              status: "ACTIVE",
            } as RiderResponse,
            assignments: deliveryItems,
            totalParcels: deliveryItems.length,
            activeDeliveries: deliveryItems.filter(d => {
              const uiStatus = mapAssignmentStatusToUI(d.status);
              return uiStatus === "picked-up" || uiStatus === "out-for-delivery";
            }).length,
            pendingPickups: deliveryItems.filter(d => {
              const uiStatus = mapAssignmentStatusToUI(d.status);
              return uiStatus === "assigned";
            }).length,
            completedDeliveries: deliveryItems.filter(d => {
              const uiStatus = mapAssignmentStatusToUI(d.status);
              return uiStatus === "delivered";
            }).length,
          };
          setRidersWithAssignments([riderData]);
        }
      } else if (userRole === "MANAGER" || userRole === "ADMIN" || userRole === "FRONTDESK") {
        const ridersResponse = await frontdeskService.getRiders();

        if (!ridersResponse.success || !ridersResponse.data) {
          return;
        }

        const riders = ridersResponse.data as RiderResponse[];
        const ridersData: RiderWithAssignments[] = [];

        for (const rider of riders) {
          try {
            const assignmentsResponse = await frontdeskService.getRiderAssignments(rider.userId, false);

            if (assignmentsResponse.success && assignmentsResponse.data) {
              const assignments = assignmentsResponse.data as DeliveryAssignmentResponse[];
              const deliveryItems: DeliveryItem[] = assignments
                .filter(assignment => assignment.status !== "DELIVERED" && assignment.status !== "CANCELLED") // Only show active assignments, exclude delivered and failed
                .map(assignment => ({
                  assignmentId: assignment.assignmentId,
                  parcelId: assignment.parcel.parcelId,
                  parcel: assignment.parcel,
                  status: assignment.status,
                  assignedAt: assignment.assignedAt,
                  acceptedAt: assignment.acceptedAt,
                  completedAt: assignment.completedAt,
                  riderName: assignment.riderName,
                }));

              if (deliveryItems.length > 0) {
                ridersData.push({
                  rider,
                  assignments: deliveryItems,
                  totalParcels: deliveryItems.length,
                  activeDeliveries: deliveryItems.filter(d => {
                    const uiStatus = mapAssignmentStatusToUI(d.status);
                    return uiStatus === "picked-up" || uiStatus === "out-for-delivery";
                  }).length,
                  pendingPickups: deliveryItems.filter(d => {
                    const uiStatus = mapAssignmentStatusToUI(d.status);
                    return uiStatus === "assigned";
                  }).length,
                  completedDeliveries: deliveryItems.filter(d => {
                    const uiStatus = mapAssignmentStatusToUI(d.status);
                    return uiStatus === "delivered";
                  }).length,
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch assignments for rider ${rider.userId}:`, error);
          }
        }

        setRidersWithAssignments(ridersData);
      }
    } catch (error) {
      console.error("Failed to fetch riders and assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, parcelId: string, newUIStatus: UIStatus, riderUserId: string) => {
    if (!currentUser) return;

    if (newUIStatus === "delivered") {
      const riderData = ridersWithAssignments.find(r => r.rider.userId === riderUserId);
      const delivery = riderData?.assignments.find((d) => d.assignmentId === assignmentId);
      setSelectedDelivery(delivery || null);
      setShowDeliveryModal(true);
      return;
    } else if (newUIStatus === "delivery-failed") {
      const riderData = ridersWithAssignments.find(r => r.rider.userId === riderUserId);
      const delivery = riderData?.assignments.find((d) => d.assignmentId === assignmentId);
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
        showToast("Status updated successfully", "success");
        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
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
    if (!selectedDelivery || !currentUser || !amountCollected) return;

    setUpdatingStatus(selectedDelivery.assignmentId);
    try {
      const collected = parseFloat(amountCollected);
      const parcel = selectedDelivery.parcel;

      const totalAmount =
        (parcel.deliveryCost || 0) +
        (parcel.pickUpCost || 0) +
        (parcel.inboundCost || 0) +
        (parcel.storageCost || 0);

      // Manager marks assignment as delivered via rider API
      const response = await riderService.updateManagerAssignmentStatus(
        selectedDelivery.assignmentId,
        "DELIVERED"
      );

      if (response.success) {
        showToast(
          `Delivery completed! Collected GHC ${collected.toFixed(2)}${collected !== totalAmount ? ` (Expected: GHC ${totalAmount.toFixed(2)})` : ''}`,
          "success"
        );

        setShowDeliveryModal(false);
        setSelectedDelivery(null);
        setAmountCollected("");

        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
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

    setUpdatingStatus(selectedDelivery.assignmentId);
    try {
      // Update parcel - mark as not delivered, but we can add failure reason in parcelDescription or create a note
      const response = await frontdeskService.updateParcel(selectedDelivery.parcelId, {
        delivered: false,
        parcelDescription: `${selectedDelivery.parcel.parcelDescription || ''}\n[FAILED: ${failureReason}]`.trim(),
      });

      if (response.success) {
        showToast("Delivery failure recorded", "success");

        setShowFailedModal(false);
        setSelectedDelivery(null);
        setFailureReason("");

        // Refresh all riders and assignments
        await fetchRidersAndAssignments();
      } else {
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
  const pendingCount = allDeliveries.filter((d) => {
    const uiStatus = mapAssignmentStatusToUI(d.status);
    return uiStatus === "assigned";
  }).length;
  const totalDeliveryFee = allDeliveries
    .filter((d) => {
      const uiStatus = mapAssignmentStatusToUI(d.status);
      return uiStatus !== "delivered" && uiStatus !== "delivery-failed";
    })
    .reduce((sum, d) => {
      return sum + (d.parcel.deliveryCost || 0);
    }, 0);
  const totalPickupCost = allDeliveries
    .filter((d) => {
      const uiStatus = mapAssignmentStatusToUI(d.status);
      return uiStatus !== "delivered" && uiStatus !== "delivery-failed";
    })
    .reduce((sum, d) => {
      return sum + (d.parcel.pickUpCost || 0);
    }, 0);
  const expectedCollections = allDeliveries
    .filter((d) => {
      const uiStatus = mapAssignmentStatusToUI(d.status);
      return uiStatus !== "delivered" && uiStatus !== "delivery-failed";
    })
    .reduce((sum, d) => {
      const parcel = d.parcel;
      return sum + (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
        (parcel.inboundCost || 0) + (parcel.storageCost || 0);
    }, 0);

  const getStatusBadge = (status: AssignmentStatus) => {
    const uiStatus = mapAssignmentStatusToUI(status);
    const statusConfig: Record<UIStatus, { label: string; color: string }> = {
      "assigned": { label: "Assigned", color: "bg-blue-100 text-blue-800" },
      "picked-up": { label: "Picked Up", color: "bg-indigo-100 text-indigo-800" },
      "out-for-delivery": { label: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
      "delivered": { label: "Delivered", color: "bg-green-100 text-green-800" },
      "delivery-failed": { label: "Failed", color: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[uiStatus] || { label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getNextStatusAction = (delivery: DeliveryItem) => {
    const uiStatus = mapAssignmentStatusToUI(delivery.status);
    switch (uiStatus) {
      case "assigned":
        return { label: "Mark Picked Up", status: "picked-up" as UIStatus, color: "bg-blue-600" };
      case "picked-up":
        return { label: "Out for Delivery", status: "out-for-delivery" as UIStatus, color: "bg-indigo-600" };
      case "out-for-delivery":
        return { label: "Mark Delivered", status: "delivered" as UIStatus, color: "bg-green-600" };
      default:
        return null;
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

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
                              const uiStatus = mapAssignmentStatusToUI(delivery.status);

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
                                          {getStatusBadge(delivery.status)}
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

                                        {/* Show Mark Delivered and Mark Failed for assigned, picked-up, and out-for-delivery statuses */}
                                        {(uiStatus === "assigned" || uiStatus === "picked-up" || uiStatus === "out-for-delivery") && (
                                          <div className="flex flex-col gap-2 w-full">
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
                                          </div>
                                        )}

                                        {uiStatus === "delivered" && (
                                          <Badge className="bg-green-100 text-green-800">
                                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                                            Delivered
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
                    setAmountCollected("");
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
                    Amount Collected (GHC) <span className="text-[#e22420]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={amountCollected}
                    onChange={(e) => setAmountCollected(e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowDeliveryModal(false);
                      setSelectedDelivery(null);
                      setAmountCollected("");
                    }}
                    variant="outline"
                    className="flex-1 border border-[#d1d1d1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeliveryComplete}
                    disabled={!amountCollected || updatingStatus === selectedDelivery.assignmentId}
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
