"use client";

import { useEffect } from "react";
import { seoConfig, siteConfig } from "@/config/seo";
import { usePathname } from "next/navigation";

export const useSEO = () => {
  const pathname = usePathname();
  const meta = seoConfig[pathname as keyof typeof seoConfig] || seoConfig["/"];

  useEffect(() => {
    // Update document title
    document.title = `${meta.title} | ${siteConfig.name}`;
    
    // Update meta tags dynamically
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", meta.description);
    }

    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) {
      keywordsTag.setAttribute("content", meta.keywords.join(", "));
    }
  }, [pathname, meta]);

  return meta;
};