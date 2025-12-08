import { BellIcon, ChevronDownIcon, SettingsIcon } from "lucide-react";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

export const HeaderSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-between p-4 bg-white border-b border-[#d1d1d1]">
      <div className="flex flex-col items-start">
        <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
          Parcel Intake
        </h1>

        <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] tracking-[var(--body-md-letter-spacing)] leading-[var(--body-md-line-height)] [font-style:var(--body-md-font-style)]">
          Manage parcel intake, assignments, and payments
        </p>
      </div>

      <div className="inline-flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="relative w-12 h-12 p-3 rounded"
        >
          <BellIcon className="w-6 h-6" />
          <Badge className="absolute top-0 left-[31px] h-[18px] px-2.5 bg-[#e22420] hover:bg-[#e22420] rounded-[52px] flex items-center justify-center">
            <span className="font-body-sm font-[number:var(--body-sm-font-weight)] text-white text-[length:var(--body-sm-font-size)] tracking-[var(--body-sm-letter-spacing)] leading-[var(--body-sm-line-height)] [font-style:var(--body-sm-font-style)]">
              99+
            </span>
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" className="w-12 h-12 p-3 rounded">
          <SettingsIcon className="w-6 h-6" />
        </Button>

        <div className="inline-flex items-center gap-4">
          <div className="inline-flex items-center gap-2">
            <Avatar className="w-[42px] h-[42px] border border-solid border-[#d1d1d1]">
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

          <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
            <ChevronDownIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
