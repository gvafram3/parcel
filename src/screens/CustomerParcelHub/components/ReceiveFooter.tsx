import { Link } from "react-router-dom";

interface Props {
  variant?: "search" | "default";
}

export const ReceiveFooter = ({ variant: _variant = "default" }: Props) => (
  <footer className="mt-6 text-center pb-4">
    <p className="text-xs text-slate-500">
      <Link to="/track" className="font-medium text-[#ea690c] hover:underline">
        Track without sign-in
      </Link>
    </p>
  </footer>
);
