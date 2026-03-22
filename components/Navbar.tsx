'use client';
// 告訴 Next.js：這個檔案是 Client Component。
// 才能在裡面使用 React Hooks（像 usePathname, useUser）以及跟瀏覽器有關的功能。

import Link from "next/link";
import Image from "next/image";
import {usePathname} from "next/navigation";
// Next.js App Router 提供的 hook，用來取得 目前 URL 的路徑
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {cn} from "@/lib/utils";

const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Pricing", href: "/subscriptions" },
]

const Navbar = () => {
    const pathName = usePathname(); // 取得目前的路徑字串
    const { user } = useUser(); // 從 Clerk 拿到目前登入的使用者物件。

    return (
        <header className="w-full fixed z-50 bg-(--bg-primary)">
            <div className="wrapper navbar-height py-4 flex justify-between items-center">
                {/* 整個 Logo 區域是一個連到首頁 / 的超連結。 */}
                <Link href="/" className="flex gap-0.5 items-center">
                    <Image src="/assets/logo.png" alt="Bookfied" width={42} height={26} />
                    <span className="logo-text">Bookified</span>
                </Link>

                <nav className="w-fit flex gap-7.5 items-center">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));

                        return (
                            <Link href={href} key={label} className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}>
                                {label}
                            </Link>
                        )
                    })}

                    <div className="flex gap-7.5 items-center">
                        <SignedOut>
                            {/* 點擊時會開啟 Clerk 的登入 modal 視窗，而不是跳轉頁面。 */}
                            <SignInButton mode="modal" />
                        </SignedOut>
                        <SignedIn>
                            <div className="nav-user-link">
                                <UserButton />
                                {/* 只有當 user 存在且有 firstName 時才會顯示連結。 */}
                                {user?.firstName && (
                                    <Link href="/subscriptions" className="nav-user-name">
                                        {user.firstName}
                                    </Link>
                                )}
                            </div>
                        </SignedIn>
                    </div>
                </nav>
            </div>
        </header>
    )
}

export default Navbar
