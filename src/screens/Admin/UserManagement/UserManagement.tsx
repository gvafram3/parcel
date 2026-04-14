import { useState, useEffect } from "react";
import { Plus, Phone, Mail, Building2, X, Loader, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from "../../../utils/dataHelpers";
import { useLocation } from "../../../contexts/LocationContext";
import { useUser } from "../../../contexts/UserContext";
import { useToast } from "../../../components/ui/toast";
import userService from "../../../services/userService";

const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    MANAGER: "bg-blue-100 text-blue-800",
    FRONTDESK: "bg-green-100 text-green-800",
    RIDER: "bg-purple-100 text-purple-800",
    CALLCENTER: "bg-orange-100 text-orange-800",
};

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-yellow-100 text-yellow-800",
    DELETED: "bg-red-100 text-red-800",
};

export const UserManagement = (): JSX.Element => {
    const { stations } = useLocation();
    const { users, loading: loadingUsers, pagination, refreshUsers } = useUser();
    const { showToast } = useToast();
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ userId: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterRole, setFilterRole] = useState("");
    const [filterStation, setFilterStation] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: "FRONTDESK",
        officeId: "",
    });

    // NEW: State for adding user to station
    const [showAddToStationModal, setShowAddToStationModal] = useState(false);
    const [userToAddToStation, setUserToAddToStation] = useState<{ userId: string; name: string; phoneNumber?: string } | null>(null);
    const [selectedOfficeForAdd, setSelectedOfficeForAdd] = useState<string>("");
    const [isAddingToStation, setIsAddingToStation] = useState(false);

    // Helper function to get office name from officeId
    const getOfficeName = (user: any): string => {
        // If office object exists with name, use it
        if (user.office?.name) {
            return user.office.name;
        }
        // If only officeId exists, look it up in stations
        if (user.officeId) {
            const station = stations.find(s => s.id === user.officeId);
            return station?.name || user.officeId; // Show ID if station not found
        }
        return "N/A";
    };

    // Helper function to get office ID for filtering
    const getUserOfficeId = (user: any): string | undefined => {
        return user.office?.id || user.officeId;
    };

    // Load users when component mounts
    useEffect(() => {
        refreshUsers(pagination.page, pagination.size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredUsers = users.filter((user) => {
        if (filterRole && user.role !== filterRole) return false;
        if (filterStation && getUserOfficeId(user) !== filterStation) return false;
        return true;
    });

    // Initiate delete with confirmation modal
    const handleInitiateDelete = (user: { userId: string; name: string }) => {
        setUserToDelete(user);
        setShowDeleteConfirmModal(true);
    };

    // Confirm and delete user
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const response = await userService.deleteUser(userToDelete.userId);

            if (response.success) {
                showToast(`User "${userToDelete.name}" deleted successfully!`, "success");
                setShowDeleteConfirmModal(false);
                setUserToDelete(null);
                // Refresh users list
                await refreshUsers(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to delete user", "error");
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            showToast("Failed to delete user. Please try again.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteConfirmModal = () => {
        setShowDeleteConfirmModal(false);
        setUserToDelete(null);
    };

    const handleAddUser = async () => {
        // Validation
        if (!formData.name.trim()) {
            showToast("Name is required", "error");
            return;
        }

        if (!formData.email.trim()) {
            showToast("Email is required", "error");
            return;
        }

        // Password is optional according to API spec, but if provided, validate length
        if (formData.password && formData.password.trim().length > 0 && formData.password.length < 6) {
            showToast("Password must be at least 6 characters if provided", "error");
            return;
        }

        if (!formData.phoneNumber.trim()) {
            showToast("Phone number is required", "error");
            return;
        }

        // Format and validate phone number
    const formattedPhone = formData.phoneNumber.trim();
    if (!validatePhoneNumber(formattedPhone)) {
        showToast("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX", "error");
        return;
    }

        if (!formData.officeId) {
            showToast("Office/Station is required", "error");
            return;
        }

        setIsCreating(true);
        try {
            // Prepare request payload - password is optional
            const requestPayload: any = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phoneNumber: formattedPhone,
                role: formData.role as "ADMIN" | "RIDER" | "FRONTDESK" | "MANAGER" | "CALLCENTER",
                officeId: formData.officeId,
            };

            // Only include password if provided
            if (formData.password && formData.password.trim().length > 0) {
                requestPayload.password = formData.password;
            }

            const response = await userService.createUser(requestPayload);

            if (response.success) {
                showToast(`User "${formData.name}" created successfully!`, "success");
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    phoneNumber: "",
                    role: "FRONTDESK",
                    officeId: "",
                });
                setShowAddForm(false);
                // Refresh users list
                await refreshUsers(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to create user", "error");
            }
        } catch (error) {
            console.error("Failed to create user:", error);
            showToast("Failed to create user. Please try again.", "error");
        } finally {
            setIsCreating(false);
        }
    };

    // NEW: Open modal to add user to station
    const handleInitiateAddToStation = (user: { userId: string; name: string; phoneNumber?: string }) => {
        setUserToAddToStation(user);
        // default to first station if available
        setSelectedOfficeForAdd(stations.length > 0 ? stations[0].id : "");
        setShowAddToStationModal(true);
    };

    // NEW: Confirm add user to station - POST /api-user/add-user-office
    const handleConfirmAddToStation = async () => {
        if (!userToAddToStation) return;
        if (!selectedOfficeForAdd) {
            showToast("Please select an office/station", "warning");
            return;
        }
        if (!userToAddToStation.phoneNumber) {
            showToast("User has no phone number on file", "error");
            return;
        }

        setIsAddingToStation(true);
        try {
            const payload = {
                officeId: selectedOfficeForAdd,
                userPhoneNumber: userToAddToStation.phoneNumber,
            };

            const response = await userService.addUserToOffice(payload);

            if (response.success) {
                showToast(response.message || `User ${userToAddToStation.name} added to station successfully`, "success");
                // refresh users list to reflect new office assignment
                await refreshUsers(pagination.page, pagination.size);
                setShowAddToStationModal(false);
                setUserToAddToStation(null);
            } else {
                showToast(response.message || "Failed to add user to station", "error");
            }
        } catch (error) {
            console.error("Add user to station error:", error);
            showToast("Failed to add user to station. Please try again.", "error");
        } finally {
            setIsAddingToStation(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1"></div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New User
                        </Button>
                    </div>

                    {/* Add User Dialog */}
                    {showAddForm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-2xl rounded-lg border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-neutral-800">Create New User</h3>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setFormData({
                                                    name: "",
                                                    email: "",
                                                    password: "",
                                                    phoneNumber: "",
                                                    role: "FRONTDESK",
                                                    officeId: "",
                                                });
                                            }}
                                            className="text-[#9a9a9a] hover:text-neutral-800"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Name <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Full name"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Email <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@example.com"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Phone Number <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                                                    +233
                                                </span>
                                                <Input
                                                    type="tel"
                                                    value={formData.phoneNumber.startsWith("+233") ? formData.phoneNumber.substring(4) : formData.phoneNumber}
                                                    onChange={(e) => {
                                                        const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
                                                        const normalized = normalizePhoneNumber(digits);
                                                        setFormData({ ...formData, phoneNumber: normalized });
                                                    }}
                                                    placeholder="0XXXXXXXXX or XXXXXXXXX"
                                                    className="pl-14 pr-3 border border-[#d1d1d1] w-full rounded-lg bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                                                    maxLength={10}
                                                />
                                            </div>
                                            <p className="text-xs text-[#5d5d5d] mt-1">Enter 10 digits (e.g. 0550123456 or 550123456)</p>
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Password <span className="text-[#9a9a9a] text-xs">(Optional)</span>
                                            </Label>
                                            <Input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Minimum 6 characters if provided"
                                                className="border border-[#d1d1d1]"
                                            />
                                            <p className="text-xs text-[#5d5d5d] mt-1">Optional. If provided, must be at least 6 characters</p>
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Role <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "RIDER" | "FRONTDESK" | "MANAGER" })}
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="FRONTDESK">Front Desk</option>
                                                <option value="RIDER">Rider</option>
                                                <option value="CALLCENTER">Caller</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Office/Station <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <select
                                                value={formData.officeId}
                                                onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">Select an office/station</option>
                                                {stations.map((station) => (
                                                    <option key={station.id} value={station.id}>
                                                        {station.name} {station.locationName && `- ${station.locationName}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {stations.length === 0 && (
                                                <p className="text-xs text-orange-600 mt-2">
                                                    No offices available. Create an office first.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={handleAddUser}
                                            disabled={
                                                !formData.name.trim() ||
                                                !formData.email.trim() ||
                                                !formData.phoneNumber.trim() ||
                                                !formData.officeId ||
                                                isCreating
                                            }
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create User"
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setFormData({
                                                    name: "",
                                                    email: "",
                                                    password: "",
                                                    phoneNumber: "",
                                                    role: "FRONTDESK",
                                                    officeId: "",
                                                });
                                            }}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1]"
                                            disabled={isCreating}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Role
                                    </Label>
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="FRONTDESK">Front Desk</option>
                                        <option value="RIDER">Rider</option>
                                        <option value="CALLCENTER">Caller</option>
                                    </select>
                                </div>

                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Station
                                    </Label>
                                    <select
                                        value={filterStation}
                                        onChange={(e) => setFilterStation(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Stations</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirmModal && userToDelete && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-red-50 rounded-lg flex-shrink-0">
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-neutral-800 mb-2">Delete User?</h2>
                                            <p className="text-sm text-neutral-700 mb-1">
                                                Are you sure you want to delete this user?
                                            </p>
                                            <div className="bg-gray-50 rounded p-3 mt-3">
                                                <p className="text-sm font-semibold text-neutral-800">{userToDelete.name}</p>
                                                <p className="text-xs text-[#5d5d5d]">User ID: {userToDelete.userId}</p>
                                            </div>
                                            <p className="text-xs text-red-600 mt-3 font-semibold">
                                                ⚠️ This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleCloseDeleteConfirmModal}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleConfirmDelete}
                                            className="flex-1 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} />
                                                    Delete User
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Users Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {loadingUsers ? (
                                <div className="p-12 text-center">
                                    <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                    <p className="text-neutral-700">Loading users...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="overflow-hidden">
                                            <table className="min-w-full divide-y divide-[#d1d1d1]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Contact
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Station
                                                        </th>
                                                        <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                                    {filteredUsers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="py-12 text-center">
                                                                <p className="text-sm text-neutral-500">
                                                                    {users.length === 0 ? "No users found" : "No users found matching filters"}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredUsers.map((user, index) => (
                                                            <tr
                                                                key={user.userId}
                                                                className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                            >
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <span className="text-xs sm:text-sm font-medium text-neutral-800">{user.name}</span>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {user.email && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Mail size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                                <span className="text-xs sm:text-sm text-neutral-700 truncate">{user.email}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                            <span className="text-xs sm:text-sm text-neutral-700">{formatPhoneNumber(user.phoneNumber)}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <Badge className={roleColors[user.role] || "bg-gray-100 text-gray-800"}>
                                                                        <span className="text-xs">{user.role.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <Badge className={statusColors[user.status] || "bg-gray-100 text-gray-800"}>
                                                                        <span className="text-xs">{user.status}</span>
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Building2 size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                        <span className="text-xs sm:text-sm text-neutral-700 truncate">
                                                                            {getOfficeName(user)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => handleInitiateDelete({ userId: user.userId, name: user.name })}
                                                                        className="text-[#e22420] hover:bg-red-50 p-2 rounded transition-colors mr-2"
                                                                        title="Delete user"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                    {(user.role === "RIDER" || !getUserOfficeId(user)) && (
                                                                        <button
                                                                            onClick={() => handleInitiateAddToStation({ userId: user.userId, name: user.name, phoneNumber: user.phoneNumber })}
                                                                            className="text-[#ea690c] hover:bg-orange-50 p-2 rounded transition-colors"
                                                                            title="Add user to station"
                                                                        >
                                                                            <Building2 size={16} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!loadingUsers && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-[#d1d1d1] flex items-center justify-between">
                                    <div className="text-sm text-neutral-700">
                                        Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} users
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => refreshUsers(pagination.page - 1, pagination.size)}
                                            disabled={pagination.page === 0 || loadingUsers}
                                            variant="outline"
                                            size="sm"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => refreshUsers(pagination.page + 1, pagination.size)}
                                            disabled={pagination.page >= pagination.totalPages - 1 || loadingUsers}
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

            {/* NEW: Add to Station Modal */}
            {showAddToStationModal && userToAddToStation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-2">Add User to Station</h2>
                                    <p className="text-sm text-neutral-700 mb-3">Add <span className="font-semibold">{userToAddToStation.name}</span> to an office/station.</p>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Select Office/Station</label>
                                        <select
                                            value={selectedOfficeForAdd}
                                            onChange={(e) => setSelectedOfficeForAdd(e.target.value)}
                                            className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                        >
                                            <option value="">Select an office/station</option>
                                            {stations.map((station) => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name} {station.locationName && `- ${station.locationName}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {!userToAddToStation.phoneNumber && (
                                        <p className="text-xs text-red-600 mt-2">This user has no phone number on file and cannot be added.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowAddToStationModal(false);
                                        setUserToAddToStation(null);
                                        setSelectedOfficeForAdd("");
                                    }}
                                    variant="outline"
                                    className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                    disabled={isAddingToStation}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmAddToStation}
                                    className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                    disabled={isAddingToStation || !selectedOfficeForAdd || !userToAddToStation.phoneNumber}
                                >
                                    {isAddingToStation ? "Adding..." : "Add to Station"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
