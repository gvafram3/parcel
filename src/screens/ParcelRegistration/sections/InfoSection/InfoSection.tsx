import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DownloadIcon,
  InboxIcon,
  UploadIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

const senderFields = [
  {
    id: "senderName",
    label: "Sender Name",
    placeholder: "John Smith",
    required: true,
  },
  {
    id: "senderPhone",
    label: "Sender Phone number",
    placeholder: "John Smith",
    required: true,
  },
];

const receiverFields = [
  {
    id: "receiverName",
    label: "Receiver Name",
    placeholder: "John Smith",
    required: true,
  },
  {
    id: "receiverPhone",
    label: "Receiver Phone number",
    placeholder: "John Smith",
    required: true,
  },
];

export const InfoSection = (): JSX.Element => {
  return (
    <Card className="w-full bg-white rounded-lg border border-[#d1d1d1] shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
      <CardContent className="flex flex-col items-start gap-6 p-4">
        <header className="inline-flex items-center gap-2">
          <InboxIcon className="w-6 h-6 text-[#ea690c]" />
          <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#ea690c] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
            New Parcel Registration
          </h1>
        </header>

        <div className="flex flex-col items-start gap-4 w-full">
          <section className="flex flex-col items-start gap-4 w-full">
            <div className="inline-flex items-center gap-2">
              <UploadIcon className="w-6 h-6 text-[#5d5d5d]" />
              <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                Sender&apos;s Details
              </h2>
            </div>

            <div className="flex items-center gap-[38px] w-full">
              {senderFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-start gap-3 relative w-full">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-normal text-neutral-800 text-base tracking-[0] leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <img
                        className="absolute w-[5px] h-[5px] top-0"
                        style={{
                          left: field.id === "senderName" ? "96px" : "158px",
                        }}
                        alt="Required"
                        src="/-.svg"
                      />
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    className="w-full bg-white rounded border border-[#d1d1d1] px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-[#b0b0b0] text-base tracking-[0] leading-6"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-start gap-4 w-full">
            <div className="inline-flex items-center gap-2">
              <DownloadIcon className="w-6 h-6 text-[#5d5d5d]" />
              <h2 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-[#5d5d5d] text-[length:var(--body-lg-semibold-font-size)] tracking-[var(--body-lg-semibold-letter-spacing)] leading-[var(--body-lg-semibold-line-height)] [font-style:var(--body-lg-semibold-font-style)]">
                Receiver&apos;s Details
              </h2>
            </div>

            <div className="flex items-center gap-[38px] w-full">
              {receiverFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-start gap-3 relative w-full">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-normal text-neutral-800 text-base tracking-[0] leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <img
                        className="absolute w-[5px] h-[5px] top-0"
                        style={{
                          left: field.id === "receiverName" ? "107px" : "169px",
                        }}
                        alt="Required"
                        src="/-.svg"
                      />
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    className="w-full bg-white rounded border border-[#d1d1d1] px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-[#b0b0b0] text-base tracking-[0] leading-6"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col h-[230px] items-start gap-2 w-full">
            <Label
              htmlFor="additionalInfo"
              className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-800 text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]"
            >
              Additional Information
            </Label>

            <div className="flex flex-col items-end gap-3.5 flex-1 w-full relative">
              <Textarea
                id="additionalInfo"
                placeholder="Message goes here..."
                className="flex-1 w-full bg-white rounded border border-[#d1d1d1] px-3 py-2 font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#b0b0b0] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)] resize-none"
              />
              <div className="flex flex-col w-5 items-start p-[5px] absolute right-0 bottom-0">
                <img
                  className="w-full h-[8.11px]"
                  alt="Resize handle"
                  src="/union.svg"
                />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            className="w-[291px] flex items-center justify-center gap-3 px-6 py-3 rounded border border-[#888888] bg-transparent hover:bg-transparent"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-[#4f4f4f] text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Previous
            </span>
          </Button>

          <Button className="w-[289px] flex items-center justify-center gap-3 px-6 py-3 bg-[#ea690c] rounded hover:bg-[#ea690c]/90">
            <span className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-white text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]">
              Continue
            </span>
            <ArrowRightIcon className="w-6 h-6" />
          </Button>
        </nav>
      </CardContent>
    </Card>
  );
};
