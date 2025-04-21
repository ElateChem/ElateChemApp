export const siteConfig = {
  name: "Elate Chem",
  url: "https://elatechem.com",
  description: "Effective & user-friendly chemical sourcing platform for buyers.",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
  ],
  links: {
    twitter: "",
    linkedin: "",
  },
};

export const seoConfig: Record<string, PageSeo> = {
  "/": {
    title: "Elate Chem",
    description: "Effective & user-friendly chemical sourcing platform for buyers. Bulk Chemicals are the fundamental substances used in chemical manufacturing, acting as building blocks for a wide range of products. These materials are often derived from natural resources like fossil fuels, air, water, and minerals. Examples include Acetone, Phenol, Octanol, Isobutanol, Iso Propyl alcohol, Benzene, Toluene, Xylene, ammonia, methanol, hydrochloric acid, sulfuric acid, benzene, ethene, phosphoric acid, sodium carbonate, calcium chloride, chlorine, hydrogen, sulfur, and butadiene.",
    keywords: ["chemicals", "manufacturing", "industry"],
    icon: "/icons/icon.png",
  },
  "/about": {
    title: "About Us",
    description: "Being Procurement Professional, we are aware how important is sourcing to get right product from right source. We are providing data of all relevant suppliers from India, China, Japan, Korea, Taiwan, US and other countries which help you to add more value at your work. we are providing vendor data base for all key materials lie Petrochemicals, Bulk materials, Agrochemicals, Specialty chemicals.",
    keywords: ["about", "history", "team"],
    icon: "/icons/icon.png",
  },
  "/contact": {
    title: "Contact Now",
    description: "Get in touch with our expert team. Get enquiry related business and promotion offers. Contact Now",
    keywords: ["contact", "support", "help"],
    icon: "/icons/icon.png",
  },
  "/login": {
    title: "Secure Login",
    description: "Access your account",
    keywords: ["login", "security", "account"],
    noIndex: true,
    icon: "/icons/icon.png",
  },
  "/dashboard": {
    title: "User Dashboard",
    description: "Manage your account",
    keywords: ["dashboard", "management", "tools"],
    noIndex: true,
    icon: "/icons/icon.png",
  },
};

export type PageSeo = {
  title: string
  description: string
  keywords: string[]
  noIndex?: boolean
  icon: string         // ← new
}