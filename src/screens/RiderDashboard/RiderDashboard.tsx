import { useState, useEffect, useMemo, useCallback } from "react";
import {
    PackageIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightIcon,
    Loader,
    UserIcon,
    TruckIcon,
    AlertCircleIcon,
    XIcon,
    Phone,
    DollarSignIcon,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { formatPhoneNumber, formatDateTime, formatCurrency } from "../../utils/dataHelpers";
import riderService, { RiderAssignmentResponse, AssignmentStatus, RiderParcelResponse } from "../../services/riderService";
import { useToast } from "../../components/ui/toast";
import { generateAssignmentsPDF } from "../../utils/pdfGenerator";
import { useStation } from "../../contexts/StationContext";
import { Download } from "lucide-react";

type UIStatus = "assigned" | "accepted" | "picked-up" | "out-for-delivery" | "delivered" | "delivery-failed";

const mapAssignmentStatusToUI = (status: AssignmentStatus): UIStatus => {
    switch (status) {
        case "ASSIGNED":
            return "assigned";
        case "ACCEPTED":
            return "accepted";
        case "PICKED_UP":
            return "picked-up";
        case "DELIVERED":
            return "delivered";
        case "RETURNED":
            return "delivery-failed";
        default:
            return "assigned";
    }
};

const mapUIToAssignmentStatus = (uiStatus: UIStatus): AssignmentStatus => {
    switch (uiStatus) {
        case "assigned":
            return "ASSIGNED";
        case "accepted":
            return "ACCEPTED";
        case "picked-up":
            return "PICKED_UP";
        case "out-for-delivery":
            return "PICKED_UP";
        case "delivered":
            return "DELIVERED";
        case "delivery-failed":
            return "RETURNED";
        default:
            return "ASSIGNED";
    }
};

export const RiderDashboard = (): JSX.Element => {
    const { showToast } = useToast();
    const { currentUser } = useStation();
    const [assignments, setAssignments] = useState<RiderAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<RiderAssignmentResponse | null>(null);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showFailedModal, setShowFailedModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [amountCollected, setAmountCollected] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [failureReason, setFailureReason] = useState("");
    const [selectedFailureReason, setSelectedFailureReason] = useState("");
    const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 50,
        totalElements: 0,
        totalPages: 0,
    });

    // Predefined failure reasons
    const failureReasons = [
        "Recipient not available",
        "Wrong address",
        "Recipient refused delivery",
        "Address not found",
        "Recipient phone number not reachable",
        "Parcel damaged",
        "Incorrect recipient information",
        "Other"
    ];

    const fetchAssignments = useCallback(async (page: number = 0, size: number = 50) => {
        setLoading(true);
        try {
            const response = await riderService.getAssignments(page, size);
            console.log('Fetch assignments response:', response);

            if (response.success && response.data) {
                const data = response.data as any;
                console.log('Response data structure:', data);

                // Handle both paginated response (with content) and direct array
                let assignmentsList: RiderAssignmentResponse[] = [];
                if (data.content && Array.isArray(data.content)) {
                    assignmentsList = data.content;
                    console.log('Using data.content, found', assignmentsList.length, 'assignments');
                } else if (Array.isArray(data)) {
                    assignmentsList = data;
                    console.log('Using data as array, found', assignmentsList.length, 'assignments');
                } else if (Array.isArray(response.data)) {
                    assignmentsList = response.data;
                    console.log('Using response.data as array, found', assignmentsList.length, 'assignments');
                } else {
                    console.warn('Unexpected data structure:', data);
                }

                console.log('Setting assignments:', assignmentsList.length);
                setAssignments(assignmentsList);
                setPagination({
                    page: data.number !== undefined ? data.number : page,
                    size: data.size !== undefined ? data.size : size,
                    totalElements: data.totalElements !== undefined ? data.totalElements : assignmentsList.length,
                    totalPages: data.totalPages !== undefined ? data.totalPages : 1,
                });
            } else {
                console.error('Failed response:', response);
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
    }, [showToast]);

    // Fetch assignments on mount and when pagination changes
    useEffect(() => {
        fetchAssignments(pagination.page, pagination.size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.size]);


    const handleAssignmentStatusUpdate = async (assignmentId: string, newUIStatus: UIStatus, parcelId?: string) => {
        // Find the correct assignment - if parcelId is provided, match both assignmentId and parcelId
        // This is important because multiple parcels can share the same assignmentId after flattening
        const assignment = parcelId
            ? assignments.find((a) => a.assignmentId === assignmentId && a.parcel.parcelId === parcelId)
            : assignments.find((a) => a.assignmentId === assignmentId);

        console.log('=== Finding Assignment ===');
        console.log('Looking for assignmentId:', assignmentId);
        console.log('Looking for parcelId:', parcelId);
        console.log('Found assignment:', assignment);
        console.log('Assignment parcelId:', assignment?.parcel?.parcelId);

        if (newUIStatus === "delivered") {
            // Show confirmation modal for delivery
            if (assignment) {
                const parcel = assignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                // Pre-fill amount collected with expected total
                setAmountCollected(totalAmount.toFixed(2));
            }
            setSelectedAssignment(assignment || null);
            setPaymentMethod(""); // Reset payment method
            setConfirmationCode(""); // Reset confirmation code
            setShowDeliveryModal(true);
            return;
        } else if (newUIStatus === "delivery-failed") {
            // Show confirmation modal for failure
            setSelectedAssignment(assignment || null);
            setPaymentMethod(""); // Reset payment method
            setFailureReason("");
            setSelectedFailureReason("");
            setShowFailedModal(true);
            return;
        }

        // This shouldn't happen, but handle other statuses if needed
        setUpdatingAssignment(assignmentId);
        try {
            const apiStatus = mapUIToAssignmentStatus(newUIStatus);
            const response = await riderService.updateAssignmentStatus(assignmentId, apiStatus);

            if (response.success) {
                showToast("Status updated successfully", "success");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to update status", "error");
            }
        } catch (error) {
            console.error("Failed to update assignment status:", error);
            showToast("Failed to update status. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    const handleDeliveryComplete = async () => {
        if (!selectedAssignment || !amountCollected || !paymentMethod) {
            if (!paymentMethod) {
                showToast("Please select a payment method", "error");
            }
            return;
        }

        setUpdatingAssignment(selectedAssignment.assignmentId);
        try {
            const assignmentId = selectedAssignment.assignmentId;
            const parcelId = selectedAssignment.parcel.parcelId;

            // Log the payload for debugging
            console.log('=== Marking Parcel as Delivered ===');
            console.log('Assignment ID:', assignmentId);
            console.log('Parcel ID:', parcelId);
            console.log('Payment Method:', paymentMethod);
            console.log('Confirmation Code:', confirmationCode.trim() || '(none)');
            console.log('Amount Collected:', amountCollected);

            const response = await riderService.updateAssignmentStatus(
                assignmentId,
                "DELIVERED",
                confirmationCode.trim() || undefined, // Optional confirmation code
                undefined, // reason not needed for DELIVERED
                paymentMethod, // paymentMethod: "cash" or "momo"
                parcelId // parcelId - used in URL path and request body for DELIVERED status
            );

            if (response.success) {
                const parcel = selectedAssignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                const collected = parseFloat(amountCollected);

                showToast(
                    `Delivery completed! Collected GHC ${collected.toFixed(2)}${collected !== totalAmount ? ` (Expected: GHC ${totalAmount.toFixed(2)})` : ''}`,
                    "success"
                );

                setShowDeliveryModal(false);
                setSelectedAssignment(null);
                setAmountCollected("");
                setConfirmationCode("");
                setPaymentMethod("");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to complete delivery", "error");
            }
        } catch (error) {
            console.error("Failed to complete delivery:", error);
            showToast("Failed to complete delivery. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    const handleDeliveryFailed = async () => {
        if (!selectedAssignment) return;

        // Validate that either a reason is selected or custom reason is provided
        const finalReason = selectedFailureReason === "Other"
            ? failureReason.trim()
            : selectedFailureReason;

        if (!finalReason) {
            showToast("Please select a failure reason", "error");
            return;
        }

        setUpdatingAssignment(selectedAssignment.assignmentId);
        try {
            const assignmentId = selectedAssignment.assignmentId;
            const parcelId = selectedAssignment.parcel.parcelId;

            // Log the payload for debugging
            console.log('=== Marking Parcel as Failed ===');
            console.log('Assignment ID:', assignmentId);
            console.log('Parcel ID:', parcelId);
            console.log('Return Reason:', finalReason);
            console.log('Status: RETURNED');

            const response = await riderService.updateAssignmentStatus(
                assignmentId,
                "RETURNED", // Status should be RETURNED when marking as failed
                undefined, // confirmationCode not needed
                finalReason, // returnReason is required
                undefined, // paymentMethod not needed
                parcelId // parcelId is required
            );

            if (response.success) {
                showToast("Delivery failure recorded", "success");
                setShowFailedModal(false);
                setSelectedAssignment(null);
                setFailureReason("");
                setSelectedFailureReason("");
                setPaymentMethod("");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to record failure", "error");
            }
        } catch (error) {
            console.error("Failed to record failure:", error);
            showToast("Failed to record failure. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    // Filter assignments by parcel-level status
    // Backend assignment.status is unreliable, so we rely on parcel flags
    const activeAssignments = useMemo(() => {
        console.log('Filtering assignments. Total:', assignments.length);
        const filtered = assignments.filter(a => {
            const isDelivered = !!a.parcel?.delivered;
            const isCancelled = !!a.parcel?.cancelled;
            const isReturned = !!a.parcel?.returned;
            const isActive = !isDelivered && !isCancelled && !isReturned;
            if (!isActive) {
                console.log('Filtered out assignment:', a.assignmentId, 'parcel delivered:', a.parcel?.delivered, 'parcel cancelled:', a.parcel?.cancelled, 'parcel returned:', a.parcel?.returned);
            }
            return isActive;
        });
        console.log('Active assignments after filtering:', filtered.length);
        return filtered;
    }, [assignments]);

    // Calculate total amount to collect from active assignments
    const totalAmountToCollect = useMemo(() => {
        return activeAssignments.reduce((total, assignment) => {
            const parcel = assignment.parcel;
            const parcelAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                (parcel.inboundCost || 0) + (parcel.storageCost || 0);
            return total + parcelAmount;
        }, 0);
    }, [activeAssignments]);


    const handleDownloadPDF = () => {
        try {
            const pdfData = activeAssignments.map(assignment => {
                const parcel = assignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);

                const location = parcel.receiverAddress || 'N/A';

                return {
                    parcelId: parcel.parcelId, // Keep for reference but not displayed in PDF
                    recipientName: parcel.receiverName || 'N/A',
                    phone: parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : 'N/A',
                    location: location,
                    amount: formatCurrency(totalAmount),
                    status: '', // Not displayed in PDF
                    assignedAt: '' // Not displayed in PDF
                };
            });

            generateAssignmentsPDF(pdfData, currentUser?.name || 'Rider');
            showToast("PDF downloaded successfully", "success");
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            showToast("Failed to generate PDF. Please try again.", "error");
        }
    };

    // Get status badge based on parcel-level status fields (delivered, cancelled)
    const getStatusBadge = (parcel: RiderParcelResponse) => {
        let statusLabel: string;
        let statusColor: string;
        let borderColor: string;

        if (parcel.cancelled) {
            statusLabel = "Cancelled";
            statusColor = "bg-red-100 text-red-800";
            borderColor = "border-red-300";
        } else if (parcel.delivered) {
            statusLabel = "Delivered";
            statusColor = "bg-green-100 text-green-800";
            borderColor = "border-green-300";
        } else {
            // Default to "Assigned" for active parcels
            statusLabel = "Assigned";
            statusColor = "bg-blue-100 text-blue-800";
            borderColor = "border-blue-300";
        }

        return <Badge className={`${statusColor} ${borderColor} border font-semibold px-3 py-1 shadow-sm`}>{statusLabel}</Badge>;
    };

    const getNextStatusAction = (assignment: RiderAssignmentResponse) => {
        const parcel = assignment.parcel;
        // Only show "Mark Delivered" button if parcel is not delivered and not cancelled
        if (!parcel.delivered && !parcel.cancelled) {
            return { label: "Mark Delivered", status: "delivered" as UIStatus, color: "bg-green-600" };
        }
        return null;
    };


    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">My Deliveries</h1>
                    <p className="text-sm text-gray-600">Manage your assigned parcels</p>
                </div>

                {/* Statistics Cards */}
                <div className="flex flex-row gap-3 sm:gap-4">
                    <Card className="rounded-lg border border-gray-200 bg-white shadow-sm flex-1 min-w-0">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Active Deliveries</p>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{activeAssignments.length}</p>
                                </div>
                                <TruckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-50 flex-shrink-0 ml-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border border-gray-200 bg-white shadow-sm flex-1 min-w-0">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Total Amount to Collect</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#ea690c] truncate">{formatCurrency(totalAmountToCollect)}</p>
                                </div>
                                <DollarSignIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#ea690c] opacity-50 flex-shrink-0 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Assignments */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-neutral-800">Active Assignments</h2>
                        <div className="flex items-center gap-3">
                            {activeAssignments.length > 0 && (
                                <Button
                                    onClick={handleDownloadPDF}
                                    variant="outline"
                                    className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </Button>
                            )}
                            {/* <Badge className="bg-[#ea690c] text-white px-3 py-1 font-semibold">
                                {activeAssignments.length} {activeAssignments.length === 1 ? 'Parcel' : 'Parcels'}
                            </Badge> */}
                        </div>
                    </div>

                    {loading ? (
                        <Card className="rounded-xl border-0 bg-white shadow-lg">
                            <CardContent className="p-12 text-center">
                                <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                <p className="text-neutral-700 font-semibold text-lg">Loading assignments...</p>
                                <p className="text-sm text-gray-500 mt-2">Please wait</p>
                            </CardContent>
                        </Card>
                    ) : activeAssignments.length === 0 ? (
                        <Card className="rounded-xl border-0 bg-white shadow-lg">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PackageIcon className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-neutral-800 font-semibold text-lg mb-2">No active assignments</p>
                                <p className="text-sm text-gray-500">
                                    Check back later for new assignments
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Recipient</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Phone</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {activeAssignments.map((assignment, index) => {
                                            const nextAction = getNextStatusAction(assignment);
                                            const parcel = assignment.parcel;
                                            const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                                                (parcel.inboundCost || 0) + (parcel.storageCost || 0);

                                            return (
                                                <tr
                                                    key={assignment.assignmentId}
                                                    className={`hover:bg-gray-50 transition-colors ${index !== activeAssignments.length - 1 ? 'border-b border-gray-200' : ''}`}
                                                >
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
                                                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                        <div className="text-sm font-bold text-[#ea690c]">
                                                            {formatCurrency(totalAmount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                        {getStatusBadge(parcel)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
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
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedAssignment(assignment);
                                                                    setShowDetailsModal(true);
                                                                }}
                                                                variant="outline"
                                                                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1.5"
                                                            >
                                                                View Details
                                                            </Button>
                                                            {nextAction && (
                                                                <Button
                                                                    onClick={() => handleAssignmentStatusUpdate(assignment.assignmentId, nextAction.status, parcel.parcelId)}
                                                                    disabled={updatingAssignment === assignment.assignmentId}
                                                                    className={`${nextAction.color} text-white hover:opacity-90 disabled:opacity-50 text-xs px-3 py-1.5`}
                                                                >
                                                                    {updatingAssignment === assignment.assignmentId ? (
                                                                        <Loader className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        nextAction.label
                                                                    )}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                onClick={() => handleAssignmentStatusUpdate(assignment.assignmentId, "delivery-failed", parcel.parcelId)}
                                                                variant="outline"
                                                                className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5"
                                                            >
                                                                Mark Failed
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!loading && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-neutral-700">
                                        Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} assignments
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                                            }}
                                            disabled={pagination.page === 0 || loading}
                                            variant="outline"
                                            size="sm"
                                            className="border border-gray-300"
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
                                            className="border border-gray-300"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            {/* Delivery Confirmation Modal */}
            {showDeliveryModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <Card className="w-full sm:max-w-md border border-[#d1d1d1] bg-white shadow-lg rounded-t-2xl sm:rounded-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <CardContent className="p-4 sm:p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                                <h3 className="text-lg font-bold text-neutral-800">Confirm Delivery</h3>
                                <button
                                    onClick={() => {
                                        setShowDeliveryModal(false);
                                        setSelectedAssignment(null);
                                        setAmountCollected("");
                                        setConfirmationCode("");
                                        setPaymentMethod("");
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-yellow-900 mb-1">Are you sure?</p>
                                            <p className="text-xs text-yellow-800">
                                                Please confirm that you have successfully delivered this parcel to the recipient.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                                    <p className="font-semibold text-neutral-800">{selectedAssignment.parcel.receiverName || "N/A"}</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-[#5d5d5d] mb-2">Expected Amount</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#ea690c]">
                                        {formatCurrency(
                                            (selectedAssignment.parcel.deliveryCost || 0) + (selectedAssignment.parcel.pickUpCost || 0) +
                                            (selectedAssignment.parcel.inboundCost || 0) + (selectedAssignment.parcel.storageCost || 0)
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

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Payment Method <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] bg-white"
                                    >
                                        <option value="">Select payment method</option>
                                        <option value="cash">Cash</option>
                                        <option value="momo">Mobile Money (MoMo)</option>
                                    </select>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Confirmation Code (Optional)
                                    </Label>
                                    <Input
                                        type="text"
                                        value={confirmationCode}
                                        onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                                        placeholder="Enter confirmation code (optional)"
                                        className="w-full uppercase"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {/* Fixed Footer with Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
                                <Button
                                    onClick={() => {
                                        setShowDeliveryModal(false);
                                        setSelectedAssignment(null);
                                        setAmountCollected("");
                                        setConfirmationCode("");
                                        setPaymentMethod("");
                                    }}
                                    variant="outline"
                                    className="flex-1 border border-[#d1d1d1] py-2.5 sm:py-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeliveryComplete}
                                    disabled={!amountCollected || !paymentMethod || updatingAssignment === selectedAssignment.assignmentId}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 py-2.5 sm:py-2"
                                >
                                    {updatingAssignment === selectedAssignment.assignmentId ? (
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
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Parcel Details Modal */}
            {showDetailsModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAssignment(null);
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedAssignment && (() => {
                                const parcel = selectedAssignment.parcel;
                                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                                const nextAction = getNextStatusAction(selectedAssignment);

                                return (
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-sm font-semibold px-3 py-1 shadow-sm">
                                                {parcel.parcelId}
                                            </Badge>
                                            {getStatusBadge(selectedAssignment.parcel)}
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
                                                    <p className="text-sm font-semibold text-neutral-800">{parcel.receiverName || "N/A"}</p>
                                                </div>
                                                {parcel.recieverPhoneNumber && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Phone</p>
                                                        <a
                                                            href={`tel:${parcel.recieverPhoneNumber}`}
                                                            className="text-sm font-semibold text-[#ea690c] hover:underline"
                                                        >
                                                            {formatPhoneNumber(parcel.recieverPhoneNumber)}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delivery Address */}
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                                <MapPinIcon className="w-4 h-4" />
                                                Delivery Address
                                            </h4>
                                            <p className="text-sm text-neutral-800">
                                                {parcel.receiverAddress || "N/A"}
                                            </p>
                                        </div>

                                        {/* Sender Information */}
                                        {(parcel.senderName || parcel.senderPhoneNumber) && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4" />
                                                    Sender Information
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {parcel.senderName && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Name</p>
                                                            <p className="text-sm font-semibold text-neutral-800">{parcel.senderName}</p>
                                                        </div>
                                                    )}
                                                    {parcel.senderPhoneNumber && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Phone</p>
                                                            <a
                                                                href={`tel:${parcel.senderPhoneNumber}`}
                                                                className="text-sm font-semibold text-[#ea690c] hover:underline"
                                                            >
                                                                {formatPhoneNumber(parcel.senderPhoneNumber)}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Item Description */}
                                        {parcel.parcelDescription && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-sm font-bold text-gray-900 mb-2">Item Description</h4>
                                                <p className="text-sm text-neutral-800">{parcel.parcelDescription}</p>
                                                {parcel.fragile && (
                                                    <Badge className="mt-2 bg-red-100 text-red-800 border-red-200">
                                                        Fragile
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Amount Breakdown */}
                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                                            <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                                                <TruckIcon className="w-4 h-4" />
                                                Amount to Collect
                                            </h4>
                                            <div className="space-y-2 bg-white/60 rounded-lg p-3">
                                                {(parcel.inboundCost || 0) > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-700">Item Value:</span>
                                                        <span className="font-semibold text-gray-900">GHC {(parcel.inboundCost || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {(parcel.deliveryCost || 0) > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-700">Delivery Fee:</span>
                                                        <span className="font-semibold text-gray-900">GHC {(parcel.deliveryCost || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {(parcel.pickUpCost || 0) > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-700">Pickup Cost:</span>
                                                        <span className="font-semibold text-gray-900">GHC {(parcel.pickUpCost || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {(parcel.storageCost || 0) > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-700">Storage:</span>
                                                        <span className="font-semibold text-gray-900">GHC {(parcel.storageCost || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t-2 border-orange-200">
                                                    <span className="text-base font-bold text-orange-900">Total:</span>
                                                    <span className="text-xl font-bold text-[#ea690c]">
                                                        {formatCurrency(totalAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assignment Info */}
                                        {selectedAssignment.assignedAt && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                    <ClockIcon className="w-4 h-4" />
                                                    Assignment Information
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    Assigned: {formatDateTime(new Date(selectedAssignment.assignedAt).toISOString())}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-3 pt-4 border-t-2 border-gray-100">
                                            {nextAction && (
                                                <Button
                                                    onClick={() => {
                                                        setShowDetailsModal(false);
                                                        handleAssignmentStatusUpdate(selectedAssignment.assignmentId, nextAction.status, parcel.parcelId);
                                                    }}
                                                    disabled={updatingAssignment === selectedAssignment.assignmentId}
                                                    className={`${nextAction.color} text-white hover:opacity-90 disabled:opacity-50 w-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold py-3`}
                                                >
                                                    {updatingAssignment === selectedAssignment.assignmentId ? (
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

                                            <Button
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleAssignmentStatusUpdate(selectedAssignment.assignmentId, "delivery-failed", parcel.parcelId);
                                                }}
                                                variant="outline"
                                                className="border-2 border-red-300 text-red-600 hover:bg-red-50 w-full font-semibold py-3 shadow-md hover:shadow-lg transition-all"
                                            >
                                                <XCircleIcon className="w-4 h-4 mr-2" />
                                                Mark as Failed
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delivery Failed Modal */}
            {showFailedModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <Card className="w-full sm:max-w-md border border-[#d1d1d1] bg-white shadow-lg rounded-t-2xl sm:rounded-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <CardContent className="p-4 sm:p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                                <h3 className="text-lg font-bold text-neutral-800">Mark Delivery as Failed</h3>
                                <button
                                    onClick={() => {
                                        setShowFailedModal(false);
                                        setSelectedAssignment(null);
                                        setFailureReason("");
                                        setSelectedFailureReason("");
                                        setPaymentMethod("");
                                    }}
                                    className="text-[#9a9a9a] hover:text-neutral-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-900 mb-1">Are you sure?</p>
                                            <p className="text-xs text-red-800">
                                                Please confirm that this delivery has failed and provide a reason. This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Recipient</p>
                                    <p className="font-semibold text-neutral-800">{selectedAssignment.parcel.receiverName || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-[#5d5d5d] mb-1">Parcel ID</p>
                                    <p className="font-semibold text-neutral-800">{selectedAssignment.parcel.parcelId}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                        Failure Reason <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <select
                                        value={selectedFailureReason}
                                        onChange={(e) => {
                                            setSelectedFailureReason(e.target.value);
                                            if (e.target.value !== "Other") {
                                                setFailureReason("");
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] bg-white"
                                    >
                                        <option value="">Select a reason</option>
                                        {failureReasons.map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedFailureReason === "Other" && (
                                        <div className="mt-3">
                                            <Label className="text-sm font-semibold text-neutral-800 mb-2">
                                                Please specify <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <textarea
                                                value={failureReason}
                                                onChange={(e) => setFailureReason(e.target.value)}
                                                placeholder="Enter reason for delivery failure..."
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none"
                                                rows={4}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fixed Footer with Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
                                <Button
                                    onClick={() => {
                                        setShowFailedModal(false);
                                        setSelectedAssignment(null);
                                        setFailureReason("");
                                        setSelectedFailureReason("");
                                    }}
                                    variant="outline"
                                    className="flex-1 border border-[#d1d1d1] py-2.5 sm:py-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeliveryFailed}
                                    disabled={
                                        (!selectedFailureReason || (selectedFailureReason === "Other" && !failureReason.trim()))
                                        || updatingAssignment === selectedAssignment.assignmentId
                                    }
                                    className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 py-2.5 sm:py-2"
                                >
                                    {updatingAssignment === selectedAssignment.assignmentId ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <XCircleIcon className="w-4 h-4 mr-2" />
                                            Confirm Failure
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

