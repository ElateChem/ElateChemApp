"use client";

import { useSEO } from "@/hooks/use-seo";

export default function SeoProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useSEO(); // This handles dynamic updates
  
  return <>{children}</>;
}