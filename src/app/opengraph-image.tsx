import { ImageResponse } from "next/og";

// Branded social-share image (link previews). Matches the ASERTI wordmark:
// white, letter-spaced, on pure black, with the "Order in Chaos" line.
export const runtime = "edge";
export const alt = "ASERTI — Order in Chaos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 120,
            letterSpacing: 40,
            color: "#ffffff",
            fontWeight: 500,
          }}
        >
          ASERTI
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 30,
            letterSpacing: 14,
            color: "#808080",
          }}
        >
          ORDER IN CHAOS
        </div>
      </div>
    ),
    { ...size },
  );
}
