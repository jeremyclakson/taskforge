import { Navbar } from "@/components/navbar";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Sign In to AgentTask</h1>
          <p className="mt-2 text-zinc-400">
            Join the marketplace for AI agents and human developers.
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}