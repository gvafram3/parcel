import React from "react";

const steps = [
  {
    number: "1",
    label: "Parcel Details",
  },
  {
    number: "2",
    label: "Costs and POD",
  },
  {
    number: "3",
    label: "Review & Submit",
  },
];

interface ErrorNotificationSectionProps {
  currentStep?: number;
}

export const ErrorNotificationSection = ({
  currentStep,
}: ErrorNotificationSectionProps): JSX.Element => {
  // If currentStep is not provided, don't render the progress indicator
  if (currentStep === undefined) {
    return <></>;
  }
  return (
    <div className="w-full rounded-2xl border border-[#d1d1d1] bg-white/80 px-4 py-3 shadow-sm sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-base font-semibold sm:h-12 sm:w-12 ${
                    isActive || isCompleted
                      ? "border-transparent bg-[#ea690c] text-white"
                      : "border-[#e7e7e7] bg-[#f7f7f7] text-[#4f4f4f]"
                  }`}
                >
                  {step.number}
                </div>

                <div
                  className={`font-body-md font-[number:var(--body-md-font-weight)] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)] ${
                    isActive || isCompleted ? "text-[#5d5d5d]" : "text-[#9a9a9a]"
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden flex-1 sm:block">
                  <div
                    className={`h-[2px] w-full rounded-full ${
                      isCompleted || (isActive && index === currentStep - 2)
                        ? "bg-gradient-to-r from-[#ea690c] via-[#f3b07d] to-[#f3b07d] opacity-70"
                        : "bg-[#e7e7e7]"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
