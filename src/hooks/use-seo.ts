"use client";

import { useEffect } from "react";
import { seoConfig, siteConfig } from "@/config/seo";
import { usePathname } from "next/navigation";

export const useSEO = () => {
  const pathname = usePathname();
  const meta = seoConfig[pathname] || seoConfig["/"];

  useEffect(() => {
    // 1) title + meta tags
    document.title = meta.title;
    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[name="keywords"]', "content", meta.keywords.join(", "));
    if (meta.noIndex) {
      setMeta('meta[name="robots"]', "content", "noindex");
    }

    // 2) favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "icon");
      document.head.appendChild(link);
    }
    link.setAttribute("href", meta.icon);
  }, [pathname, meta]);


  return meta;
};