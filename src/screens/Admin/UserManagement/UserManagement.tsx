import { useState, useEffect } from "react";
import { Plus, Edit, Phone, Mail, Building2, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { mockUsers, mockStations, addUser } from "../../../data/mockData";
import { User, UserRole } from "../../../types";
import { getStationName, formatPhoneNumber } from "../../../utils/dataHelpers";

const roleColors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800",
    "station-manager": "bg-blue-100 text-blue-800",
    "front-desk": "bg-green-100 text-green-800",
    "call-center": "bg-yellow-100 text-yellow-800",
    rider: "bg-purple-100 text-purple-800",
};

export const UserManagement = (): JSX.Element => {
    const [users, setUsers] = useState<User[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterRole, setFilterRole] = useState("");
    const [filterStation, setFilterStation] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "front-desk" as UserRole,
        stationId: "",
    });

    useEffect(() => {
        setUsers(mockUsers);
    }, []);

    const filteredUsers = users.filter((user) => {
        if (filterRole && user.role !== filterRole) return false;
        if (filterStation && user.stationId !== filterStation) return false;
        return true;
    });

    const toggleUserStatus = () => {
        // For now, just show a message since User type doesn't have status
        // In a real app, you'd update the user status
        alert("User status toggle functionality - to be implemented with backend");
    };

    const handleAddUser = () => {
        if (
            formData.name.trim() &&
            formData.email.trim() &&
            formData.phone.trim() &&
            formData.stationId
        ) {
            const newUser = addUser({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                stationId: formData.stationId,
            });
            setUsers([...users, newUser]);
            setFormData({
                name: "",
                email: "",
                phone: "",
                role: "front-desk",
                stationId: "",
            });
            setShowAddForm(false);
            alert(`User "${newUser.name}" created successfully!`);
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
                                                    phone: "",
                                                    role: "front-desk",
                                                    stationId: "",
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
                                                Phone <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+233XXXXXXXXX"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Role <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="front-desk">Front Desk</option>
                                                <option value="call-center">Call Center</option>
                                                <option value="station-manager">Station Manager</option>
                                                <option value="rider">Rider</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Station <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <select
                                                value={formData.stationId}
                                                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">Select a station</option>
                                                {mockStations.map((station) => (
                                                    <option key={station.id} value={station.id}>
                                                        {station.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={handleAddUser}
                                            disabled={
                                                !formData.name.trim() ||
                                                !formData.email.trim() ||
                                                !formData.phone.trim() ||
                                                !formData.stationId
                                            }
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                        >
                                            Create User
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setFormData({
                                                    name: "",
                                                    email: "",
                                                    phone: "",
                                                    role: "front-desk",
                                                    stationId: "",
                                                });
                                            }}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1]"
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
                                        <option value="admin">Admin</option>
                                        <option value="station-manager">Station Manager</option>
                                        <option value="front-desk">Front Desk</option>
                                        <option value="call-center">Call Center</option>
                                        <option value="rider">Rider</option>
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
                                        {mockStations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm overflow-hidden">
                        <CardContent className="p-0">
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
                                                        <td colSpan={5} className="py-12 text-center">
                                                            <p className="text-sm text-neutral-500">No users found matching filters</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredUsers.map((user, index) => (
                                                        <tr 
                                                            key={user.id} 
                                                            className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                        >
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                <span className="text-xs sm:text-sm font-medium text-neutral-800">{user.name}</span>
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Mail size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                        <span className="text-xs sm:text-sm text-neutral-700 truncate">{user.email}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                        <span className="text-xs sm:text-sm text-neutral-700">{formatPhoneNumber(user.phone)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                <Badge className={roleColors[user.role]}>
                                                                    <span className="text-xs">{user.role.replace("-", " ")}</span>
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Building2 size={12} className="sm:w-[14px] sm:h-[14px] text-[#9a9a9a] flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm text-neutral-700 truncate">{getStationName(user.stationId, mockStations)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                                                                <Button
                                                                    onClick={() => toggleUserStatus()}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border border-[#d1d1d1] hover:bg-gray-100"
                                                                >
                                                                    <Edit size={14} className="sm:w-4 sm:h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
