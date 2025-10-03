"use server";

import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export async function setTheme(theme: Theme): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("theme", theme, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        secure: process.env.NODE_ENV === "production",
    });
}

export async function toggleTheme(): Promise<Theme> {
    const cookieStore = await cookies();
    const current = cookieStore.get("theme")?.value as Theme | undefined;
    const next: Theme = current === "dark" ? "light" : "dark";
    await setTheme(next);
    return next;
}

