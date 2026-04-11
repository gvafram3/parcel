import React, { useState, useRef, useEffect } from "react";
import { Menu, BellIcon, SettingsIcon, ChevronDownIcon, HelpCircleIcon, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useStation } from "../contexts/StationContext";

interface NavbarProps {
    onMenuClick: () => void;
}

const routeTitles: Record<string, { title: string; description: string }> = {

    "/parcel-search": {
        title: "Parcel Search",
        description: "Find parcels by recipient, phone, ID, or date range",
    },
    "/parcel-intake": {
        title: "Parcel Intake",
        description: "Manage parcel intake, assignments, and payments",
    },
    "/pickup-request": {
        title: "Pickup Request",
        description: "Request pickup of parcels from one location for delivery to another",
    },
    "/call-center": {
        title: "Call Center",
        description: "Contact customers and record delivery preferences",
    },
    "/call-center/all-deliveries": {
        title: "All Deliveries",
        description: "View delivered parcels across all stations",
    },
    "/call-center/active-deliveries": {
        title: "Active Deliveries",
        description: "View active deliveries for follow-up",
    },
    "/call-center/history": {
        title: "History",
        description: "View follow-up history and remarks",
    },
    "/parcel-costs-pod": {
        title: "Parcel Costs & POD",
        description: "Review costs and upload proof of delivery",
    },
    "/parcel-review": {
        title: "Parcel Review",
        description: "Review parcel details before confirmation",
    },
    "/parcel-sms-success": {
        title: "SMS Sent Successfully",
        description: "Parcel registration completed",
    },
    "/package-assignments": {
        title: "Package Assignments",
        description: "Select parcels to assign to riders",
    },
    "/rider-selection": {
        title: "Rider Selection",
        description: "Select an available rider for delivery",
    },
    "/active-deliveries": {
        title: "Active Deliveries",
        description: "View and manage ongoing deliveries",
    },
    "/reconciliation": {
        title: "Reconciliation",
        description: "Reconcile rider payments and commissions",
    },
    "/reconciliation-confirmation": {
        title: "Reconciliation Confirmation",
        description: "Confirm reconciliation details",
    },
    "/financial-dashboard": {
        title: "Financial Dashboard",
        description: "View financial overview and reports",
    },
    "/shelf-management": {
        title: "Shelf and Address",
        description: "Manage shelf locations and assignments",
    },
    "/parcel-edit": {
        title: "Edit Parcels",
        description: "Edit parcel information and properties (Manager Only)",
    },
    "/admin/dashboard": {
        title: "Admin Dashboard",
        description: "System-wide overview and analytics",
    },
    "/admin/stations": {
        title: "Station Management",
        description: "Create and manage all delivery stations",
    },
    "/admin/users": {
        title: "User Management",
        description: "Manage all system users across stations",
    },
    "/admin/parcels": {
        title: "System Parcel Overview",
        description: "Global visibility of all parcels across all stations",
    },
    "/admin/financial-reports": {
        title: "Financial Reports",
        description: "Comprehensive financial analytics and insights",
    },
    "/preferences": {
        title: "Preferences",
        description: "Manage your account preferences and settings",
    },
    "/help": {
        title: "Help & Support",
        description: "Get help and support for using the system",
    },
};

