import { useState, useEffect, useMemo, useCallback } from "react";
import {
    PackageIcon,
    MapPinIcon,
    CheckCircleIcon,
    Loader,
    UserIcon,
    TruckIcon,
    ClockIcon,
    XIcon,
    Phone,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatPhoneNumber, formatDateTime, formatCurrency } from "../../utils/dataHelpers";
import riderService, { RiderAssignmentResponse, AssignmentStatus } from "../../services/riderService";
import { useToast } from "../../components/ui/toast";

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
        case "CANCELLED":
            return "delivery-failed";
        default:
            return "assigned";
    }
};

const getStatusBadge = (status: AssignmentStatus) => {
    const uiStatus = mapAssignmentStatusToUI(status);
    const statusConfig: Record<UIStatus, { label: string; color: string; borderColor: string }> = {
        "assigned": { label: "Assigned", color: "bg-blue-100 text-blue-800", borderColor: "border-blue-300" },
        "accepted": { label: "Accepted", color: "bg-indigo-100 text-indigo-800", borderColor: "border-indigo-300" },
        "picked-up": { label: "Picked Up", color: "bg-purple-100 text-purple-800", borderColor: "border-purple-300" },
        "out-for-delivery": { label: "Out for Delivery", color: "bg-purple-100 text-purple-800", borderColor: "border-purple-300" },
        "delivered": { label: "Delivered", color: "bg-green-100 text-green-800", borderColor: "border-green-300" },
        "delivery-failed": { label: "Failed", color: "bg-red-100 text-red-800", borderColor: "border-red-300" },
    };
    const config = statusConfig[uiStatus] || { label: status, color: "bg-gray-100 text-gray-800", borderColor: "border-gray-300" };
    return <Badge className={`${config.color} ${config.borderColor} border font-semibold px-3 py-1 shadow-sm`}>{config.label}</Badge>;
};

export const RiderHistory = (): JSX.Element => {
    const { showToast } = useToast();
    const [assignments, setAssignments] = useState<RiderAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<RiderAssignmentResponse | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch with a large page size to get all history (or implement pagination)
            const response = await riderService.getAssignments(0, 100);
            console.log('RiderHistory fetch response:', response);

            if (response.success && response.data) {
                const data = response.data as any;
                // Handle both paginated response (with content) and direct array
                let assignmentsList: RiderAssignmentResponse[] = [];

                if (data.content && Array.isArray(data.content)) {
                    // Paginated response structure
                    assignmentsList = data.content;
                    console.log('Using paginated content, found', assignmentsList.length, 'assignments');
                } else if (Array.isArray(data)) {
                    // Direct array response
                    assignmentsList = data;
                    console.log('Using direct array, found', assignmentsList.length, 'assignments');
                } else if (Array.isArray(response.data)) {
                    assignmentsList = response.data;
                    console.log('Using response.data as array, found', assignmentsList.length, 'assignments');
                } else {
                    console.warn('Unexpected data structure in RiderHistory:', data);
                    assignmentsList = [];
                }

                console.log('Setting assignments:', assignmentsList.length);
                setAssignments(assignmentsList);
            } else {
                console.error('Failed response:', response);
                showToast(response.message || "Failed to load history", "error");
                setAssignments([]);
            }
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
            showToast("Failed to load history. Please try again.", "error");
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Filter only completed/delivered assignments based on parcel-level delivery status
    // Backend assignment.status is unreliable, so we rely on parcel.delivered
    const completedAssignments = useMemo(() => {
        if (!Array.isArray(assignments)) {
            console.warn('Assignments is not an array:', assignments);
            return [];
        }
        return assignments.filter(a => a.parcel?.delivered);
    }, [assignments]);

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">Delivery History</h1>
                    <p className="text-sm text-gray-600">View your completed deliveries</p>
                </div>

                {/* Statistics Card */}
                <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Total Completed</p>
                                <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
                            </div>
                            <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Completed Assignments */}
                {loading ? (
                    <Card className="rounded-xl border-0 bg-white shadow-lg">
                        <CardContent className="p-12 text-center">
                            <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                            <p className="text-neutral-700 font-semibold text-lg">Loading history...</p>
                            <p className="text-sm text-gray-500 mt-2">Please wait</p>
                        </CardContent>
                    </Card>
                ) : completedAssignments.length === 0 ? (
                    <Card className="rounded-xl border-0 bg-white shadow-lg">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PackageIcon className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-neutral-800 font-semibold text-lg mb-2">No delivery history</p>
                            <p className="text-sm text-gray-500">
                                Your completed deliveries will appear here
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Parcel ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Recipient</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Completed</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {completedAssignments.map((assignment, index) => {
                                        const parcel = assignment.parcel;
                                        const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                                            (parcel.inboundCost || 0) + (parcel.storageCost || 0);

                                        return (
                                            <tr
                                                key={assignment.assignmentId}
                                                className={`hover:bg-gray-50 transition-colors ${index !== completedAssignments.length - 1 ? 'border-b border-gray-200' : ''}`}
                                            >
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
                                                    {getStatusBadge(assignment.status)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                                    {assignment.completedAt ? (
                                                        <div className="text-xs text-gray-600">
                                                            {formatDateTime(new Date(assignment.completedAt).toISOString())}
                                                        </div>
                                                    ) : assignment.assignedAt ? (
                                                        <div className="text-xs text-gray-600">
                                                            {formatDateTime(new Date(assignment.assignedAt).toISOString())}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

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

                                return (
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-sm font-semibold px-3 py-1 shadow-sm">
                                                {parcel.parcelId}
                                            </Badge>
                                            {getStatusBadge(selectedAssignment.status)}
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

                                        {/* Delivery/Pickup Location */}
                                        {parcel.homeDelivery && parcel.receiverAddress ? (
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    Delivery Address
                                                </h4>
                                                <p className="text-sm text-neutral-800">{parcel.receiverAddress}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                                    <PackageIcon className="w-4 h-4" />
                                                    Pickup Location
                                                </h4>
                                                <p className="text-sm text-neutral-800">
                                                    Shelf: <strong>{parcel.shelfName || "N/A"}</strong> (Customer Pickup)
                                                </p>
                                            </div>
                                        )}

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
                                                Amount Collected
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
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4" />
                                                Assignment Information
                                            </h4>
                                            <div className="space-y-1">
                                                {selectedAssignment.assignedAt && (
                                                    <p className="text-xs text-gray-600">
                                                        Assigned: {formatDateTime(new Date(selectedAssignment.assignedAt).toISOString())}
                                                    </p>
                                                )}
                                                {selectedAssignment.completedAt && (
                                                    <p className="text-xs text-gray-600">
                                                        Completed: {formatDateTime(new Date(selectedAssignment.completedAt).toISOString())}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

