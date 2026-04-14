import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SearchIcon, PackageIcon, TruckIcon, UserIcon, PhoneIcon, ArrowLeftIcon, PrinterIcon, Edit2Icon, TrashIcon, XCircleIcon, X, ChevronDownIcon, ChevronUpIcon, FileTextIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { API_ENDPOINTS } from "../../config/api";
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/dataHelpers";

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

export const OutgoingParcels = (): JSX.Element => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteParcel, setDeleteParcel] = useState<Parcel | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [printParcel, setPrintParcel] = useState<Parcel | null>(null);
  const [editParcel, setEditParcel] = useState<Parcel | null>(null);
  const [editForm, setEditForm] = useState<Partial<Parcel>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const driversPerPage = 10;
  const [viewParcel, setViewParcel] = useState<Parcel | null>(null);
  const [manifestDriver, setManifestDriver] = useState<{ driverKey: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] } | null>(null);
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
  const [bulkPrintParcels, setBulkPrintParcels] = useState<Parcel[] | null>(null);

  // Generate dummy manifest data for testing
  const generateDummyManifest = () => {
    const dummyParcels: Parcel[] = [];
    const stations = [
      { id: 'station1', name: 'Accra Central Station' },
      { id: 'station2', name: 'Kumasi Main Office' },
      { id: 'station3', name: 'Takoradi Branch' },
    ];
    
    const descriptions = [
      'Small electronics package',
      'Clothing items and accessories for delivery',
      'Important business documents',
      'Fresh food items requiring careful handling',
      'Educational books and learning materials',
      'Mobile phone with charger and accessories',
      'Laptop computer with protective case',
      'Kitchen appliances and utensils set',
      'Baby clothes, toys and feeding bottles',
      'Medical supplies and pharmaceutical products',
    ];
    
    for (let i = 1; i <= 50; i++) {
      const station = stations[i % 3];
      const isPOD = i % 3 === 0;
      dummyParcels.push({
        parcelId: `PKG${String(i).padStart(6, '0')}`,
        senderName: `Sender ${i}`,
        senderPhoneNumber: `0${200000000 + i}`,
        receiverName: `Receiver ${i}`,
        recieverPhoneNumber: `0${240000000 + i}`,
        deliveryAddress: `${i} Sample Street, ${station.name}`,
        parcelDescription: descriptions[i % descriptions.length],
        driverName: 'John Doe',
        driverPhoneNumber: '0501234567',
        vehicleNumber: 'GR-1234-20',
        inboundCost: 20 + (i % 30),
        ItemCost: isPOD ? 100 + (i % 200) : 0,
        POD: isPOD,
        from: {
          officeId: 'origin1',
          officeName: 'Origin Station',
        },
        to: {
          officeId: station.id,
          officeName: station.name,
        },
        fromOfficeId: 'origin1',
        toOfficeId: station.id,
        typeofParcel: 'Standard',
        hasArrivedAtOffice: false,
        createdAt: Date.now(),
      });
    }

    setManifestDriver({
      driverKey: 'dummy_driver',
      driverName: 'John Doe',
      driverPhoneNumber: '0501234567',
      vehicleNumber: 'GR-1234-20',
      parcels: dummyParcels,
    });
  };

  useEffect(() => {
    fetchOutgoingParcels();
  }, []);

  const fetchOutgoingParcels = async () => {
    const token = authService.getToken();
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.FRONTDESK}/parcels/transfer/outgoing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle paginated response
      const data = response.data;
      if (data && Array.isArray(data.content)) {
        setParcels(data.content);
      } else if (Array.isArray(data)) {
        setParcels(data);
      } else {
        setParcels([]);
      }
    } catch (error: any) {
      console.error("Error fetching outgoing parcels:", error);
      showToast(
        error.response?.data?.message || "Failed to fetch outgoing parcels",
        "error"
      );
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditParcel = (parcel: Parcel) => {
    setEditParcel(parcel);
    setEditForm({
      senderName: parcel.senderName,
      senderPhoneNumber: parcel.senderPhoneNumber,
      receiverName: parcel.receiverName,
      recieverPhoneNumber: parcel.recieverPhoneNumber,
      deliveryAddress: parcel.deliveryAddress,
      parcelDescription: parcel.parcelDescription,
      driverName: parcel.driverName,
      driverPhoneNumber: parcel.driverPhoneNumber,
      vehicleNumber: parcel.vehicleNumber,
      inboundCost: parcel.inboundCost,
      ItemCost: parcel.ItemCost,
      POD: parcel.POD,
    });
  };

  const handlePhoneInput = (field: 'senderPhoneNumber' | 'recieverPhoneNumber' | 'driverPhoneNumber', value: string) => {
    // Only allow digits and + symbol
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure + only appears at the start
    if (cleaned.includes('+')) {
      const plusCount = (cleaned.match(/\+/g) || []).length;
      if (plusCount > 1 || cleaned.indexOf('+') !== 0) {
        cleaned = cleaned.replace(/\+/g, '');
        if (value.startsWith('+')) {
          cleaned = '+' + cleaned;
        }
      }
    }
    
    // Apply length restrictions based on format
    if (cleaned.startsWith('+233')) {
      // +233 format: max 13 chars (+233 + 9 digits)
      const prefix = '+233';
      const digits = cleaned.substring(4).replace(/\D/g, '');
      cleaned = prefix + digits.substring(0, 9);
    } else if (cleaned.startsWith('+')) {
      // Partial +233 entry
      cleaned = cleaned.substring(0, 13);
    } else if (cleaned.startsWith('0')) {
      // 0 format: max 10 chars (0 + 9 digits)
      cleaned = cleaned.substring(0, 10);
    } else {
      // Plain digits: max 9 chars
      cleaned = cleaned.substring(0, 9);
    }
    
    setEditForm({ ...editForm, [field]: cleaned });
  };

  const handleUpdateParcel = async () => {
    if (!editParcel) return;
    
    // Validate phone numbers
    if (editForm.senderPhoneNumber && !validatePhoneNumber(editForm.senderPhoneNumber)) {
      showToast("Invalid sender phone number format", "error");
      return;
    }
    if (editForm.recieverPhoneNumber && !validatePhoneNumber(editForm.recieverPhoneNumber)) {
      showToast("Invalid receiver phone number format", "error");
      return;
    }
    if (editForm.driverPhoneNumber && !validatePhoneNumber(editForm.driverPhoneNumber)) {
      showToast("Invalid driver phone number format", "error");
      return;
    }
    
    setIsUpdating(true);
    const token = authService.getToken();
    
    try {
      // Normalize phone numbers before sending
      const normalizedForm = {
        ...editForm,
        senderPhoneNumber: editForm.senderPhoneNumber ? normalizePhoneNumber(editForm.senderPhoneNumber) : editForm.senderPhoneNumber,
        recieverPhoneNumber: editForm.recieverPhoneNumber ? normalizePhoneNumber(editForm.recieverPhoneNumber) : editForm.recieverPhoneNumber,
        driverPhoneNumber: editForm.driverPhoneNumber ? normalizePhoneNumber(editForm.driverPhoneNumber) : editForm.driverPhoneNumber,
      };
      
      await axios.put(
        `${API_ENDPOINTS.FRONTDESK}/parcel/${editParcel.parcelId}`,
        normalizedForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      showToast("Parcel updated successfully", "success");
      
      // Update the parcel in the list
      setParcels(prev => prev.map(p => 
        p.parcelId === editParcel.parcelId 
          ? { ...p, ...normalizedForm }
          : p
      ));
      
      setEditParcel(null);
      setEditForm({});
    } catch (error: any) {
      console.error("Error updating parcel:", error);
      showToast(
        error.response?.data?.message || "Failed to update parcel",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteParcel = async () => {
    if (!deleteParcel || deleteConfirmText.trim().toLowerCase() !== "delete") return;
    
    setIsDeleting(true);
    const token = authService.getToken();
    
    try {
      await axios.delete(`${API_ENDPOINTS.FRONTDESK}/parcel/${deleteParcel.parcelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      showToast("Parcel deleted successfully", "success");
      setParcels(prev => prev.filter(p => p.parcelId !== deleteParcel.parcelId));
      setDeleteParcel(null);
      setDeleteConfirmText("");
    } catch (error: any) {
      console.error("Error deleting parcel:", error);
      showToast(
        error.response?.data?.message || "Failed to delete parcel",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintParcel = (parcel: Parcel) => {
    // Set dynamic document title for PDF filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const receiverNameSlug = parcel.receiverName.replace(/\s+/g, '_');
    const trackingId = parcel.parcelId.slice(-6);
    const filename = `ParcelLabel_${receiverNameSlug}_${trackingId}_${timestamp}`;
    
    // Temporarily change document title for PDF save
    const originalTitle = document.title;
    document.title = filename;
    
    setPrintParcel(parcel);
    setTimeout(() => {
      window.print();
      // Restore original title after print dialog
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const toggleParcelSelection = (parcelId: string) => {
    const newSelected = new Set(selectedParcels);
    if (newSelected.has(parcelId)) {
      newSelected.delete(parcelId);
    } else {
      newSelected.add(parcelId);
    }
    setSelectedParcels(newSelected);
  };

  const toggleAllParcelsInGroup = (groupParcels: Parcel[]) => {
    const groupParcelIds = groupParcels.map(p => p.parcelId);
    const allSelected = groupParcelIds.every(id => selectedParcels.has(id));
    
    const newSelected = new Set(selectedParcels);
    if (allSelected) {
      groupParcelIds.forEach(id => newSelected.delete(id));
    } else {
      groupParcelIds.forEach(id => newSelected.add(id));
    }
    setSelectedParcels(newSelected);
  };

  const handleBulkPrintLabels = (groupParcels: Parcel[]) => {
    const selectedParcelsList = groupParcels.filter(p => selectedParcels.has(p.parcelId));
    if (selectedParcelsList.length === 0) {
      showToast("Please select at least one parcel to print", "warning");
      return;
    }

    // Set dynamic document title for PDF filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ParcelLabels_Bulk_${selectedParcelsList.length}_items_${timestamp}`;
    
    const originalTitle = document.title;
    document.title = filename;
    
    setBulkPrintParcels(selectedParcelsList);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const handlePrintManifest = (group: { driverKey: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] }) => {
    // Set dynamic document title for PDF filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const driverNameSlug = group.driverName.replace(/\s+/g, '_');
    const vehicleSlug = group.vehicleNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Manifest_${driverNameSlug}_${vehicleSlug}_${timestamp}`;
    
    // Temporarily change document title for PDF save
    const originalTitle = document.title;
    document.title = filename;
    
    setManifestDriver(group);
    setTimeout(() => {
      window.print();
      // Restore original title after print dialog
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const filteredParcels = parcels.filter((parcel) => {
    const query = searchQuery.toLowerCase();
    return (
      parcel.parcelId?.toLowerCase().includes(query) ||
      parcel.receiverName?.toLowerCase().includes(query) ||
      parcel.senderName?.toLowerCase().includes(query) ||
      parcel.recieverPhoneNumber?.toLowerCase().includes(query) ||
      parcel.driverName?.toLowerCase().includes(query)
    );
  });

  // Group parcels by driver (using phone number and vehicle number as unique identifier)
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

  const driverGroups = Object.values(groupedByDriver);
  
  // Pagination
  const totalPages = Math.ceil(driverGroups.length / driversPerPage);
  const startIndex = (currentPage - 1) * driversPerPage;
  const endIndex = startIndex + driversPerPage;
  const paginatedDriverGroups = driverGroups.slice(startIndex, endIndex);

  const toggleDriver = (driverKey: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverKey)) {
      newExpanded.delete(driverKey);
    } else {
      newExpanded.add(driverKey);
    }
    setExpandedDrivers(newExpanded);
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-neutral-800">
                Outgoing Parcels
              </h1>
              <p className="text-xs text-[#5d5d5d]">
                View all parcels sent from this station
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={generateDummyManifest}
                variant="outline"
                className="flex items-center gap-2 border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
              >
                <FileTextIcon className="h-4 w-4" />
                <span>Test Manifest (50 items)</span>
              </Button>
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
        </div>

        {/* Search */}
        <Card className="border border-[#d1d1d1] bg-white">
          <CardContent className="p-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by tracking number, receiver, sender, phone, or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#d1d1d1]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <PackageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-[#5d5d5d]">Total Outgoing</p>
                  <p className="text-xl font-bold text-neutral-800">{parcels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-3">
                  <TruckIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-[#5d5d5d]">Total Drivers</p>
                  <p className="text-xl font-bold text-neutral-800">{driverGroups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-[#5d5d5d]">In Transit</p>
                  <p className="text-xl font-bold text-neutral-800">
                    {parcels.filter(p => !p.hasArrivedAtOffice).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-3">
                  <PackageIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-[#5d5d5d]">Arrived</p>
                  <p className="text-xl font-bold text-neutral-800">
                    {parcels.filter(p => p.hasArrivedAtOffice).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcels List - Grouped by Driver with Accordion */}
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
              <p className="text-neutral-700 font-medium">No outgoing parcels found</p>
              <p className="text-sm text-[#5d5d5d] mt-2">
                {searchQuery ? "Try adjusting your search" : "Parcels sent from this station will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedDriverGroups.map((group) => {
                const isExpanded = expandedDrivers.has(group.driverKey);
                return (
                  <Card key={group.driverKey} className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-0">
                      {/* Driver Header - Clickable */}
                      <button
                        onClick={() => toggleDriver(group.driverKey)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-100 p-2">
                            <TruckIcon className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-base font-bold text-neutral-800">{group.driverName || "Unknown Driver"}</p>
                            <div className="flex items-center gap-3 text-xs text-[#5d5d5d]">
                              {group.driverPhoneNumber && (
                                <span className="flex items-center gap-1">
                                  <PhoneIcon className="h-3 w-3" />
                                  {group.driverPhoneNumber}
                                </span>
                              )}
                              {group.vehicleNumber && (
                                <span className="flex items-center gap-1">
                                  <TruckIcon className="h-3 w-3" />
                                  {group.vehicleNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={(e) => { e.stopPropagation(); handlePrintManifest(group); }}
                            variant="outline"
                            size="sm"
                            className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 flex items-center gap-2"
                          >
                            <FileTextIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">Print Manifest</span>
                          </Button>
                          <div className="text-right">
                            <p className="text-xs text-[#5d5d5d]">Parcels</p>
                            <p className="text-xl font-bold text-[#ea690c]">{group.parcels.length}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="h-5 w-5 text-[#5d5d5d]" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-[#5d5d5d]" />
                          )}
                        </div>
                      </button>

                      {/* Parcels Table - Collapsible */}
                      {isExpanded && (
                        <div className="border-t border-[#e4e4e4] p-6">
                          {/* Bulk Actions Bar */}
                          <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-[#d1d1d1]">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={group.parcels.every(p => selectedParcels.has(p.parcelId))}
                                onChange={() => toggleAllParcelsInGroup(group.parcels)}
                                className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                              />
                              <span className="text-sm font-medium text-neutral-800">
                                {selectedParcels.size > 0 ? `${selectedParcels.size} parcel(s) selected` : 'Select all'}
                              </span>
                            </div>
                            {selectedParcels.size > 0 && (
                              <Button
                                onClick={() => handleBulkPrintLabels(group.parcels)}
                                variant="outline"
                                size="sm"
                                className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 flex items-center gap-2"
                              >
                                <PrinterIcon className="h-4 w-4" />
                                <span className="text-xs font-medium">Print Selected Labels ({selectedParcels.size})</span>
                              </Button>
                            )}
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-[#d1d1d1]">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-[#d1d1d1]">
                                  <th className="px-6 py-4 text-center text-sm font-bold text-neutral-800 uppercase tracking-wide">
                                    <input
                                      type="checkbox"
                                      checked={group.parcels.every(p => selectedParcels.has(p.parcelId))}
                                      onChange={() => toggleAllParcelsInGroup(group.parcels)}
                                      className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                    />
                                  </th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-800 uppercase tracking-wide">Receiver</th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-800 uppercase tracking-wide">Phone</th>
                                  <th className="px-6 py-4 text-center text-sm font-bold text-neutral-800 uppercase tracking-wide">Type</th>
                                  <th className="px-6 py-4 text-center text-sm font-bold text-neutral-800 uppercase tracking-wide">Status</th>
                                  <th className="px-6 py-4 text-right text-sm font-bold text-neutral-800 uppercase tracking-wide">Amount</th>
                                  <th className="px-6 py-4 text-center text-sm font-bold text-neutral-800 uppercase tracking-wide">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-[#e4e4e4]">
                                {group.parcels.map((parcel, index) => (
                                  <tr key={parcel.parcelId} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="px-6 py-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedParcels.has(parcel.parcelId)}
                                        onChange={() => toggleParcelSelection(parcel.parcelId)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                                      />
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm font-semibold text-neutral-800">{parcel.receiverName}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm text-[#5d5d5d]">
                                        {parcel.recieverPhoneNumber}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                        parcel.typeofParcel === "ONLINE" || parcel.POD
                                          ? "bg-purple-100 text-purple-700 border border-purple-300"
                                          : "bg-blue-100 text-blue-700 border border-blue-300"
                                      }`}>
                                        {parcel.typeofParcel === "ONLINE" || parcel.POD ? "POD" : "Regular"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                        parcel.hasArrivedAtOffice
                                          ? "bg-green-100 text-green-800 border border-green-300"
                                          : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                      }`}>
                                        {parcel.hasArrivedAtOffice ? "Arrived" : "In Transit"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                      <div className="text-right">
                                        <div className="text-xs text-[#5d5d5d]">Transport: GHC {(parcel.inboundCost || 0).toFixed(2)}</div>
                                        {(parcel.POD || parcel.typeofParcel === "ONLINE") && parcel.ItemCost > 0 && (
                                          <div className="text-xs text-[#5d5d5d]">Item: GHC {(parcel.ItemCost || 0).toFixed(2)}</div>
                                        )}
                                        <div className="text-base font-bold text-[#ea690c]">
                                          GHC {((parcel.inboundCost || 0) + ((parcel.POD || parcel.typeofParcel === "ONLINE") ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <Button
                                          onClick={() => setViewParcel(parcel)}
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-3 border-[#ea690c] text-[#ea690c] hover:bg-orange-50 hover:border-[#ea690c] text-xs font-medium"
                                        >
                                          View
                                        </Button>
                                        {!parcel.hasArrivedAtOffice && (
                                          <>
                                            <Button
                                              onClick={() => handlePrintParcel(parcel)}
                                              variant="outline"
                                              size="sm"
                                              className="h-8 w-8 p-0 border-[#d1d1d1] text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                              title="Print Label"
                                            >
                                              <PrinterIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              onClick={() => handleEditParcel(parcel)}
                                              variant="outline"
                                              size="sm"
                                              className="h-8 w-8 p-0 border-[#d1d1d1] text-green-600 hover:bg-green-50 hover:border-green-300"
                                              title="Edit Parcel"
                                            >
                                              <Edit2Icon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              onClick={() => { setDeleteParcel(parcel); setDeleteConfirmText(""); }}
                                              variant="outline"
                                              size="sm"
                                              className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                              title="Delete Parcel"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="border border-[#d1d1d1] bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#5d5d5d]">
                      Showing {startIndex + 1}-{Math.min(endIndex, driverGroups.length)} of {driverGroups.length} drivers
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="border-[#d1d1d1]"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={currentPage === page ? "bg-[#ea690c] text-white" : "border-[#d1d1d1]"}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="border-[#d1d1d1]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Edit Parcel Modal */}
        {editParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Edit2Icon className="w-5 h-5 text-[#ea690c]" />
                    <h3 className="text-lg font-bold text-neutral-800">Edit Parcel</h3>
                  </div>
                  <button
                    onClick={() => { setEditParcel(null); setEditForm({}); }}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-800">{editParcel.parcelId}</p>
                  </div>

                  {/* Sender Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Sender Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Sender Name</label>
                        <Input
                          value={editForm.senderName || ""}
                          onChange={(e) => setEditForm({ ...editForm, senderName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Sender Phone</label>
                        <Input
                          value={editForm.senderPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('senderPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Receiver Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Receiver Name</label>
                        <Input
                          value={editForm.receiverName || ""}
                          onChange={(e) => setEditForm({ ...editForm, receiverName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Receiver Phone</label>
                        <Input
                          value={editForm.recieverPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('recieverPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">Delivery Address</label>
                      <Input
                        value={editForm.deliveryAddress || ""}
                        onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                        className="border-[#d1d1d1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">Parcel Description</label>
                      <Input
                        value={editForm.parcelDescription || ""}
                        onChange={(e) => setEditForm({ ...editForm, parcelDescription: e.target.value })}
                        className="border-[#d1d1d1]"
                      />
                    </div>
                  </div>

                  {/* Driver Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Driver Details</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Driver Name</label>
                        <Input
                          value={editForm.driverName || ""}
                          onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Driver Phone</label>
                        <Input
                          value={editForm.driverPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('driverPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Vehicle Number</label>
                        <Input
                          value={editForm.vehicleNumber || ""}
                          onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Costs</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Transportation Cost</label>
                        <Input
                          type="number"
                          value={editForm.inboundCost || 0}
                          onChange={(e) => setEditForm({ ...editForm, inboundCost: parseFloat(e.target.value) || 0 })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Item Cost</label>
                        <Input
                          type="number"
                          value={editForm.ItemCost || 0}
                          onChange={(e) => setEditForm({ ...editForm, ItemCost: parseFloat(e.target.value) || 0 })}
                          className="border-[#d1d1d1]"
                          disabled={!editForm.POD}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.POD || false}
                        onChange={(e) => setEditForm({ ...editForm, POD: e.target.checked, ItemCost: e.target.checked ? editForm.ItemCost : 0 })}
                        className="h-4 w-4"
                      />
                      <label className="text-xs font-semibold text-neutral-800">
                        Enable POD (Payment on Delivery)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#d1d1d1]">
                    <Button
                      onClick={() => { setEditParcel(null); setEditForm({}); }}
                      variant="outline"
                      className="flex-1 border border-[#d1d1d1]"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateParcel}
                      disabled={isUpdating}
                      className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-bold text-neutral-800">Delete Parcel</h3>
                  </div>
                  <button
                    onClick={() => { setDeleteParcel(null); setDeleteConfirmText(""); }}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-800">{deleteParcel.parcelId}</p>
                    <p className="text-xs text-red-600 mt-0.5">{deleteParcel.receiverName}</p>
                  </div>

                  <p className="text-sm text-neutral-700">
                    This will permanently delete this parcel. This action cannot be undone.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-1">
                      Type <span className="font-mono text-red-600">delete</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type delete here..."
                      className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => { setDeleteParcel(null); setDeleteConfirmText(""); }}
                      variant="outline"
                      className="flex-1 border border-[#d1d1d1]"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteParcel}
                      disabled={deleteConfirmText.trim().toLowerCase() !== "delete" || isDeleting}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Confirm Delete"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Print Labels Modal */}
        {bulkPrintParcels && (
          <>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #bulk-labels-print, #bulk-labels-print * {
                  visibility: visible;
                }
                #bulk-labels-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                @page {
                  size: A4 landscape;
                  margin: 8mm;
                }
                .label-page-break {
                  page-break-after: always;
                }
              }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">Bulk Print Labels ({bulkPrintParcels.length} items)</h3>
                  <Button
                    onClick={() => setBulkPrintParcels(null)}
                    variant="outline"
                    className="border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="p-6" id="bulk-labels-print">
                  {bulkPrintParcels.map((parcel, index) => (
                    <div key={`${parcel.parcelId}-${index}`} className={index < bulkPrintParcels.length - 1 ? 'label-page-break mb-8' : ''}>
                      <ParcelLabel parcel={parcel} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Manifest Print Modal */}
        {manifestDriver && (
          <>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #manifest-print, #manifest-print * {
                  visibility: visible;
                }
                #manifest-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
              }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">Driver Manifest</h3>
                  <Button
                    onClick={() => setManifestDriver(null)}
                    variant="outline"
                    className="border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="p-6" id="manifest-print">
                  <DriverManifest driver={manifestDriver} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* View Parcel Details Modal */}
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
                  {/* Basic Information */}
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

                  {/* Receiver Information */}
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

                  {/* Sender Information */}
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

                  {/* Route Information */}
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

                  {/* Driver Information */}
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

                  {/* Parcel Description */}
                  {viewParcel.parcelDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Parcel Description</h4>
                      <p className="text-sm text-neutral-700">{viewParcel.parcelDescription}</p>
                    </div>
                  )}

                  {/* Cost Information */}
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

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#d1d1d1] flex gap-3">
                    {!viewParcel.hasArrivedAtOffice && (
                      <>
                        <Button
                          onClick={() => { handlePrintParcel(viewParcel); setViewParcel(null); }}
                          variant="outline"
                          className="flex-1 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                        >
                          <PrinterIcon className="h-4 w-4 mr-2" />
                          Print Label
                        </Button>
                        <Button
                          onClick={() => { handleEditParcel(viewParcel); setViewParcel(null); }}
                          variant="outline"
                          className="flex-1 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                        >
                          <Edit2Icon className="h-4 w-4 mr-2" />
                          Edit Parcel
                        </Button>
                      </>
                    )}
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

        {/* Print Preview Modal */}
        {printParcel && (
          <>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #parcel-label-print, #parcel-label-print * {
                  visibility: visible;
                }
                #parcel-label-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  page-break-after: avoid;
                  page-break-before: avoid;
                  page-break-inside: avoid;
                }
                @page {
                  size: A4 landscape;
                  margin: 8mm;
                }
                html, body {
                  height: 100%;
                  overflow: hidden;
                }
              }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">Print Parcel Label</h3>
                  <Button
                    onClick={() => setPrintParcel(null)}
                    variant="outline"
                    className="border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="p-6" id="parcel-label-print">
                  <ParcelLabel parcel={printParcel} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Driver Manifest Component for printing
interface DriverManifestProps {
  driver: {
    driverKey: string;
    driverName: string;
    driverPhoneNumber: string;
    vehicleNumber: string;
    parcels: Parcel[];
  };
}

const DriverManifest: React.FC<DriverManifestProps> = ({ driver }) => {
  // Group parcels by destination station
  const parcelsByStation = driver.parcels.reduce((acc, parcel) => {
    const stationKey = parcel.toOfficeId || 'unknown';
    const stationName = parcel.to?.officeName || 'Unknown Station';
    if (!acc[stationKey]) {
      acc[stationKey] = {
        stationName,
        parcels: [],
      };
    }
    acc[stationKey].parcels.push(parcel);
    return acc;
  }, {} as Record<string, { stationName: string; parcels: Parcel[] }>);

  const stations = Object.values(parcelsByStation);

  return (
    <div className="space-y-8">
      {stations.map((station, stationIndex) => {
        const totalAmount = station.parcels.reduce((sum, p) => sum + (p.inboundCost || 0) + (p.POD ? (p.ItemCost || 0) : 0), 0);
        const podCount = station.parcels.filter(p => p.POD).length;
        const regularCount = station.parcels.length - podCount;

        return (
          <div key={stationIndex} className="border-2 border-black p-6" style={{ pageBreakAfter: stationIndex < stations.length - 1 ? 'always' : 'auto' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src="/logo-1.png"
                  alt="M&M Logo"
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-black">
                    Mealex & Mailex (M&M)
                  </h1>
                  <p className="text-sm text-black">Parcel Delivery Manifest</p>
                </div>
              </div>
            </div>

            {/* Manifest Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-black">
              <div>
                <p className="text-sm font-bold text-black mb-2">DRIVER INFORMATION</p>
                <p className="text-sm text-black"><span className="font-bold">Name:</span> {driver.driverName}</p>
                <p className="text-sm text-black"><span className="font-bold">Phone:</span> {driver.driverPhoneNumber}</p>
                <p className="text-sm text-black"><span className="font-bold">Vehicle:</span> {driver.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-black mb-2">DESTINATION STATION</p>
                <p className="text-lg font-bold text-black">{station.stationName}</p>
                <p className="text-sm text-black mt-2"><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-black"><span className="font-bold">Time:</span> {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b-2 border-black">
              <div className="bg-gray-100 p-3 border border-black">
                <p className="text-xs font-bold text-black">TOTAL PARCELS</p>
                <p className="text-2xl font-bold text-black">{station.parcels.length}</p>
              </div>
              <div className="bg-blue-100 p-3 border border-black">
                <p className="text-xs font-bold text-black">REGULAR</p>
                <p className="text-2xl font-bold text-black">{regularCount}</p>
              </div>
              <div className="bg-purple-100 p-3 border border-black">
                <p className="text-xs font-bold text-black">POD</p>
                <p className="text-2xl font-bold text-black">{podCount}</p>
              </div>
              <div className="bg-green-100 p-3 border border-black">
                <p className="text-xs font-bold text-black">TOTAL VALUE</p>
                <p className="text-xl font-bold text-black">GHC {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Parcels Table */}
            <table className="w-full border-2 border-black">
              <thead>
                <tr className="bg-gray-200 border-b-2 border-black">
                  <th className="border-r border-black px-2 py-2 text-left text-xs font-bold text-black">#</th>
                  <th className="border-r border-black px-2 py-2 text-center text-xs font-bold text-black">✓</th>
                  <th className="border-r border-black px-2 py-2 text-left text-xs font-bold text-black">TRACKING ID</th>
                  <th className="border-r border-black px-2 py-2 text-left text-xs font-bold text-black">RECEIVER</th>
                  <th className="border-r border-black px-2 py-2 text-left text-xs font-bold text-black">PHONE</th>
                  <th className="border-r border-black px-2 py-2 text-left text-xs font-bold text-black">DESCRIPTION</th>
                  <th className="border-r border-black px-2 py-2 text-center text-xs font-bold text-black">TYPE</th>
                  <th className="px-2 py-2 text-right text-xs font-bold text-black">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {station.parcels.map((parcel, index) => {
                  const shortTrackingId = parcel.parcelId.slice(-6);
                  const truncatedDescription = parcel.parcelDescription && parcel.parcelDescription.length > 30 
                    ? parcel.parcelDescription.substring(0, 30) + '...' 
                    : parcel.parcelDescription || '-';
                  
                  return (
                    <tr key={parcel.parcelId} className="border-b border-black">
                      <td className="border-r border-black px-2 py-2 text-xs text-black">{index + 1}</td>
                      <td className="border-r border-black px-2 py-2 text-center">
                        <div className="w-4 h-4 border-2 border-black mx-auto"></div>
                      </td>
                      <td className="border-r border-black px-2 py-2 text-xs font-semibold text-black">{shortTrackingId}</td>
                      <td className="border-r border-black px-2 py-2 text-xs text-black">{parcel.receiverName}</td>
                      <td className="border-r border-black px-2 py-2 text-xs text-black">{parcel.recieverPhoneNumber}</td>
                      <td className="border-r border-black px-2 py-2 text-xs text-black">{truncatedDescription}</td>
                      <td className="border-r border-black px-2 py-2 text-center text-xs text-black">
                        <span className={`inline-block px-2 py-0.5 rounded ${parcel.POD ? 'bg-purple-200' : 'bg-blue-200'}`}>
                          {parcel.POD ? 'POD' : 'REG'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-right font-semibold text-black">
                        GHC {((parcel.inboundCost || 0) + (parcel.POD ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 border-t-2 border-black">
                  <td colSpan={7} className="border-r border-black px-2 py-2 text-sm font-bold text-black text-right">TOTAL:</td>
                  <td className="px-2 py-2 text-sm font-bold text-black text-right">GHC {totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black">
              <div>
                <p className="text-sm font-bold text-black mb-8">DRIVER SIGNATURE</p>
                <div className="border-b-2 border-black mb-2"></div>
                <p className="text-xs text-black">Name: {driver.driverName}</p>
                <p className="text-xs text-black">Date: _________________</p>
              </div>
              <div>
                <p className="text-sm font-bold text-black mb-8">RECEIVER SIGNATURE</p>
                <div className="border-b-2 border-black mb-2"></div>
                <p className="text-xs text-black">Name: _________________</p>
                <p className="text-xs text-black">Date: _________________</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Parcel Label Component for printing
interface ParcelLabelProps {
  parcel: Parcel;
}

const ParcelLabel: React.FC<ParcelLabelProps> = ({ parcel }) => {
  return (
    <div className="bg-white border-2 border-black p-4 print:border print:p-4">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img
            src="/logo-1.png"
            alt="M&M Logo"
            className="h-16 w-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-black">
              Mealex & Mailex (M&M)
            </h1>
            <p className="text-base text-black">Parcel Delivery System</p>
          </div>
        </div>
      </div>

      {/* Tracking Number */}
      <div className="text-center mb-3 bg-black text-white py-3 px-4">
        <p className="text-sm font-semibold mb-0.5">TRACKING NUMBER</p>
        <p className="text-4xl font-bold tracking-wider">{parcel.parcelId}</p>
      </div>

      {/* Sender & Receiver */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="border-2 border-black p-2">
          <p className="text-base text-black mb-1">
            <span className="font-bold">SENDER:</span> {parcel.senderName}
          </p>
          <p className="text-base text-black">
            <span className="font-bold">CONTACT:</span> {parcel.senderPhoneNumber}
          </p>
        </div>
        <div className="border-2 border-black p-2">
          <p className="text-base text-black mb-1">
            <span className="font-bold">RECEIVER:</span> {parcel.receiverName}
          </p>
          <p className="text-base text-black">
            <span className="font-bold">CONTACT:</span> {parcel.recieverPhoneNumber}
          </p>
        </div>
      </div>

      {/* Delivery Address */}
      {parcel.deliveryAddress && (
        <div className="border-2 border-black p-2 mb-3">
          <p className="text-sm font-bold text-black">
            DELIVERY ADDRESS: <span className="font-normal text-xl">{parcel.deliveryAddress}</span>
          </p>
        </div>
      )}

      {/* Item Description */}
      {parcel.parcelDescription && (
        <div className="border-2 border-black p-2 mb-3">
          <p className="text-sm font-bold text-black">
            ITEM DESCRIPTION: <span className="font-normal text-base">{parcel.parcelDescription}</span>
          </p>
        </div>
      )}

      {/* Payment Details */}
      <div className="border-2 border-black p-2 mb-3">
        <p className="text-sm font-bold text-black mb-1">PAYMENT DETAILS</p>
        <div className="space-y-1 text-base">
          <div className="flex justify-between">
            <span className="text-black">Transportation Cost:</span>
            <span className="font-semibold text-black">
              GHC {(parcel.inboundCost || 0).toFixed(2)}
            </span>
          </div>
          {parcel.POD && (
            <div className="flex justify-between">
              <span className="text-black">Item Cost (POD):</span>
              <span className="font-semibold text-black">
                GHC {(parcel.ItemCost || 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-1 mt-1">
            <span className="font-bold text-black">TOTAL AMOUNT:</span>
            <span className="font-bold text-xl text-black">
              GHC {((parcel.inboundCost || 0) + (parcel.POD ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Parcel Type Badge - Only show for POD parcels */}
      {parcel.POD && (
        <div className="text-center mb-2">
          <span className="inline-block bg-black text-white px-4 py-2 text-base font-bold">
            POD PARCEL
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-black text-center">
        <p className="text-sm text-black">
          Date: {new Date(parcel.createdAt).toLocaleDateString()} | Time: {new Date(parcel.createdAt).toLocaleTimeString()}
        </p>
        <p className="text-sm text-black mt-0.5">
          For inquiries, contact M&M Parcel Services
        </p>
      </div>
    </div>
  );
};
