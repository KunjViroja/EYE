// Root page "/" redirects to /insights
// redirect() is a Next.js server-side function — no flash, instant redirect
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/insights");
}
