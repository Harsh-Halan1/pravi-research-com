"use server";

import { cookies } from "next/headers";
import { isLocale } from "./request";

export async function setLocale(formData: FormData) {
  const value = formData.get("locale");
  if (typeof value !== "string" || !isLocale(value)) return;
  const cookieStore = await cookies();
  cookieStore.set("pravi-locale", value, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
}
