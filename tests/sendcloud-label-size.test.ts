import { describe, expect, it } from "vitest";
import { extractSendcloudLabelUrl } from "@/lib/shipping/pricing/sendcloud-mappers";

const parcel = {
  label: {
    label_printer: "https://panel.sendcloud.sc/api/v2/label/label_printer/1234",
    normal_printer: [
      "https://panel.sendcloud.sc/api/v2/label/normal_printer/1234?start_from=0",
      "https://panel.sendcloud.sc/api/v2/label/normal_printer/1234?start_from=1",
    ],
  },
  documents: [{ type: "label", link: "https://panel.sendcloud.sc/api/v2/documents/label/1234" }],
};

describe("Sendcloud label URL selection", () => {
  it("defaults to label_printer (4×6 thermal) for thermal_4x6", () => {
    expect(extractSendcloudLabelUrl(parcel, "thermal_4x6")).toBe(parcel.label.label_printer);
  });

  it("uses normal_printer (A4) when seller selects a4_pdf", () => {
    expect(extractSendcloudLabelUrl(parcel, "a4_pdf")).toBe(parcel.label.normal_printer?.[0]);
  });

  it("falls back to label_printer when A4 is unavailable", () => {
    const thermalOnly = {
      label: { label_printer: parcel.label.label_printer },
    };
    expect(extractSendcloudLabelUrl(thermalOnly, "a4_pdf")).toBe(parcel.label.label_printer);
  });
});
