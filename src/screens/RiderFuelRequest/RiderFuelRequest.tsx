import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Fuel, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import authService from '../../services/authService';
import { useToast } from '../../components/ui/toast';
import { normalizePhoneNumber, validatePhoneNumber } from '../../utils/dataHelpers';

interface FuelRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  riderInfo: {
    riderId: string;
    riderName: string;
    riderPhoneNumber: string;
    stationName: string;
  };
  officeId: string;
  station: string;
  notes: string;
  tank: string;
  amount: number | null;
  fuleStationPhoneNumber: string;
  attendantPhoneNumber: string;
  createdAt: number;
  updatedAt: number;
}

const RiderFuelRequest: React.FC = () => {
  const { showToast } = useToast();
  const [fuelType, setFuelType] = useState<'FULL_TANK' | 'HALF_TANK' | 'LITRES'>('FULL_TANK');
  const [litres, setLitres] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationNumber, setStationNumber] = useState('');
  const [attendantNumber, setAttendantNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fuelStations = ['Shell', 'Total', 'Goil', 'Puma', 'Allied', 'Star Oil', 'Benab Oil', 'Zen Petroleum'];

  const loadRequests = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.RIDER}/fuel-requests`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` }
      });
      setRequests(response.data.content || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone numbers (must be exactly 9 digits and not start with 0)
    if (stationNumber.length !== 9 || !/^[0-9]{9}$/.test(stationNumber)) {
      showToast('Fuel station number must be exactly 9 digits', 'error');
      return;
    }

    if (stationNumber.startsWith('0')) {
      showToast('Fuel station number cannot start with 0', 'error');
      return;
    }

    if (attendantNumber.length !== 9 || !/^[0-9]{9}$/.test(attendantNumber)) {
      showToast('Attendant number must be exactly 9 digits', 'error');
      return;
    }

    if (attendantNumber.startsWith('0')) {
      showToast('Attendant number cannot start with 0', 'error');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_ENDPOINTS.RIDER}/fuel-request`,
        {
          station: stationName,
          fuelStationNumber: `+233${stationNumber}`,
          attendantNumber: `+233${attendantNumber}`,
          notes,
          tank: fuelType === 'LITRES' ? litres : fuelType
        },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );

      showToast('Fuel request submitted successfully!', 'success');
      setFuelType('FULL_TANK');
      setLitres('');
      setStationName('');
      setStationNumber('');
      setAttendantNumber('');
      setNotes('');
      setIsModalOpen(false);
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to submit fuel request', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getFuelTypeLabel = (tank: string, amount: number | null) => {
    if (tank === 'FULL_TANK') return 'Full Tank';
    if (tank === 'HALF_TANK') return 'Half Tank';
    if (amount === null) return tank;
    return `${tank} Litres`;
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fuel Requests</h1>
          <p className="text-gray-600">View and manage your fuel requests</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ea690c] hover:bg-[#d55a00] text-white flex items-center gap-2"
        >
          <Fuel className="w-4 h-4" />
          Request Fuel
        </Button>
      </div>

      <Card className="shadow-lg border-[#d1d1d1]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-[#d1d1d1]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Fuel Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Station</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Station Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Attendant Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#d1d1d1]">
                {requests.map((req, index) => (
                  <tr key={req.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {getFuelTypeLabel(req.tank, req.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {req.station}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5d5d5d]">
                      {req.fuleStationPhoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5d5d5d]">
                      {req.attendantPhoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {req.amount !== null ? `GHS ${req.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5d5d5d]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Fuel className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No fuel requests yet</p>
                <p className="text-sm mt-1">Click "Request Fuel" to submit your first request</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b bg-gradient-to-r from-orange-50 to-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#ea690c]" />
                  New Fuel Request
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type *
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as 'FULL_TANK' | 'HALF_TANK' | 'LITRES')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    required
                  >
                    <option value="FULL_TANK">Full Tank</option>
                    <option value="HALF_TANK">Half Tank</option>
                    <option value="LITRES">Specific Litres</option>
                  </select>
                </div>

                {fuelType === 'LITRES' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Litres *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={litres}
                      onChange={(e) => setLitres(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                      placeholder="Enter litres"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Station *
                  </label>
                  <select
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    required
                  >
                    <option value="">Select fuel station</option>
                    {fuelStations.map((station) => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Station Number *
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-700 rounded-l-lg">
                      +233
                    </span>
                    <input
                      type="text"
                      value={stationNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 9 && !value.startsWith('0')) {
                          setStationNumber(value);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                      placeholder="XXXXXXXXX"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendant Number *
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-700 rounded-l-lg">
                      +233
                    </span>
                    <input
                      type="text"
                      value={attendantNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 9 && !value.startsWith('0')) {
                          setAttendantNumber(value);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                      placeholder="XXXXXXXXX"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="Additional information"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#ea690c] hover:bg-[#d55a00] text-white"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderFuelRequest;
