import { LogOut, Package, Phone, User } from "lucide-react";

interface CustomerHeaderAccount {
  isSignedIn: boolean;
  name?: string;
  pictureUrl?: string;
  onSignUp: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

interface Props {
  onBack?: () => void;
  backLabel?: string;
  subtitle?: string;
  customerAccount?: CustomerHeaderAccount;
}

export const TrackHeader = ({
  onBack,
  backLabel = "Back",
  subtitle = "Receive your parcel",
  customerAccount,
}: Props) => (
  <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
    <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-[#ea690c] hover:text-[#d45e0a] shrink-0"
          >
            {backLabel}
          </button>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-[#ea690c] to-[#c95a0a] rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
            <Package className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-neutral-900 leading-tight tracking-tight">M&amp;M Delivery</p>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {customerAccount &&
          (customerAccount.isSignedIn ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-full pl-1 pr-2.5 py-1 max-w-[150px]">
                {customerAccount.pictureUrl ? (
                  <img src={customerAccount.pictureUrl} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-[#ea690c]" />
                  </span>
                )}
                <span className="truncate">{customerAccount.name?.split(" ")[0] || "Account"}</span>
              </span>
              <button
                type="button"
                onClick={customerAccount.onSignOut}
                className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={customerAccount.onSignIn}
                className="text-xs font-semibold text-white bg-[#ea690c] hover:bg-[#d45e0a] rounded-full px-3.5 py-2 shadow-sm"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={customerAccount.onSignUp}
                className="text-xs font-medium text-slate-600 hover:text-neutral-900 px-2.5 py-2"
              >
                Sign up
              </button>
            </div>
          ))}
        <a
          href="tel:+233504040226"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#ea690c] border border-slate-200 rounded-full px-3 py-2"
        >
          <Phone className="w-3.5 h-3.5" />
          Help
        </a>
      </div>
    </div>
  </header>
);
