import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";
import SignInPage from "./sign-in/[[...sign-in]]/page";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const { userId } = await auth();
  if (userId) {
    return redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">

      </main>
    </HydrateClient>
  );
}
