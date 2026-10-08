import { ImageResponse } from "next/og";

export const alt = "MS Workforce: construction labour hire across Greater Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A2540",
          color: "#ffffff",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
            MS <span style={{ color: "#0D9488", margin: "0 14px" }}>|</span> WORKFORCE
          </div>
          <div style={{ fontSize: 18, letterSpacing: 6, opacity: 0.7, marginTop: 8 }}>
            LABOUR HIRE
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
            Construction labour, on site when you need them.
          </div>
          <div style={{ fontSize: 30, marginTop: 28, color: "#99DFD7" }}>
            General labourers, trade assistants and site support across Greater Sydney.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
