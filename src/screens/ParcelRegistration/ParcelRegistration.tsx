import React from "react";
import { ErrorNotificationSection } from "./sections/ErrorNotificationSection";
import { HeaderSection } from "./sections/HeaderSection";
import { InfoSection } from "./sections/InfoSection";
import { NavigationSidebarSection } from "./sections/NavigationSidebarSection";

export const ParcelRegistration = (): JSX.Element => {
  return (
    <div className="bg-slate-50 flex min-h-screen w-full">
      <NavigationSidebarSection />

      <div className="flex-1 flex flex-col">
        <HeaderSection />

        <main className="flex-1 px-12 py-8">
          <ErrorNotificationSection />
          <InfoSection />
        </main>
      </div>
    </div>
  );
};
