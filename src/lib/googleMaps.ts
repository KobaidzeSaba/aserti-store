/**
 * Lazily load the Google Maps JS API (Places library) in the browser.
 * Resolves with the `google` global, or null when no API key is configured or
 * the script fails — so the checkout degrades gracefully to plain text inputs.
 */
let loader: Promise<unknown | null> | null = null;

export function loadGoogleMaps(): Promise<unknown | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.resolve(null);

  const w = window as unknown as { google?: { maps?: { places?: unknown } } };
  if (w.google?.maps?.places) return Promise.resolve(w.google);
  if (loader) return loader;

  loader = new Promise((resolve) => {
    const cbName = `__asertiGmaps_${Date.now()}`;
    (window as unknown as Record<string, unknown>)[cbName] = () => resolve(w.google);
    const s = document.createElement("script");
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&libraries=places&loading=async&callback=${cbName}`;
    s.async = true;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return loader;
}