const accountMenuItems = [
    {
        label: "Preferences",
        icon: SettingsIcon,
        path: "/preferences",
    },
    {
        label: "Help & Support",
        icon: HelpCircleIcon,
        path: "/help",
    },
];

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useStation();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const routeInfo = routeTitles[location.pathname] || {
        title: "Parcel Management",
        description: "Manage parcel operations",
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowAccountMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const roleLabelMap: Record<string, string> = {
        ADMIN: "Admin",
        MANAGER: "Station Manager",
        FRONTDESK: "Front Desk",
        RIDER: "Rider",
        CALLER: "Call Center",
    };

    const getRoleLabel = (role: string) => {
        return roleLabelMap[role] || role.replace("-", " ");
    };

    return (
        <>
        <nav className="sticky top-0 z-10 border-b border-[#d1d1d1] bg-white">
            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Left Section - Menu and Title */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onMenuClick}
                        className="rounded-lg p-2 text-[#5d5d5d] hover:bg-gray-100 transition-colors lg:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="hidden sm:flex flex-col items-start gap-0.5">
                        <h1 className="text-lg font-bold text-neutral-800">
                            {routeInfo.title}
                        </h1>
                        <p className="text-xs text-[#5d5d5d]">
                            {routeInfo.description}
                        </p>
                    </div>

                    <div className="flex sm:hidden flex-col items-start gap-0.5">
                        <h1 className="text-base font-bold text-neutral-800">
                            {routeInfo.title}
                        </h1>
                    </div>
                </div>

                {/* Right Section - Icons and Account */}
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <BellIcon className="h-5 w-5 text-[#5d5d5d]" />
                        <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#e22420] px-0 hover:bg-[#e22420]">
                            <span className="text-white text-[9px] font-bold">
                                9
                            </span>
                        </Badge>
                    </Button>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <SettingsIcon className="h-5 w-5 text-[#5d5d5d]" />
                    </Button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-[#d1d1d1] mx-1 lg:mx-2" />

                    {/* Account Menu */}
                    {currentUser && (
                        <div className="relative inline-flex items-center gap-2 sm:gap-3" ref={menuRef}>
                            <div className="hidden sm:inline-flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                <Avatar className="h-9 w-9 border border-solid border-[#d1d1d1]">
                                    <AvatarImage src="/vector.svg" alt={currentUser.name} />
                                    <AvatarFallback>
                                        {currentUser.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="hidden md:flex flex-col items-start gap-0.5">
                                    <div className="font-medium text-sm text-neutral-800">
                                        {currentUser.name}
                                    </div>
                                    <div className="text-xs text-[#5d5d5d]">
                                        {currentUser.office?.name || getRoleLabel(currentUser.role)}
                                    </div>
                                </div>
                            </div>

                            <div className="sm:hidden">
                                <Avatar className="h-8 w-8 border border-solid border-[#d1d1d1]">
                                    <AvatarImage src="/vector.svg" alt={currentUser.name} />
                                    <AvatarFallback>
                                        {currentUser.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-5 h-5 p-0 hover:opacity-70 transition-opacity"
                                onClick={() => setShowAccountMenu(!showAccountMenu)}
                            >
                                <ChevronDownIcon className={`w-4 h-4 text-[#5d5d5d] transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} />
                            </Button>

                            {/* Account Dropdown Menu */}
                            {showAccountMenu && (
                                <div className="absolute right-0 top-full mt-3 w-72 rounded-xl border border-[#d1d1d1] bg-white shadow-xl z-50">
                                    {/* Header */}
                                    <div className="p-4 border-b border-[#d1d1d1] bg-gray-50 rounded-t-xl">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11 border border-solid border-[#d1d1d1]">
                                                <AvatarImage src="/vector.svg" alt={currentUser.name} />
                                                <AvatarFallback>
                                                    {currentUser.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-neutral-800 text-sm">
                                                    {currentUser.name}
                                                </div>
                                                <div className="text-xs text-[#5d5d5d]">
                                                    {currentUser.office?.name || getRoleLabel(currentUser.role)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <div className="font-semibold text-neutral-800 text-xs px-3 py-2 mb-1 uppercase tracking-wide text-[#5d5d5d]">
                                            My Account
                                        </div>
                                        {accountMenuItems.map((item, index) => {
                                            const Icon = item.icon;
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        navigate(item.path);
                                                        setShowAccountMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#ea690c] text-white shadow-sm"
                                                            : "text-neutral-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-[#5d5d5d]"}`} />
                                                    <span className="text-sm font-medium text-left flex-1">
                                                        {item.label}
                                                    </span>
                                                    {isActive && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-[#d1d1d1] p-2">
                                        <button
                                            onClick={() => {
                                                setShowAccountMenu(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e22420] hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm font-medium text-left">
                                                Logout
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>

            {/* Logout Confirm Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-sm p-6">
                        <h3 className="text-base font-bold text-neutral-800 mb-1">Confirm Logout</h3>
                        <p className="text-sm text-[#5d5d5d] mb-5">Are you sure you want to log out?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[#d1d1d1] text-sm font-medium text-neutral-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { logout(); navigate("/login"); }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
