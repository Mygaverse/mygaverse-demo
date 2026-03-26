import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/scriptoplay/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { w: 30, h: 30, text: "text-lg" },
    md: { w: 40, h: 40, text: "text-xl" },
    lg: { w: 60, h: 60, text: "text-3xl" },
  };

  const { w, h, text } = sizes[size];

  return (
    <Link href="/scriptoplay/dashboard" className={cn("flex items-center gap-3 hover:opacity-90 transition-opacity", className)}>
      <div className="relative">
        <Image
          src="/images/logo-icon.png"
          alt="Scriptoplay"
          width={w}
          height={h}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-white", text)}>
          Scriptoplay
        </span>
      )}
    </Link>
  );
}
