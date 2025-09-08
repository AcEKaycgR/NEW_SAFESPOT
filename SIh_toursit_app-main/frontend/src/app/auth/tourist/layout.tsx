import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold">
        <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="font-headline">SafeSpot</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
