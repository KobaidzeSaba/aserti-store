import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/baseUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep admin, checkout callbacks and the mock pay page out of the index.
      disallow: ["/api/", "/*/admin", "/*/sandbox/", "/*/checkout", "/*/order/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
