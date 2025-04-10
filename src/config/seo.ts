export const siteConfig = {
    name: "Elate Chem",
    url: "https://elatechem.com",
    description: "Global leader in chemical manufacturing and distribution",
    mainNav: [
      { title: "Home", href: "/" },
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
    links: {
      twitter: "https://twitter.com/elatechem",
      linkedin: "https://linkedin.com/company/elatechem",
    },
  };
  
  export const seoConfig = {
    "/": {
      title: "Innovative Chemical Solutions",
      description: "20+ years of industry expertise in chemical manufacturing",
      keywords: ["chemicals", "manufacturing", "industry"],
    },
    "/about": {
      title: "About Our Company",
      description: "Learn about our history and mission",
      keywords: ["about", "history", "team"],
    },
    "/contact": {
      title: "Contact Our Team",
      description: "Get in touch with our experts",
      keywords: ["contact", "support", "help"],
    },
    "/login": {
      title: "Secure Login",
      description: "Access your account",
      keywords: ["login", "security", "account"],
      noIndex: true,
    },
    "/dashboard": {
      title: "User Dashboard",
      description: "Manage your account",
      keywords: ["dashboard", "management", "tools"],
      noIndex: true,
    },
  };
  
  export type SeoConfig = typeof seoConfig;