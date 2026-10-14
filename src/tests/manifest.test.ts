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
        "For businesses that live outside the office, we replace break-fix firefighting with technology that just works \u2014 one flat price, no surprises.",
      background_color: "#ffffff",
      theme_color: "#ffffff",
    });
  });
});
