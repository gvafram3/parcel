import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden ml-0 lg:ml-64">
                <div className="flex-shrink-0">
                    <Navbar onMenuClick={toggleSidebar} />
                </div>
                <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};
