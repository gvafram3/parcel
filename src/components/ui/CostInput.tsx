import * as React from "react";
import { cn } from "../../lib/utils";

const DEFAULT_PRESETS = [10, 15, 20, 25, 30, 40, 50];

export interface CostInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  presets?: number[];
  /** When true, show a "Leave blank" button for optional costs */
  allowClear?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Cost input: whole numbers only, no spinners.
 * Supports both typing and selecting from preset buttons.
 */
const CostInput = React.forwardRef<HTMLInputElement, CostInputProps>(
  (
    {
      value,
      onChange,
      presets = DEFAULT_PRESETS,
      allowClear = false,
      className,
      inputClassName,
      placeholder = "0",
      ...props
    },
    ref
  ) => {
    const displayValue = value === undefined || value === null ? "" : String(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        onChange(undefined);
        return;
      }
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 0) {
        onChange(num);
      }
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            inputClassName
          )}
          {...props}
        />
        {(presets.length > 0 || allowClear) && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {allowClear && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  value === undefined || value === null
                    ? "border-[#ea690c] bg-[#ea690c]/10 text-[#ea690c]"
                    : "border-[#d1d1d1] bg-white text-neutral-700 hover:border-[#ea690c]/50 hover:bg-gray-50"
                )}
              >
                Leave blank
              </button>
            )}
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(value === preset ? undefined : preset)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  value === preset
                    ? "border-[#ea690c] bg-[#ea690c]/10 text-[#ea690c]"
                    : "border-[#d1d1d1] bg-white text-neutral-700 hover:border-[#ea690c]/50 hover:bg-gray-50"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
CostInput.displayName = "CostInput";

export { CostInput };
