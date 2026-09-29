import Link from "next/link";
import { ArrowLeft, GraduationCap, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 size-80 rounded-full bg-orange-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 size-96 rounded-full bg-sky-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold tracking-tight">Edu Soft</span>
      </header>

      <section className="relative mx-auto flex w-full max-w-6xl items-center py-14 sm:py-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300">
            <SearchX className="size-4 text-orange-400" aria-hidden="true" />
            Error 404
          </div>
          <p className="select-none text-[clamp(7rem,25vw,16rem)] font-black leading-[0.72] tracking-[-0.09em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.28)]">
            404
          </p>
          <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-5xl">
            This page has moved on.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            The address may be incorrect, or the page may no longer be available in your institution portal.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="size-4" aria-hidden="true" />
                Return home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Go to sign in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 text-sm text-slate-400">
        <span>Edu Soft · School management made simple</span>
        <Link href="/" className="font-medium text-slate-300 transition hover:text-orange-400">
          Back to safety
        </Link>
      </footer>
    </main>
  );
}
