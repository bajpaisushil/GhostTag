import QRCode from "qrcode";
import { env } from "./env";

export function tagUrl(token: string): string {
  return `${env.appUrl()}/t/${token}`;
}

// Render the tag's scan URL as a PNG data URL we can drop into an <img>.
export async function tagQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(tagUrl(token), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
