import { CSSProperties } from "react";

/**
 * Elegant vector placeholder art per category, so the storefront looks
 * complete before real product photography is added. Drop real images into
 * /public and reference them from Product.images to replace these.
 */
export function ProductImage({
  category,
  gem,
  className,
  style,
}: {
  category: string;
  gem?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background:
          "radial-gradient(120% 120% at 50% 20%, #1c1c22 0%, #101014 70%)",
        ...style,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        role="img"
        aria-label={`${category} illustration`}
      >
        <defs>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e3cd9c" />
            <stop offset="50%" stopColor="#c8a96a" />
            <stop offset="100%" stopColor="#a5854b" />
          </linearGradient>
          <radialGradient id="shine" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Art category={category} hasGem={!!gem} />
      </svg>
    </div>
  );
}

function Gem({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#metal)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#shine)" />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.25} fill="#fff" opacity="0.85" />
    </g>
  );
}

function Art({ category, hasGem }: { category: string; hasGem: boolean }) {
  const stroke = "url(#metal)";
  if (category === "earrings") {
    return (
      <g fill="none" stroke={stroke} strokeWidth={4}>
        <circle cx={70} cy={115} r={42} />
        <circle cx={130} cy={115} r={42} />
        <line x1={70} y1={73} x2={70} y2={58} strokeLinecap="round" />
        <line x1={130} y1={73} x2={130} y2={58} strokeLinecap="round" />
        {hasGem && (
          <>
            <g stroke="none">
              <Gem cx={70} cy={157} r={5} />
              <Gem cx={130} cy={157} r={5} />
            </g>
          </>
        )}
      </g>
    );
  }
  if (category === "crosses") {
    return (
      <g>
        <g fill="none" stroke={stroke} strokeWidth={12} strokeLinecap="round">
          <line x1={100} y1={40} x2={100} y2={160} />
          <line x1={62} y1={82} x2={138} y2={82} />
        </g>
        {hasGem && (
          <g stroke="none">
            <Gem cx={100} cy={82} r={7} />
          </g>
        )}
      </g>
    );
  }
  // rings (default)
  return (
    <g>
      <ellipse
        cx={100}
        cy={120}
        rx={55}
        ry={55}
        fill="none"
        stroke={stroke}
        strokeWidth={9}
      />
      {hasGem ? (
        <g stroke="none">
          <path d="M100 44 l14 20 -14 16 -14 -16 z" fill="url(#metal)" />
          <path d="M100 44 l14 20 -14 16 z" fill="#fff" opacity="0.35" />
        </g>
      ) : (
        <path
          d="M70 92 q30 -34 60 0"
          fill="none"
          stroke={stroke}
          strokeWidth={9}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}
