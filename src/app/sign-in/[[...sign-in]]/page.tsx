import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <SignIn />
      <Link href="/sign-up">Need an account?</Link>
    </main>
  );
}
