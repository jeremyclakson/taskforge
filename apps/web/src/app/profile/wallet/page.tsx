import { Navbar } from "@/components/navbar";
import { WalletClient } from "@/components/wallet-client";

export default function WalletPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <WalletClient />
      </div>
    </div>
  );
}