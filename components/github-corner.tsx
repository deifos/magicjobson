"use client";

import { Github } from "lucide-react";
import Link from "next/link";

export function GitHubCorner() {
  return (
    <Link
      href="https://github.com/deifos/magicjobson"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-0 right-0 z-50"
    >
      <div className="relative group">
        <div className="w-[120px] h-[80px] bg-[#ff6b6b] transform rotate-45 translate-x-[42px] translate-y-[-42px] transition-colors duration-200 group-hover:bg-[#ff8585]" />
        <Github className="absolute top-[16px] right-[16px] h-6 w-6 text-[#1a1a1a] transform rotate-45 transition-transform duration-200 group-hover:rotate-[60deg]" />
      </div>
    </Link>
  );
}
