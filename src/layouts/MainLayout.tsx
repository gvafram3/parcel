import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden ml-0 lg:ml-64">
                <Navbar onMenuClick={toggleSidebar} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
};
