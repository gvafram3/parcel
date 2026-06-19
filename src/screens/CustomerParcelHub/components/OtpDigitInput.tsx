import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

export const OtpDigitInput = ({ value, onChange, onComplete, disabled }: Props) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  useEffect(() => {
    if (value.length === 6) onComplete?.(value);
  }, [value, onComplete]);

  const updateAt = (index: number, char: string) => {
    const next = value.split("");
    next[index] = char;
    const joined = next.join("").replace(/\s/g, "").slice(0, 6);
    onChange(joined);
    if (char && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
      const next = value.slice(0, index - 1) + value.slice(index);
      onChange(next);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          onChange={e => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            updateAt(i, char);
          }}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#ea690c] focus:ring-2 focus:ring-orange-100 outline-none transition-all disabled:opacity-60"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};
