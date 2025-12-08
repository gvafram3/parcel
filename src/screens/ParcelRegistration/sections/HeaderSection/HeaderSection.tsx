import { BellIcon, ChevronDownIcon, SettingsIcon, UserIcon, HelpCircleIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

const routeTitles: Record<string, { title: string; description: string }> = {
  "/parcel-intake": {
    title: "Parcel Intake",
    description: "Manage parcel intake, assignments, and payments",
  },
  "/parcel-costs-pod": {
    title: "Parcel Costs & POD",
    description: "Review costs and upload proof of delivery",
  },
  "/parcel-review": {
    title: "Parcel Review",
    description: "Review parcel details before confirmation",
  },
  "/parcel-sms-success": {
    title: "SMS Sent Successfully",
    description: "Parcel registration completed",
  },
  "/package-assignments": {
    title: "Package Assignments",
    description: "Select parcels to assign to riders",
  },
  "/rider-selection": {
    title: "Rider Selection",
    description: "Select an available rider for delivery",
  },
  "/active-deliveries": {
    title: "Active Deliveries",
    description: "View and manage ongoing deliveries",
  },
  "/reconciliation": {
    title: "Reconciliation",
    description: "Reconcile rider payments and commissions",
  },
  "/reconciliation-confirmation": {
    title: "Reconciliation Confirmation",
    description: "Confirm reconciliation details",
  },
};

const accountMenuItems = [
  {
    label: "Profile Settings",
    icon: UserIcon,
    active: true,
  },
  {
    label: "Preferences",
    icon: SettingsIcon,
    active: false,
  },
  {
    label: "Help & Support",
    icon: HelpCircleIcon,
    active: false,
  },
];

export const HeaderSection = (): JSX.Element => {
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const routeInfo = routeTitles[location.pathname] || {
    title: "Parcel Management",
    description: "Manage parcel operations",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex w-full flex-col gap-4 rounded-2xl border border-[#d1d1d1] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-6">
      <div className="flex flex-col items-start gap-1">
        <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
          {routeInfo.title}
        </h1>

        <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
          {routeInfo.description}
        </p>
      </div>

      <div className="inline-flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded"
        >
          <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <Badge className="absolute -right-1 -top-1 flex h-5 w-6 items-center justify-center rounded-full bg-[#e22420] px-1.5 hover:bg-[#e22420] min-w-[24px]">
            <span className="font-body-xs font-[number:var(--body-xs-font-weight)] text-white text-[10px] leading-tight">
              99+
            </span>
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" className="h-11 w-11 rounded">
          <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        <div className="relative inline-flex items-center gap-3 sm:gap-4" ref={menuRef}>
          <div className="inline-flex items-center gap-2 sm:gap-3">
            <Avatar className="h-10 w-10 border border-solid border-[#d1d1d1] sm:h-[42px] sm:w-[42px]">
              <AvatarImage src="/vector.svg" alt="Adams Godfred" />
              <AvatarFallback>AG</AvatarFallback>
            </Avatar>

            <div className="inline-flex flex-col items-start">
              <div className="font-body-md font-[number:var(--body-md-font-weight)] text-neutral-800 text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
                Adams Godfred
              </div>

              <div className="font-body-sm font-[number:var(--body-sm-font-weight)] text-[#5d5d5d] text-[length:var(--body-sm-font-size)] tracking-[var(--body-sm-letter-spacing)] leading-[var(--body-sm-line-height)] [font-style:var(--body-sm-font-style)]">
                Front Desk
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <ChevronDownIcon className="w-6 h-6" />
          </Button>

          {/* Account Dropdown Menu */}
          {showAccountMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-[#d1d1d1] bg-white shadow-lg z-50">
              <div className="p-4 border-b border-[#d1d1d1]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-solid border-[#d1d1d1]">
                    <AvatarImage src="/vector.svg" alt="Adams Godfred" />
                    <AvatarFallback>AG</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="font-body-md font-[number:var(--body-md-font-weight)] text-neutral-800 text-[length:var(--body-md-font-size)]">
                      Adams Godfred
                    </div>
                    <div className="font-body-sm font-[number:var(--body-sm-font-weight)] text-[#5d5d5d] text-[length:var(--body-sm-font-size)]">
                      Front Desk
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-800 text-[length:var(--body-md-semibold-font-size)] px-3 py-2 mb-1">
                  My Account
                </div>
                {accountMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      item.active
                        ? "bg-[#ea690c] text-white"
                        : "text-neutral-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.active ? "text-white" : "text-[#5d5d5d]"}`} />
                    <span className="font-body-md font-[number:var(--body-md-font-weight)] text-[length:var(--body-md-font-size)]">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
