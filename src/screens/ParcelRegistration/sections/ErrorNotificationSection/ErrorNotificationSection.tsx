import React from "react";

const steps = [
  {
    number: "1",
    label: "Parcel Details",
    isActive: true,
  },
  {
    number: "2",
    label: "Costs and POD",
    isActive: false,
  },
  {
    number: "3",
    label: "Review & Submit",
    isActive: false,
  },
];

export const ErrorNotificationSection = (): JSX.Element => {
  return (
    <div className="flex w-full items-center justify-between gap-6 relative">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className={`inline-flex flex-col items-center justify-center gap-2.5 px-5 py-2.5 rounded-[52px] ${
                step.isActive ? "bg-[#ea690c]" : "bg-[#e7e7e7]"
              }`}
            >
              <div
                className={`font-body-lg font-[number:var(--body-lg-font-weight)] text-[length:var(--body-lg-font-size)] tracking-[var(--body-lg-letter-spacing)] leading-[var(--body-lg-line-height)] [font-style:var(--body-lg-font-style)] ${
                  step.isActive ? "text-white" : "text-[#4f4f4f]"
                }`}
              >
                {step.number}
              </div>
            </div>

            <div className="h-6 text-center">
              <div
                className={`font-body-md font-[number:var(--body-md-font-weight)] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)] whitespace-nowrap ${
                  step.isActive ? "text-[#5d5d5d]" : "text-[#b0b0b0]"
                }`}
              >
                {step.label}
              </div>
            </div>
          </div>

          {index < steps.length - 1 && (
            <div className="flex-1 relative h-px rotate-[0.37deg]">
              <img
                className="absolute w-full left-0 h-1 top-[-3px] rotate-[-0.37deg]"
                alt="Line"
                src="/line.svg"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
