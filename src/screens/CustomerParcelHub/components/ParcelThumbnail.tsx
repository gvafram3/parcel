import { useState } from "react";
import { Package } from "lucide-react";
import type { CustomerParcel } from "../../../services/customerService";
import {
  getParcelFallbackGradient,
  getParcelImageUrl,
  getParcelInitials,
  getParcelTitle,
} from "../trackParcelUtils";

type ThumbnailSize = "sm" | "md" | "lg" | "hero";

const SIZE_CLASSES: Record<ThumbnailSize, string> = {
  sm: "w-12 h-12 rounded-xl text-[10px]",
  md: "w-14 h-14 rounded-xl text-xs",
  lg: "w-[4.5rem] h-[4.5rem] rounded-2xl text-sm",
  hero: "w-full aspect-[5/3] rounded-2xl text-lg",
};

interface Props {
  parcel: CustomerParcel;
  size?: ThumbnailSize;
  className?: string;
}

export const ParcelThumbnail = ({ parcel, size = "md", className = "" }: Props) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getParcelImageUrl(parcel);
  const title = getParcelTitle(parcel);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const gradient = getParcelFallbackGradient(parcel.parcelId);
  const initials = getParcelInitials(title);

  return (
    <div
      className={`relative overflow-hidden shrink-0 border border-slate-200/80 bg-white ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${gradient} text-[#ea690c]/70`}
        >
          {size === "hero" ? (
            <>
              <Package className="w-10 h-10 mb-1 opacity-80" strokeWidth={1.5} />
              <span className="font-bold tracking-wide opacity-90">{initials}</span>
            </>
          ) : size === "lg" ? (
            <>
              <Package className="w-6 h-6 mb-0.5 opacity-70" strokeWidth={1.5} />
              <span className="font-bold">{initials}</span>
            </>
          ) : (
            <Package className="w-5 h-5 opacity-75" strokeWidth={1.75} />
          )}
        </div>
      )}
    </div>
  );
};
