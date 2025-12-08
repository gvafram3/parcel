import {
  ArrowRightIcon,
  DownloadIcon,
  InboxIcon,
  UploadIcon,
} from "lucide-react";
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
    placeholder: "+233 555 555 555",
    required: true,
  },
];

const receiverFields = [
  {
    id: "receiverName",
    label: "Receiver Name",
    placeholder: "Jane Doe",
    required: true,
  },
  {
    id: "receiverPhone",
    label: "Receiver Phone number",
    placeholder: "+233 555 555 123",
    required: true,
  },
];

interface InfoSectionProps {
  onNext: () => void;
}

export const InfoSection = ({ onNext }: InfoSectionProps): JSX.Element => {
  return (
    <Card className="w-full rounded-2xl border border-[#d1d1d1] bg-white shadow-[0px_2px_4px_#0000000d,0px_8px_8px_#0000000a,0px_17px_10px_#00000008,0px_30px_12px_#00000003,0px_47px_13px_transparent]">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
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

            <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
              {senderFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <span className="text-sm font-semibold text-[#e22420]">
                        *
                      </span>
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
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

            <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
              {receiverFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col flex-1 items-start gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor={field.id}
                      className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-base leading-6"
                    >
                      {field.label}
                    </Label>
                    {field.required && (
                      <span className="text-sm font-semibold text-[#e22420]">
                        *
                      </span>
                    )}
                  </div>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    className="w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="additionalInfo"
                className="font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-800 text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)]"
              >
                Additional Information
              </Label>
              <span className="text-sm text-[#9a9a9a]">(optional)</span>
            </div>

            <Textarea
              id="additionalInfo"
              placeholder="Message goes here..."
              className="min-h-[160px] w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 font-body-md-semibold font-[number:var(--body-md-semibold-font-weight)] text-neutral-700 text-[length:var(--body-md-semibold-font-size)] tracking-[var(--body-md-semibold-letter-spacing)] leading-[var(--body-md-semibold-line-height)] [font-style:var(--body-md-semibold-font-style)] placeholder:text-[#b0b0b0] resize-y"
            />
          </div>
        </div>

        <nav className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

          <Button
            onClick={onNext}
            className="flex w-full items-center justify-center gap-3 rounded bg-[#ea690c] px-6 py-3 hover:bg-[#ea690c]/90 sm:w-auto"
          >
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
