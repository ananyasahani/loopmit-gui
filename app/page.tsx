import Image from "next/image";
import TempDisplay from "@/components/tempDisplay";
import STLViewer from "@/components/stl_view";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white sm:text-5xl">
          Real-Time Temperature Monitor
        </h1>
        <div><TempDisplay /><STLViewer/></div>
      </main>
    </div>
  );
}
