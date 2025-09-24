import { SITE } from "@/data/constants";

export default function sitemap() {
  const routes = [
    {
      url: SITE.url,
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: `${SITE.url}/about`,
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: `${SITE.url}/contact`,
      lastModified: new Date().toISOString().split("T")[0],
    },
  ];

  return routes;
}
