"use client";

import { ReactNode, useState } from "react";
import Image from "next/image";

type NameplateProps = {
  asset?: string | null;
  children: ReactNode;
  animated?: boolean;
};

export default function Nameplate({
  asset,
  children,
  animated = true,
}: NameplateProps) {
  const [failed, setFailed] = useState(false);

  if (!asset || failed) {
    return <div className="relative">{children}</div>;
  }

  const safeAsset = asset.endsWith("/") ? asset.slice(0, -1) : asset;
  const staticUrl = `${safeAsset}/static.png`;
  const animatedUrl = `${safeAsset}/asset.webm`;

  return (
    <div className="relative rounded-lg overflow-hidden">
      {animated && !failed ? (
        <video
          src={animatedUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          onError={() => setFailed(true)}
        />
      ) : (
        <Image
          src={staticUrl}
          alt="nameplate"
          fill
          className="absolute inset-0 object-cover pointer-events-none z-0"
          onError={() => setFailed(true)}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
