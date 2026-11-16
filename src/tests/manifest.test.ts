import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("names the installed app and starts it at the site root", () => {
    expect(manifest()).toMatchObject({
      name: "Boximity MSP — IT That Just Works",
      short_name: "Boximity MSP",
      start_url: "/",
      display: "standalone",
    });
  });

  it("ships the icon sizes an installable PWA needs", () => {
    expect(manifest().icons).toEqual([
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // The oxford tile keeps the pin inside the maskable safe zone, so the
      // same 512 px file serves as the maskable icon.
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("describes the business and paints the install splash white", () => {
    expect(manifest()).toMatchObject({
      description:
        "Enter it once. Get it right. Bill it on time. Managed IT that connects your business.",
      background_color: "#ffffff",
      theme_color: "#ffffff",
    });
  });
});
