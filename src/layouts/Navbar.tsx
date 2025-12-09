import React from "react";
import { Menu, LogOut } from "lucide-react";

interface NavbarProps {
    onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    return (
        <nav className="border-b border-[#d1d1d1] bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="rounded-lg p-2 text-[#5d5d5d] hover:bg-gray-50 lg:hidden"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-neutral-800">Parcel Management</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
