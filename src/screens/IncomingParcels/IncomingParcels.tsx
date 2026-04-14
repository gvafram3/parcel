import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SearchIcon, PackageIcon, TruckIcon, ArrowLeftIcon, X, PhoneIcon, MapPinIcon, CheckIcon, Loader, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { API_ENDPOINTS } from "../../config/api";
import { useShelf } from "../../contexts/ShelfContext";
import { useStation } from "../../contexts/StationContext";

interface Parcel {
  parcelId: string;
  senderName: string;
  senderPhoneNumber: string;
  receiverName: string;
  recieverPhoneNumber: string;
  deliveryAddress: string;
  parcelDescription: string;
  driverName: string;
  driverPhoneNumber: string;
  vehicleNumber: string;
  inboundCost: number;
  ItemCost: number;
  POD: boolean;
  from: {
    officeId: string;
    officeName: string;
  };
  to: {
    officeId: string;
    officeName: string;
  };
  fromOfficeId: string;
  toOfficeId: string;
  typeofParcel: string;
  hasArrivedAtOffice: boolean;
  createdAt: number;
}

export const IncomingParcels = (): JSX.Element => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { shelves, loadShelves, loading: loadingShelves } = useShelf();
  const { currentUser } = useStation();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewParcel, setViewParcel] = useState<Parcel | null>(null);
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "in-transit" | "arrived">("all");
  const [sortBy, setSortBy] = useState<"date" | "driver" | "amount" | "status">("date");
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIncomingParcels();
    const userData = authService.getUser();
    const officeId = (userData as any)?.office?.id;
    
    if (officeId) {
      loadShelves(officeId);
    }
  }, [loadShelves]);

  const fetchIncomingParcels = async () => {
    const token = authService.getToken();
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.FRONTDESK}/parcels/transfer/in-transit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data && Array.isArray(data.content)) {
        setParcels(data.content);
      } else if (Array.isArray(data)) {
        setParcels(data);
      } else {
        setParcels([]);
      }
    } catch (error: any) {
      console.error("Error fetching incoming parcels:", error);
      showToast(
        error.response?.data?.message || "Failed to fetch incoming parcels",
        "error"
      );
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = parcels.filter((parcel) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      parcel.parcelId?.toLowerCase().includes(query) ||
      parcel.receiverName?.toLowerCase().includes(query) ||
      parcel.senderName?.toLowerCase().includes(query) ||
      parcel.recieverPhoneNumber?.toLowerCase().includes(query) ||
      parcel.driverName?.toLowerCase().includes(query)
    );

    // Apply status filter
    if (statusFilter === "in-transit" && parcel.hasArrivedAtOffice) return false;
    if (statusFilter === "arrived" && !parcel.hasArrivedAtOffice) return false;

    return matchesSearch;
  });

  // Group parcels by driver
  const groupedByDriver = filteredParcels.reduce((acc, parcel) => {
    const driverKey = `${parcel.driverPhoneNumber || 'no-phone'}_${parcel.vehicleNumber || 'no-vehicle'}`;
    if (!acc[driverKey]) {
      acc[driverKey] = {
        driverKey,
        driverName: parcel.driverName,
        driverPhoneNumber: parcel.driverPhoneNumber,
        vehicleNumber: parcel.vehicleNumber,
        parcels: [],
      };
    }
    acc[driverKey].parcels.push(parcel);
    return acc;
  }, {} as Record<string, { driverKey: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] }>);

  let driverGroups = Object.values(groupedByDriver);

  // Apply sorting
  if (sortBy === "date") {
    driverGroups = driverGroups.map(group => ({
      ...group,
      parcels: [...group.parcels].sort((a, b) => b.createdAt - a.createdAt)
    }));
  } else if (sortBy === "amount") {
    driverGroups = driverGroups.sort((a, b) => {
      const totalA = a.parcels.reduce((sum, p) => sum + (p.inboundCost || 0) + ((p.POD || p.typeofParcel === "ONLINE") ? (p.ItemCost || 0) : 0), 0);
      const totalB = b.parcels.reduce((sum, p) => sum + (p.inboundCost || 0) + ((p.POD || p.typeofParcel === "ONLINE") ? (p.ItemCost || 0) : 0), 0);
      return totalB - totalA;
    });
  } else if (sortBy === "driver") {
    driverGroups = driverGroups.sort((a, b) => (a.driverName || "").localeCompare(b.driverName || ""));
  } else if (sortBy === "status") {
    driverGroups = driverGroups.map(group => ({
      ...group,
      parcels: [...group.parcels].sort((a, b) => {
        if (a.hasArrivedAtOffice === b.hasArrivedAtOffice) return 0;
        return a.hasArrivedAtOffice ? 1 : -1;
      })
    }));
  }

  const toggleDriver = (driverKey: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverKey)) {
      newExpanded.delete(driverKey);
    } else {
      newExpanded.add(driverKey);
    }
    setExpandedDrivers(newExpanded);
  };

  const toggleParcel = (parcelId: string) => {
    const newSelected = new Set(selectedParcels);
    if (newSelected.has(parcelId)) {
      newSelected.delete(parcelId);
    } else {
      newSelected.add(parcelId);
    }
    setSelectedParcels(newSelected);
  };

  const handleAssignShelf = () => {
    if (selectedParcels.size > 0) {
      setShowShelfModal(true);
    }
  };

  const handleMarkAsArrived = async () => {
    if (!selectedShelf || selectedParcels.size === 0) {
      showToast("Please select a shelf", "warning");
      return;
    }

    const token = authService.getToken();
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    setIsAssigning(true);

    try {
      const parcelIds = Array.from(selectedParcels);
      const promises = parcelIds.map((parcelId) =>
        axios.put(
          `${API_ENDPOINTS.FRONTDESK}/parcels/transfer/${parcelId}/arrived?shelfId=${selectedShelf}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      await Promise.all(promises);
      showToast(`Successfully marked ${parcelIds.length} parcel(s) as arrived!`, "success");

      setSelectedParcels(new Set());
      setSelectedShelf(null);
      setShowShelfModal(false);

      await fetchIncomingParcels();
    } catch (error: any) {
      console.error("Failed to mark parcels as arrived:", error);
      showToast(
        error.response?.data?.message || "Failed to mark parcels as arrived. Please try again.",
        "error"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const inTransitParcels = parcels.filter(p => !p.hasArrivedAtOffice);

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-neutral-800">
                Incoming Parcels
              </h1>
              <p className="text-xs text-[#5d5d5d]">
                View all parcels being transferred to this station
              </p>
            </div>
            <Button
              onClick={() => navigate("/parcel-transfer")}
              variant="outline"
              className="flex items-center gap-2 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Transfer</span>
            </Button>
          </div>
        </div>

        <Card className="border border-[#d1d1d1] bg-white">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Filter and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === "all"
                        ? "bg-[#ea690c] text-white shadow-sm"
                        : "bg-gray-100 text-neutral-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({parcels.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("in-transit")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === "in-transit"
                        ? "bg-yellow-500 text-white shadow-sm"
                        : "bg-gray-100 text-neutral-700 hover:bg-gray-200"
                    }`}
                  >
                    In Transit ({parcels.filter(p => !p.hasArrivedAtOffice).length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("arrived")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === "arrived"
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-gray-100 text-neutral-700 hover:bg-gray-200"
                    }`}
                  >
                    Arrived ({parcels.filter(p => p.hasArrivedAtOffice).length})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-neutral-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-[#d1d1d1] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="driver">Driver Name</option>
                    <option value="amount">Total Amount</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Info and Action Bar */}
        {selectedParcels.size > 0 && (
          <Card className="border-2 border-[#ea690c] bg-white shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ea690c]">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-neutral-800">
                    {selectedParcels.size} Parcel(s) Selected
                  </span>
                </div>
                <span className="text-sm text-[#5d5d5d]">
                  Total: GHC {Array.from(selectedParcels).reduce((sum, id) => {
                    const parcel = parcels.find(p => p.parcelId === id);
                    if (!parcel) return sum;
                    return sum + (parcel.inboundCost || 0) + ((parcel.POD || parcel.typeofParcel === "ONLINE") ? (parcel.ItemCost || 0) : 0);
                  }, 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setSelectedParcels(new Set())}
                  variant="outline"
                  className="border-[#d1d1d1] text-neutral-700"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleAssignShelf}
                  className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                >
                  Assign to Shelf
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-12 text-center">
              <div className="h-8 w-8 border-4 border-[#ea690c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-700 font-medium">Loading parcels...</p>
            </CardContent>
          </Card>
        ) : filteredParcels.length === 0 ? (
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-12 text-center">
              <PackageIcon className="h-16 w-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
              <p className="text-neutral-700 font-medium">No incoming parcels found</p>
              <p className="text-sm text-[#5d5d5d] mt-2">
                {searchQuery ? "Try adjusting your search" : "Parcels being transferred to this station will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                        <input
                          type="checkbox"
                          checked={inTransitParcels.length > 0 && inTransitParcels.every(p => selectedParcels.has(p.parcelId))}
                          onChange={() => {
                            const allSelected = inTransitParcels.every(p => selectedParcels.has(p.parcelId));
                            const newSelected = new Set(selectedParcels);
                            if (allSelected) {
                              inTransitParcels.forEach(p => newSelected.delete(p.parcelId));
                            } else {
                              inTransitParcels.forEach(p => newSelected.add(p.parcelId));
                            }
                            setSelectedParcels(newSelected);
                          }}
                          className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                          disabled={inTransitParcels.length === 0}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">From Office</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Parcels</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">In Transit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Arrived</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {driverGroups.map((group, groupIndex) => {
                      const isExpanded = expandedDrivers.has(group.driverKey);
                      const totalValue = group.parcels.reduce((sum, p) => 
                        sum + (p.inboundCost || 0) + ((p.POD || p.typeofParcel === "ONLINE") ? (p.ItemCost || 0) : 0), 0
                      );
                      const inTransitCount = group.parcels.filter(p => !p.hasArrivedAtOffice).length;
                      const arrivedCount = group.parcels.filter(p => p.hasArrivedAtOffice).length;
                      const groupInTransitParcels = group.parcels.filter(p => !p.hasArrivedAtOffice);
                      const allGroupSelected = groupInTransitParcels.length > 0 && groupInTransitParcels.every(p => selectedParcels.has(p.parcelId));

                      return (
                        <>
                          {/* Driver Group Header Row */}
                          <tr
                            key={group.driverKey}
                            className={`transition-colors ${groupIndex !== driverGroups.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50`}
                          >
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <input
                                type="checkbox"
                                checked={allGroupSelected}
                                onChange={() => {
                                  const newSelected = new Set(selectedParcels);
                                  if (allGroupSelected) {
                                    groupInTransitParcels.forEach(p => newSelected.delete(p.parcelId));
                                  } else {
                                    groupInTransitParcels.forEach(p => newSelected.add(p.parcelId));
                                  }
                                  setSelectedParcels(newSelected);
                                }}
                                className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                disabled={groupInTransitParcels.length === 0}
                              />
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleDriver(group.driverKey)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4" />
                                  ) : (
                                    <ChevronRightIcon className="w-4 h-4" />
                                  )}
                                </button>
                                <div className="flex items-center gap-2">
                                  <TruckIcon className="w-4 h-4 text-green-500" />
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-800">
                                      {group.driverName || "Unknown Driver"}
                                    </div>
                                    {group.driverPhoneNumber && (
                                      <a
                                        href={`tel:${group.driverPhoneNumber}`}
                                        className="text-xs text-[#ea690c] hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {group.driverPhoneNumber}
                                      </a>
                                    )}
                                    {group.vehicleNumber && (
                                      <div className="text-xs text-gray-500">{group.vehicleNumber}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="text-sm text-blue-700 font-medium">
                                {group.parcels[0]?.from?.officeName || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <div className="text-sm font-semibold text-neutral-800">
                                {group.parcels.length}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <div className="text-sm font-semibold text-yellow-600">
                                {inTransitCount}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                              <div className="text-sm font-semibold text-green-600">
                                {arrivedCount}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-[#ea690c]">
                                GHC {totalValue.toFixed(2)}
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Parcels Rows */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-0 py-0">
                                <div className="bg-gray-50 border-t border-gray-200">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Select</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Receiver</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.parcels.map((parcel, parcelIndex) => {
                                        const isInTransit = !parcel.hasArrivedAtOffice;
                                        const isSelected = selectedParcels.has(parcel.parcelId);
                                        const totalCost = (parcel.inboundCost || 0) + ((parcel.POD || parcel.typeofParcel === "ONLINE") ? (parcel.ItemCost || 0) : 0);

                                        return (
                                          <tr
                                            key={parcel.parcelId}
                                            className={`${parcelIndex !== group.parcels.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-blue-50`}
                                          >
                                            <td className="px-4 py-3">
                                              {isInTransit ? (
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => toggleParcel(parcel.parcelId)}
                                                  className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                                />
                                              ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="text-sm font-semibold text-neutral-800">
                                                {parcel.receiverName}
                                              </div>
                                              {parcel.parcelDescription && (
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                                  {parcel.parcelDescription}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              {parcel.recieverPhoneNumber ? (
                                                <a
                                                  href={`tel:${parcel.recieverPhoneNumber}`}
                                                  className="text-sm text-[#ea690c] hover:underline font-medium"
                                                >
                                                  {parcel.recieverPhoneNumber}
                                                </a>
                                              ) : (
                                                <span className="text-sm text-gray-400">N/A</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                parcel.typeofParcel === "ONLINE" || parcel.POD
                                                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                                                  : "bg-blue-100 text-blue-700 border border-blue-300"
                                              }`}>
                                                {parcel.typeofParcel === "ONLINE" || parcel.POD ? "POD" : "Regular"}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                parcel.hasArrivedAtOffice
                                                  ? "bg-green-100 text-green-800 border border-green-300"
                                                  : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                              }`}>
                                                {parcel.hasArrivedAtOffice ? "Arrived" : "In Transit"}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="text-right">
                                                <div className="text-xs text-[#5d5d5d]">Transport: GHC {(parcel.inboundCost || 0).toFixed(2)}</div>
                                                {(parcel.POD || parcel.typeofParcel === "ONLINE") && parcel.ItemCost > 0 && (
                                                  <div className="text-xs text-[#5d5d5d]">Item: GHC {(parcel.ItemCost || 0).toFixed(2)}</div>
                                                )}
                                                <div className="text-sm font-bold text-[#ea690c]">
                                                  GHC {totalCost.toFixed(2)}
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <Button
                                                onClick={() => setViewParcel(parcel)}
                                                variant="outline"
                                                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2.5 py-1.5"
                                                title="View parcel details"
                                              >
                                                View Details
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
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
            </CardContent>
          </Card>
        )}

        {viewParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                  <button
                    onClick={() => setViewParcel(null)}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Tracking ID</p>
                        <p className="font-semibold text-[#ea690c] text-sm">{viewParcel.parcelId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Parcel Type</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          viewParcel.typeofParcel === "ONLINE" || viewParcel.POD
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {viewParcel.typeofParcel === "ONLINE" || viewParcel.POD ? "POD" : "Regular"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Status</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          viewParcel.hasArrivedAtOffice
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {viewParcel.hasArrivedAtOffice ? "Arrived" : "In Transit"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Created Date</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {new Date(viewParcel.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Receiver Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Receiver Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.receiverName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Phone Number</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.recieverPhoneNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[#5d5d5d] mb-1">Delivery Address</p>
                        <p className="text-sm text-neutral-700">{viewParcel.deliveryAddress || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Sender Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Sender Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.senderName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Sender Phone</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.senderPhoneNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Route Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">From Office</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.from?.officeName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">To Office</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.to?.officeName || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Driver Information</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Driver Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.driverName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Driver Phone</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.driverPhoneNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Vehicle Number</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.vehicleNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {viewParcel.parcelDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Parcel Description</h4>
                      <p className="text-sm text-neutral-700">{viewParcel.parcelDescription}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Cost Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#5d5d5d]">Transportation Cost</span>
                        <span className="font-semibold text-neutral-800 text-sm">GHC {(viewParcel.inboundCost || 0).toFixed(2)}</span>
                      </div>
                      {(viewParcel.POD || viewParcel.typeofParcel === "ONLINE") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#5d5d5d]">Item Cost (POD)</span>
                          <span className="font-semibold text-neutral-800 text-sm">GHC {(viewParcel.ItemCost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-[#d1d1d1] pt-3">
                        <span className="text-base font-bold text-neutral-800">Total Amount</span>
                        <span className="text-lg font-bold text-[#ea690c]">
                          GHC {((viewParcel.inboundCost || 0) + ((viewParcel.POD || viewParcel.typeofParcel === "ONLINE") ? (viewParcel.ItemCost || 0) : 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#d1d1d1] flex gap-3">
                    <Button
                      onClick={() => setViewParcel(null)}
                      variant="outline"
                      className="flex-1 border-[#d1d1d1]"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shelf Assignment Modal */}
        {showShelfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PackageIcon className="w-6 h-6 text-[#ea690c]" />
                  <h2 className="text-xl font-bold text-neutral-800">Assign to Shelf</h2>
                </div>
                <button
                  onClick={() => {
                    setShowShelfModal(false);
                    setSelectedShelf(null);
                  }}
                  className="text-[#9a9a9a] hover:text-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedParcels.size > 0 && (
                <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-4">
                  <p className="font-normal text-blue-800 text-sm">
                    <span className="font-semibold">{selectedParcels.size} Parcel(s)</span> selected for shelf assignment
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <p className="text-sm text-[#5d5d5d]">
                  Select an available shelf to mark the selected parcels as arrived
                </p>

                {loadingShelves ? (
                  <div className="text-center py-8">
                    <Loader className="w-12 h-12 text-[#ea690c] mx-auto mb-4 animate-spin" />
                    <p className="text-neutral-700 font-medium">Loading shelves...</p>
                  </div>
                ) : shelves.length === 0 ? (
                  <div className="text-center py-8">
                    <PackageIcon className="w-12 h-12 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                    <p className="text-neutral-700 font-medium">No shelves available</p>
                    <p className="text-sm text-[#5d5d5d] mt-2">
                      Please add shelves to this station first
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                      {shelves.map((shelf) => {
                        const isSelected = selectedShelf === shelf.id;

                        return (
                          <div
                            key={shelf.id}
                            onClick={() => setSelectedShelf(shelf.id)}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                              isSelected
                                ? "border-[#ea690c] bg-orange-50"
                                : "border-[#d1d1d1] bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-semibold text-neutral-800 text-base">
                              {shelf.name}
                            </span>

                            {isSelected && (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ea690c]">
                                <CheckIcon className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedShelf && (
                      <div className="flex justify-end gap-3 pt-4 border-t border-[#d1d1d1]">
                        <Button
                          onClick={() => {
                            setShowShelfModal(false);
                            setSelectedShelf(null);
                          }}
                          variant="outline"
                          className="border border-[#d1d1d1]"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleMarkAsArrived}
                          disabled={isAssigning}
                          className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                        >
                          {isAssigning ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin mr-2" />
                              Assigning...
                            </>
                          ) : (
                            `Mark ${selectedParcels.size} Parcel(s) as Arrived`
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
};
