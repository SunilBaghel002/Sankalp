// src/components/PageLayout.tsx
import React from "react";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";

interface PageLayoutProps {
    children: React.ReactNode;
    pageTitle: string;
    pageIcon?: React.ElementType;
    showHeader?: boolean;
    showBottomNav?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    pageTitle,
    pageIcon,
    showHeader = true,
    showBottomNav = true,
}) => {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {showHeader && <AppHeader pageTitle={pageTitle} pageIcon={pageIcon} />}

            <main className={`${showBottomNav ? "pb-24" : ""}`}>
                {children}
            </main>

            {showBottomNav && <BottomNavBar />}
        </div>
    );
};

export default PageLayout;