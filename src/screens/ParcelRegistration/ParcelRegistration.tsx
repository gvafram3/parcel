import React, { useState } from "react";
import { ErrorNotificationSection } from "./sections/ErrorNotificationSection";
import { HeaderSection } from "./sections/HeaderSection";
import { InfoSection } from "./sections/InfoSection";
import { NavigationSidebarSection } from "./sections/NavigationSidebarSection";
import { CostsAndPODSection } from "./sections/CostsAndPODSection";
import { ReviewSection } from "./sections/ReviewSection";

export const ParcelRegistration = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <InfoSection onNext={handleNext} />;
      case 2:
        return (
          <CostsAndPODSection onPrevious={handlePrevious} onNext={handleNext} />
        );
      case 3:
        return <ReviewSection onPrevious={handlePrevious} />;
      default:
        return <InfoSection onNext={handleNext} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="w-full lg:w-[320px]">
          <NavigationSidebarSection />
        </div>

        <div className="flex-1 space-y-6">
          <HeaderSection />

          <main className="flex-1 space-y-6">
            <ErrorNotificationSection currentStep={currentStep} />
            {renderStepContent()}
          </main>
        </div>
      </div>
    </div>
  );
};
