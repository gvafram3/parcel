import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu, X, User, Package, History, DollarSign } from "lucide-react";
import { useStation } from "../contexts/StationContext";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { UpdateNotificationPopup } from "../components/UpdateNotificationPopup";

interface RiderLayoutProps {
    children: React.ReactNode;
}

export const RiderLayout: React.FC<RiderLayoutProps> = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { currentUser, logout } = useStation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const userInitials = currentUser?.name
        ? currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "R";

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <UpdateNotificationPopup />
            {/* Professional Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
                <div className="px-4 py-3.5">
                    <div className="flex items-center justify-between">
                        {/* Logo/Brand */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    className="h-11 w-11 object-cover rounded-lg shadow-sm"
                                    alt="M&M Logo"
                                    src="/logo-1.png"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-[#ea690c] leading-tight">M&M Services</span>
                                <span className="text-xs font-medium text-gray-600 leading-tight">Rider Portal</span>
                            </div>
                        </div>

                        {/* User Info & Menu */}
                        <div className="flex items-center gap-3">
                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-2">
                                <button
                                    onClick={() => navigate("/rider/dashboard")}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                                        location.pathname === "/rider/dashboard"
                                            ? "bg-[#ea690c] text-white"
                                            : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Package size={16} />
                                        <span>My Deliveries</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate("/rider/history")}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                                        location.pathname === "/rider/history"
                                            ? "bg-[#ea690c] text-white"
                                            : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <History size={16} />
                                        <span>History</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate("/rider/earnings")}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                                        location.pathname === "/rider/earnings"
                                            ? "bg-[#ea690c] text-white"
                                            : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={16} />
                                        <span>Earnings</span>
                                    </div>
                                </button>
                            </div>

                            {currentUser && (
                                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                        <AvatarImage src="/vector.svg" alt={currentUser.name || "Rider"} />
                                        <AvatarFallback className="bg-[#ea690c] text-white text-xs font-semibold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-neutral-800 leading-tight">
                                            {currentUser.name || "Rider"}
                                        </span>
                                        <span className="text-xs text-gray-500 leading-tight">
                                            {currentUser.email}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
                                aria-label="Toggle menu"
                            >
                                {menuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>

                            {/* Logout Button - Desktop */}
                            <button
                                onClick={handleLogout}
                                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow"
                            >
                                <LogOut size={16} />
                                <span className="text-sm font-semibold">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg animate-in slide-in-from-top-2">
                        <div className="px-4 py-4 space-y-2">
                            {currentUser && (
                                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                                    <Avatar className="h-12 w-12 border-2 border-[#ea690c]">
                                        <AvatarImage src="/vector.svg" alt={currentUser.name || "Rider"} />
                                        <AvatarFallback className="bg-[#ea690c] text-white font-semibold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col flex-1">
                                        <p className="text-sm font-bold text-neutral-800">{currentUser.name}</p>
                                        <p className="text-xs text-gray-500">{currentUser.email}</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Navigation Menu Items */}
                            <button
                                onClick={() => {
                                    navigate("/rider/dashboard");
                                    setMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                                    location.pathname === "/rider/dashboard"
                                        ? "bg-[#ea690c] text-white"
                                        : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                }`}
                            >
                                <Package size={18} />
                                <span>My Deliveries</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    navigate("/rider/history");
                                    setMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                                    location.pathname === "/rider/history"
                                        ? "bg-[#ea690c] text-white"
                                        : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                }`}
                            >
                                <History size={18} />
                                <span>History</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    navigate("/rider/earnings");
                                    setMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                                    location.pathname === "/rider/earnings"
                                        ? "bg-[#ea690c] text-white"
                                        : "bg-gray-50 text-neutral-800 hover:bg-gray-100"
                                }`}
                            >
                                <DollarSign size={18} />
                                <span>Earnings</span>
                            </button>
                            
                            <div className="pt-2 border-t border-gray-200">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content - Mobile Optimized */}
            <main className="flex-1 overflow-auto pb-6">
                {children}
            </main>
        </div>
    );
};

