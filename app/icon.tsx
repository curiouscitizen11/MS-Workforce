import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1a2e",
          color: "#ffffff",
          fontSize: 30,
          fontWeight: 700,
          borderRadius: 14,
          letterSpacing: -1,
        }}
      >
        M<span style={{ color: "#2DD4BF" }}>S</span>
      </div>
    ),
    size
  );
}
