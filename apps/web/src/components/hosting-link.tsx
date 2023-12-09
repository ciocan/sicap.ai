"use client";
import Link from "next/link";

import { captureCloudifyLinkClick } from "@/lib/telemetry";

export function HostingLink() {
  return (
    <Link
      target="_blank"
      href="https://cloudify.ro"
      className="hover:underline"
      onClick={captureCloudifyLinkClick}
    >
      Hosting oferit de Cloudify.ro
    </Link>
  );
}
