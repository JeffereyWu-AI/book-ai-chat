// 路由 /books/new 的頁面組件，也就是你在 Navbar 裡點「Add New」會到的那一頁。

import UploadForm from "@/components/UploadForm";

const Page = () => {
    return (
        <main className="new-book">
            <section className="flex flex-col gap-5 text-center">
                <h1 className="page-title-xl">Add a New Book</h1>
                <p className="subtitle">Upload a PDF to generate your  interactive reading experience</p>
            </section>

            <UploadForm />
        </main>
    )
}

export default Page
