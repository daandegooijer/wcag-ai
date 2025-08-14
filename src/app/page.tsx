import Form from "./Form";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-2xl">
        <section className="w-full bg-white dark:bg-[#18181b] rounded-xl shadow p-6 flex flex-col gap-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2">WCAG Text Checker</h2>
          <Form />
        </section>
      </main>
    </div>
  );
}
