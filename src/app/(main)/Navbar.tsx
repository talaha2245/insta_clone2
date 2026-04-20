import SearchField from "@/components/SearchField";
import UserButton from "@/components/UserButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-2xl border border-border bg-background/95 px-6 backdrop-blur shadow-lg supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-all hover:opacity-80">
              theInsta
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center max-w-md">
          <SearchField />
        </div>

        <div className="flex items-center justify-end gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
