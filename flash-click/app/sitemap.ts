import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://flash-click.vercel.app",
      lastModified: new Date(),
    },
  ];
}
