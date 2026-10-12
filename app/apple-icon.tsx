import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A2540",
          color: "#ffffff",
          fontSize: 84,
          fontWeight: 700,
          borderRadius: 0,
          letterSpacing: -1,
        }}
      >
        M<span style={{ color: "#2DD4BF" }}>S</span>
      </div>
    ),
    size
  );
}
