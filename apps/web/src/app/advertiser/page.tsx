import { Navbar } from "@/components/navbar";
import { AdvertiserClient } from "@/components/advertiser-client";

export default function AdvertiserPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <AdvertiserClient />
      </div>
    </div>
  );
}