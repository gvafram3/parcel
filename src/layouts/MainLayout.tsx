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
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <div className="flex flex-1 flex-col min-w-0 ml-0 lg:ml-64">
                <div className="sticky top-0 z-10 flex-shrink-0 bg-white shadow-sm">
                    <Navbar onMenuClick={toggleSidebar} />
                </div>
                <main className="flex-1 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};
