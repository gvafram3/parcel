import { Link } from "react-router-dom";

interface Props {
  variant?: "search" | "default";
}

export const ReceiveFooter = ({ variant = "default" }: Props) => (
  <footer className="mt-8 text-center space-y-2 pb-4">
    {variant === "search" ? (
      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
        Verify your phone to pick up or request delivery. GPS is required for home delivery.
      </p>
    ) : null}
    <p className="text-xs text-slate-500">
      Just checking status?{" "}
      <Link to="/track" className="font-medium text-[#ea690c] hover:underline">
        Quick track without verification
      </Link>
    </p>
  </footer>
);
