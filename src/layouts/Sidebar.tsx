import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, InboxIcon, ClipboardListIcon, TruckIcon, DollarSignIcon, ClockIcon, LogOut } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const navItems = [
    { label: "Parcel Intake", path: "/parcel-intake", icon: InboxIcon },
    { label: "Package Assignments", path: "/package-assignments", icon: ClipboardListIcon },
    { label: "Active Deliveries", path: "/active-deliveries", icon: TruckIcon },
    { label: "Reconciliation", path: "/reconciliation", icon: DollarSignIcon },
    { label: "History", path: "/history", icon: ClockIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const location = useLocation();

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
                className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:border-r lg:border-[#d1d1d1] ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header with Logo */}
                <div className="flex h-auto flex-col items-center gap-3 border-b border-[#d1d1d1] p-4 text-center">
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

                {/* Navigation */}
                <nav className="space-y-2 px-4 py-6">
                    {navItems.map((item) => {
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

                {/* Logout Button */}
                <div className="border-t border-[#d1d1d1] p-4">
                    <button className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 font-medium text-[#e22420] transition-colors hover:bg-red-100">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
