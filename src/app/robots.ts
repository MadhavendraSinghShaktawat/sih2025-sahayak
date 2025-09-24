import { SITE } from "@/data/constants";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
