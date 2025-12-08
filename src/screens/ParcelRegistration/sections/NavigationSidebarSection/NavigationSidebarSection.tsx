import {
  ClipboardListIcon,
  ClockIcon,
  DollarSignIcon,
  InboxIcon,
  LogOutIcon,
  TruckIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "../../../../components/ui/button";

const navigationItems = [
  {
    icon: InboxIcon,
    label: "Parcel Intake",
    path: "/parcel-intake",
  },
  {
    icon: ClipboardListIcon,
    label: "Package Assignments",
    path: "/package-assignments",
  },
  {
    icon: TruckIcon,
    label: "Active Deliveries",
    path: "/active-deliveries",
  },
  {
    icon: DollarSignIcon,
    label: "Reconciliation",
    path: "/reconciliation",
  },
  {
    icon: ClockIcon,
    label: "History",
    path: "/history",
  },
];

export const NavigationSidebarSection = (): JSX.Element => {
  return (
    <aside className="flex h-full w-full flex-col gap-6 rounded-2xl border border-[#d1d1d1] bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <header className="flex flex-col items-center gap-2 sm:gap-3">
          <img
            className="h-[120px] w-[120px] object-cover sm:h-[140px] sm:w-[140px]"
            alt="Logo"
            src="/logo-1.png"
          />

          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <div className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
              Mealex &amp; Mailex
            </div>

            <div className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
              (M&amp;M)
            </div>
          </div>

          <div className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] text-center tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
            Parcel Delivery System
          </div>
        </header>

        <nav className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          {navigationItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-start gap-3 rounded-xl px-4 py-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors ${
                  isActive
                    ? "bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                    : "border border-transparent hover:border-[#f0f0f0] hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isActive ? "text-white" : "text-[#5d5d5d]"
                    }`}
                  />

                  <span
                    className={`font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)] ${
                      isActive ? "text-white" : "text-[#5d5d5d]"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <Button
        variant="ghost"
        className="mt-auto flex h-12 items-center justify-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-left hover:bg-red-100"
      >
        <LogOutIcon className="h-5 w-5 text-[#e22420] sm:h-6 sm:w-6" />

        <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#e22420] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
          Logout
        </span>
      </Button>
    </aside>
  );
};
