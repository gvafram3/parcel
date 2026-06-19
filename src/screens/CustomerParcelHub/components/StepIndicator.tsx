import type { TrackStep } from "../trackParcelUtils";

const STEPS: { key: TrackStep; label: string }[] = [
  { key: "search", label: "Phone" },
  { key: "otp", label: "Verify" },
  { key: "list", label: "Parcels" },
  { key: "detail", label: "Details" },
];

const stepIndex = (step: TrackStep) => STEPS.findIndex(s => s.key === step);

interface Props {
  current: TrackStep;
}

export const StepIndicator = ({ current }: Props) => {
  const active = stepIndex(current);

  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i < active;
          const currentStep = i === active;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${done || currentStep ? "bg-[#ea690c]" : "bg-slate-200"}`}
                  />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    done
                      ? "bg-[#ea690c] text-white"
                      : currentStep
                        ? "bg-[#ea690c] text-white ring-4 ring-orange-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${done ? "bg-[#ea690c]" : "bg-slate-200"}`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium truncate w-full text-center ${
                  currentStep ? "text-[#ea690c]" : done ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
