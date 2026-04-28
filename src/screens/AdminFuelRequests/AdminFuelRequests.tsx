import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Fuel, CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import authService from '../../services/authService';
import { useToast } from '../../components/ui/toast';

interface FuelRequest {
  id: string;
  amount: number | null;
  station: string;
  fuleStationPhoneNumber: string;
  attendantPhoneNumber: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: number;
  riderInfo: {
    riderId: string;
    riderName: string;
    riderPhoneNumber: string;
    stationName: string;
  };
  officeId: string;
  tank: string;
  approvedBy?: string;
  approvedAt?: number;
  rejectionReason?: string;
  amountPaid?: number;
  completedAt?: number;
  updatedAt: number;
}

interface Stats {
  totalPending: number;
  totalApproved: number;
  totalCompleted: number;
  totalRejected: number;
  totalAmount: number;
  monthlyAmount: number;
}

const AdminFuelRequests: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    totalApproved: 0,
    totalCompleted: 0,
    totalRejected: 0,
    totalAmount: 0,
    monthlyAmount: 0
  });
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FuelRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editedStatus, setEditedStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('PENDING');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.FRONTDESK}/fuel-requests`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` }
      });
      setRequests(response.data.content || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      await axios.put(
        `${API_ENDPOINTS.FRONTDESK}/fuel-request/${id}`,
        {
          station: selectedRequest.station,
          fuelStationNumber: selectedRequest.fuleStationPhoneNumber,
          attendantNumber: selectedRequest.attendantPhoneNumber,
          notes: selectedRequest.notes,
          tank: selectedRequest.tank,
          amount: selectedRequest.amount,
          status: editedStatus
        },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      showToast(`Request ${editedStatus.toLowerCase()} successfully!`, 'success');
      setShowDetailsModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    setActionLoading(true);

    try {
      await axios.put(
        `${API_ENDPOINTS.FRONTDESK}/fuel-request/${selectedRequest.id}`,
        {
          station: selectedRequest.station,
          fuelStationNumber: selectedRequest.fuleStationPhoneNumber,
          attendantNumber: selectedRequest.attendantPhoneNumber,
          notes: rejectionReason,
          tank: selectedRequest.tank,
          amount: editedStatus === 'COMPLETED' && amountPaid ? Number(amountPaid) : selectedRequest.amount,
          status: 'REJECTED'
        },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      showToast('Request rejected successfully!', 'success');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;
    if (!amountPaid.trim() || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    setActionLoading(true);

    try {
      await axios.put(
        `${API_ENDPOINTS.FRONTDESK}/fuel-request/${selectedRequest.id}`,
        {
          station: selectedRequest.station,
          fuelStationNumber: selectedRequest.fuleStationPhoneNumber,
          attendantNumber: selectedRequest.attendantPhoneNumber,
          notes: rejectionReason || selectedRequest.notes,
          tank: selectedRequest.tank,
          amount: Number(amountPaid),
          status: 'COMPLETED'
        },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      showToast('Request marked as completed!', 'success');
      setShowCompleteModal(false);
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setAmountPaid('');
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to complete request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-1.5 py-0.5 text-[10px] ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <main className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-800">Fuel Request Management</h1>
              <p className="text-xs text-[#5d5d5d] mt-0.5">Review and approve rider fuel requests</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-800">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] text-sm bg-white"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <Card className="border border-[#d1d1d1] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Rider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Station</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                        <p className="text-sm text-neutral-700">Loading requests...</p>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-sm text-[#5d5d5d]">No requests found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req, index) => (
                      <tr key={req.id} className={`border-b border-[#d1d1d1] hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-neutral-800 text-sm">{req.riderInfo.riderName}</p>
                            <p className="text-xs text-[#5d5d5d]">{req.riderInfo.riderPhoneNumber}</p>
                            <p className="text-xs text-[#5d5d5d] mt-0.5">{req.riderInfo.stationName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {req.amount ? (
                            <p className="font-semibold text-neutral-800 text-sm">GHS {req.amount.toFixed(2)}</p>
                          ) : (
                            <p className="text-xs text-[#5d5d5d]">{req.tank.replace('_', ' ')}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-neutral-700">{req.station}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[#5d5d5d]">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(req);
                                setEditedStatus(req.status);
                                setShowDetailsModal(true);
                              }}
                              className="bg-[#ea690c] hover:bg-[#ea690c]/90 text-white text-xs h-8 px-3"
                            >
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-[#d1d1d1] text-xs text-[#5d5d5d]">
              Showing {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
            </div>
          </Card>
        </main>
      </div>

      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Fuel Request Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Selector */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Update Status
                </label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as typeof editedStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent bg-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              {/* Rider Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#ea690c]" />
                  Rider Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.riderInfo.riderName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.riderInfo.riderPhoneNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Station:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.riderInfo.stationName}</p>
                  </div>
                </div>
              </div>

              {/* Fuel Request Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tank Type:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.tank.replace('_', ' ')}</p>
                  </div>
                  {selectedRequest.amount && (
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-bold text-lg text-[#ea690c]">GHS {selectedRequest.amount.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Fuel Station:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.station}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Station Number:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.fuleStationPhoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendant Number:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.attendantPhoneNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Request Date:</span>
                    <p className="font-medium text-gray-800">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Amount Input for COMPLETED status */}
              {editedStatus === 'COMPLETED' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Amount Paid (GHS) *
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="Enter actual amount paid"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              )}

              {/* Rejection Reason for REJECTED status */}
              {editedStatus === 'REJECTED' && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="Explain why this request is being rejected"
                    rows={4}
                    required
                  />
                </div>
              )}

              {/* Approval/Rejection Info */}
              {selectedRequest.status === 'APPROVED' && selectedRequest.approvedBy && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Approval Information</h4>
                  <div className="text-sm space-y-1">
                    <p className="text-green-700">Approved by: <span className="font-medium">{selectedRequest.approvedBy}</span></p>
                    {selectedRequest.approvedAt && (
                      <p className="text-green-700">Approved at: <span className="font-medium">{new Date(selectedRequest.approvedAt).toLocaleString()}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                    setAmountPaid('');
                  }}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editedStatus === 'REJECTED' && !rejectionReason.trim()) {
                      showToast('Please provide a rejection reason', 'warning');
                      return;
                    }
                    if (editedStatus === 'COMPLETED' && (!amountPaid.trim() || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0)) {
                      showToast('Please enter a valid amount', 'warning');
                      return;
                    }
                    handleApprove(selectedRequest.id);
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-[#ea690c] hover:bg-[#d55a00] text-white py-3"
                >
                  {actionLoading ? 'Processing...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Fuel Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting request from <span className="font-semibold">{selectedRequest?.riderInfo.riderName}</span> for {selectedRequest?.tank.replace('_', ' ')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                placeholder="Explain why this request is being rejected"
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Processing...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Complete Fuel Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Completing request from <span className="font-semibold">{selectedRequest?.riderInfo.riderName}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid (GHS) *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                placeholder="Enter actual amount paid"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteModal(false);
                  setAmountPaid('');
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? 'Processing...' : 'Mark as Completed'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFuelRequests;
