"use client";

import { http, createConfig } from "wagmi";
import { base, arbitrum, optimism } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { cookieStorage, createStorage } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [base, arbitrum, optimism],
  connectors: [injected()],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc"),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || "https://mainnet.optimism.io"),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export default wagmiConfig;