import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";   // ✅ import headers
import { isAuthenticated } from "@/lib/actions/auth.action";

import "./globals.css";

export default async function RootLayout({
                                             children,
                                         }: {
    children: ReactNode;
}) {
    const isUserAuthenticated = await isAuthenticated();

    // ✅ Await headers() properly
    const headersList = await headers();
    const currentPath =
        headersList.get("x-invoke-path") ||
        headersList.get("referer") ||
        "/";

    const authPages = ["/sign-in", "/sign-up"];

    // ✅ Only redirect if user is not logged in AND not already on auth pages
    if (
        !isUserAuthenticated &&
        !authPages.some((p) => currentPath.includes(p))
    ) {
        redirect("/sign-in");
    }

    return (
        <html lang="en">
        <body className="bg-gray-900 text-white min-h-screen">
        <div className="root-layout">
            <nav className="p-4 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.svg"
                        alt="PrepAI Logo"
                        width={38}
                        height={32}
                        priority
                    />
                    <h2 className="text-primary-100 font-bold">PrepAI</h2>
                </Link>
            </nav>

            <main className="p-6">{children}</main>
        </div>
        </body>
        </html>
    );
}
