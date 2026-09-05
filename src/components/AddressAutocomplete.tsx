"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

export type AddressSelection = {
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

/**
 * Address field with autocomplete + geocoding for delivery automation.
 *
 * - If NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set → uses Google Places.
 * - Otherwise → uses Photon (photon.komoot.io, OpenStreetMap) which is free
 *   and needs no API key, so autocomplete works out of the box for a demo.
 *
 * Either way, selecting a result fills the street + city and reports precise
 * latitude/longitude via onSelect.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className,
  placeholder,
  verified = false,
  verifiedLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: AddressSelection) => void;
  className?: string;
  placeholder?: string;
  /** True once coordinates have been captured for this address. */
  verified?: boolean;
  verifiedLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [usingGoogle, setUsingGoogle] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Places (only when a key is configured).
  useEffect(() => {
    let ac: any;
    let google: any;
    loadGoogleMaps().then((g: any) => {
      if (!g || !inputRef.current) return;
      google = g;
      setUsingGoogle(true);
      ac = new g.maps.places.Autocomplete(inputRef.current, {
        fields: ["address_components", "geometry", "formatted_address"],
        componentRestrictions: { country: "ge" },
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const comps: any[] = place.address_components || [];
        const get = (t: string) =>
          comps.find((c) => c.types.includes(t))?.long_name || "";
        const street = [get("route"), get("street_number")]
          .filter(Boolean)
          .join(" ");
        const city = get("locality") || get("administrative_area_level_1");
        const loc = place.geometry?.location;
        const address = street || place.formatted_address || "";
        onChange(address);
        onSelect({
          address,
          city,
          latitude: loc?.lat(),
          longitude: loc?.lng(),
        });
      });
    });
    return () => {
      if (ac && google) google.maps.event.clearInstanceListeners(ac);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleType(v: string) {
    onChange(v);
    if (usingGoogle) return; // Google renders its own dropdown
    if (debounce.current) clearTimeout(debounce.current);
    if (v.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        // Bias toward Georgia (Tbilisi) and prefer GE results.
        const url =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}` +
          `&lang=en&limit=5&lat=41.72&lon=44.79`;
        const res = await fetch(url);
        const data = await res.json();
        const feats: any[] = data.features || [];
        const ge = feats.filter(
          (f) =>
            f.properties?.countrycode === "GE" ||
            f.properties?.country === "Georgia",
        );
        setSuggestions(ge.length ? ge : feats);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function pick(f: any) {
    const p = f.properties || {};
    const street =
      [p.street || p.name, p.housenumber].filter(Boolean).join(" ") ||
      p.name ||
      "";
    const city = p.city || p.county || p.state || "";
    const coords: number[] = f.geometry?.coordinates || [];
    onChange(street);
    onSelect({
      address: street,
      city,
      latitude: coords[1],
      longitude: coords[0],
    });
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={className}
        value={value}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        placeholder={placeholder}
        style={verified ? { paddingRight: "2.25rem" } : undefined}
      />
      {verified && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-3 text-champagne"
          title={verifiedLabel}
        >
          {/* map-pin + check, monochrome */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <path d="M9 10l2 2 4-4" />
          </svg>
        </span>
      )}
      {verified && verifiedLabel && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs tracking-luxe text-champagne">
          {verifiedLabel}
        </p>
      )}
      {open && !usingGoogle && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-silver-muted/30 bg-ink-soft shadow-lg">
          {suggestions.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(f);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-silver hover:bg-champagne/10"
              >
                {label(f.properties)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function label(p: any): string {
  return [
    p.name,
    p.street && p.street !== p.name ? p.street : null,
    p.housenumber,
    p.city,
    p.country,
  ]
    .filter(Boolean)
    .join(", ");
}
