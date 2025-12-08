import {
  ClipboardListIcon,
  ClockIcon,
  DollarSignIcon,
  InboxIcon,
  LogOutIcon,
  TruckIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";

const navigationItems = [
  {
    icon: InboxIcon,
    label: "Parcel Intake",
    active: true,
  },
  {
    icon: ClipboardListIcon,
    label: "Package Assignments",
    active: false,
  },
  {
    icon: TruckIcon,
    label: "Active Deliveries",
    active: false,
  },
  {
    icon: DollarSignIcon,
    label: "Reconciliation",
    active: false,
  },
  {
    icon: ClockIcon,
    label: "History",
    active: false,
  },
];

export const NavigationSidebarSection = (): JSX.Element => {
  return (
    <aside className="flex flex-col justify-between pt-4 pb-8 px-4 bg-white border-r border-[#d1d1d1] h-full">
      <div className="flex flex-col gap-16">
        <header className="flex flex-col items-center gap-1">
          <img
            className="w-[150px] h-[150px] object-cover"
            alt="Logo"
            src="/logo-1.png"
          />

          <div className="flex items-center gap-2 w-full">
            <div className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
              Mealex &amp; Mailex
            </div>

            <div className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
              (M&amp;M)
            </div>
          </div>

          <div className="w-[162px] h-6 font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-semibold-font-size)] text-center tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
            Parcel Delivery System
          </div>
        </header>

        <nav className="flex flex-col gap-3">
          {navigationItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`flex items-center justify-start gap-3 px-6 py-3 h-auto rounded ${
                item.active
                  ? "bg-[#ea690c] hover:bg-[#ea690c]/90"
                  : "hover:bg-gray-100"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${
                  item.active ? "text-white" : "text-[#5d5d5d]"
                }`}
              />

              <span
                className={`font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)] ${
                  item.active ? "text-white" : "text-[#5d5d5d]"
                }`}
              >
                {item.label}
              </span>
            </Button>
          ))}
        </nav>
      </div>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3 px-6 py-3 h-12 bg-red-50 hover:bg-red-100 rounded"
      >
        <LogOutIcon className="w-6 h-6 text-[#e22420]" />

        <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#e22420] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
          Logout
        </span>
      </Button>
    </aside>
  );
};
