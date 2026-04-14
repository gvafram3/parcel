import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, InboxIcon, ClipboardListIcon, TruckIcon, DollarSignIcon, Layers, SearchIcon, Package, Users, Building2, LogOut, Edit, MapPin, BarChart3, PhoneIcon, CarIcon, ScrollTextIcon, CheckCircleIcon, HomeIcon, ZapIcon } from "lucide-react";
import { useStation } from "../contexts/StationContext";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const navItems = [

    // Admin Only - System Management
    // { label: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
    { label: "Station Management", path: "/admin/stations", icon: Building2, roles: ["ADMIN"] },
    { label: "User Management", path: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { label: "System Parcels", path: "/admin/parcels", icon: Package, roles: ["ADMIN"] },
    { label: "Admin Reconciliation", path: "/admin/reconciliation", icon: DollarSignIcon, roles: ["ADMIN"] },
    { label: "System Logs", path: "/admin/system-logs", icon: ScrollTextIcon, roles: ["ADMIN"] },
    { label: "Financial Dashboard", path: "/admin/financial", icon: BarChart3, roles: ["ADMIN"] },

    // Station Manager, Front Desk & Call Center - Core Operations
    { label: "Parcel Search", path: "/parcel-search", icon: SearchIcon, roles: ["FRONTDESK", "MANAGER",] },
    { label: "Smart Search", path: "/smart-search", icon: ZapIcon, roles: ["FRONTDESK", "MANAGER", "ADMIN", "CALLER"] },
    { label: "Parcel Intake", path: "/parcel-intake", icon: InboxIcon, roles: ["FRONTDESK", "MANAGER"] },
    { label: "Pickup Request", path: "/pickup-request", icon: MapPin, roles: ["FRONTDESK", "MANAGER"] },
    { label: "Package Assignments", path: "/package-assignments", icon: ClipboardListIcon, roles: ["MANAGER", "FRONTDESK"] },

    // Call Center (CALLER)
    { label: "Pre-Delivery", path: "/call-center", icon: PhoneIcon, roles: ["CALLER"] },
    { label: "Home Delivery", path: "/call-center/home-delivery", icon: HomeIcon, roles: ["CALLER"] },
    { label: "Post-Delivery", path: "/call-center/follow-up", icon: CheckCircleIcon, roles: ["CALLER"] },
    { label: "Active Deliveries", path: "/active-deliveries", icon: TruckIcon, roles: ["MANAGER", "FRONTDESK",] },
    // Reconciliation not shown to CALLER per latest requirement
    { label: "Driver Tracker", path: "/driver-tracker", icon: CarIcon, roles: ["MANAGER", "FRONTDESK"] },
    { label: "Reconciliation", path: "/reconciliation", icon: DollarSignIcon, roles: ["MANAGER",] },
    // Station Manager & Front Desk - Management
    // { label: "Financial Dashboard", path: "/financial-dashboard", icon: LayoutDashboard, roles: ["MANAGER", "FRONTDESK"] },
    { label: "Shelf and Address", path: "/shelf-management", icon: Layers, roles: ["MANAGER",] },

    // Manager Only - Parcel Editing
    { label: "Edit Parcels", path: "/parcel-edit", icon: Edit, roles: ["MANAGER", "FRONTDESK"] },
    { label: "Parcel Transfer", path: "/parcel-transfer", icon: ClipboardListIcon, roles: ["FRONTDESK", "MANAGER"] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const location = useLocation();
    const { userRole, currentUser, logout } = useStation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item =>
        userRole && item.roles.includes(userRole)
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-[#d1d1d1] flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header with Logo - Fixed at top */}
                <div className="flex h-auto flex-col items-center gap-3 border-b border-[#d1d1d1] p-4 text-center flex-shrink-0">
                    <div className="flex items-center justify-between w-full lg:justify-center">
                        <img
                            className="h-[100px] w-[100px] object-cover"
                            alt="M&M Logo"
                            src="/logo-1.png"
                        />
                        <button
                            onClick={onToggle}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="font-semibold text-[#ea690c]">
                            Mealex &amp; Mailex
                        </div>
                        <div className="font-semibold text-neutral-800">
                            (M&amp;M)
                        </div>
                    </div>

                    <div className="text-sm font-semibold text-[#5d5d5d]">
                        Parcel Delivery System
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 px-2 py-6">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onToggle}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${isActive
                                    ? "bg-[#ea690c] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                                    : "border border-transparent text-[#5d5d5d] hover:border-[#f0f0f0] hover:bg-gray-50"
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button Only - User info shown in navbar - Fixed at bottom */}
                <div className="border-t border-[#d1d1d1] p-4 flex-shrink-0">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 font-medium text-[#e22420] transition-colors hover:bg-red-100"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

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
                                onClick={() => { logout(); window.location.href = "/login"; }}
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
