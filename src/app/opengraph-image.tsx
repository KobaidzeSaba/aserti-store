import { ImageResponse } from "next/og";

// Branded social-share image using the exhibition palette and controlled type.
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
            fontSize: 220,
            letterSpacing: -15,
            color: "#f0f0ec",
            fontWeight: 500,
          }}
        >
          ASERTI
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 18,
            letterSpacing: 3,
            color: "#808080",
          }}
        >
          ORDER IN CHAOS · 101
        </div>
      </div>
    ),
    { ...size },
  );
}
