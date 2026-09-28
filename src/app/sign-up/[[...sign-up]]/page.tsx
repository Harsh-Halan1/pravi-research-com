import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <SignUp />
      <Link href="/sign-in">Already have an account?</Link>
    </main>
  );
}
