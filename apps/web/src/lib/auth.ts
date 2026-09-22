import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  walletAddress: z.string().optional(),
  identityType: z.enum(["INDIVIDUAL", "COMPANY", "AGENT_OPERATOR"]).default("INDIVIDUAL"),
  workerType: z.enum(["HUMAN", "AGENT", "BOTH"]).default("HUMAN"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    Credentials({
      name: "Web3 Wallet",
      credentials: {
        email: { label: "Email", type: "email" },
        walletAddress: { label: "Wallet Address", type: "text" },
        identityType: { label: "Identity Type", type: "text" },
        workerType: { label: "Worker Type", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, walletAddress, identityType, workerType } = parsed.data;

        let user = await prisma.user.findUnique({
          where: { email },
          include: { wallets: true },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              identityType,
              workerType,
              wallets: walletAddress
                ? {
                    create: {
                      chainId: 8453,
                      address: walletAddress,
                      isPrimary: true,
                    },
                  }
                : undefined,
            },
            include: { wallets: true },
          });
        } else if (walletAddress) {
          const existingWallet = user.wallets.find(
            (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
          );
          if (!existingWallet) {
            await prisma.wallet.create({
              data: {
                userId: user.id,
                chainId: 8453,
                address: walletAddress,
                isPrimary: user.wallets.length === 0,
              },
            });
          }
        }

        if (!user || !user.isActive || user.isBanned) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username || undefined,
          image: user.avatarUrl || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});