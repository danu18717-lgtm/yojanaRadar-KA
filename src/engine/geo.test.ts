import { describe, it, expect } from "vitest";
import { haversineKm, sortByDistance, filterByPincodeOrDistrict } from "./geo";
import type { Center } from "../types";

const testCenters: Center[] = [
  {
    id: "t-1",
    type: "Grama One",
    name: "Test Centre Alpha",
    address: "1 Main Road, Bengaluru",
    pincode: "560070",
    district: "Bengaluru Urban",
    lat: 12.9716,
    lng: 77.5946,
    timings: "10:00 - 17:00",
    phone: "080-00000001",
    mapsUrl: "https://maps.google.com/?q=alpha",
  },
  {
    id: "t-2",
    type: "Karnataka One",
    name: "Test Centre Beta",
    address: "2 Palace Road, Mysuru",
    pincode: "570001",
    district: "Mysuru",
    lat: 12.2958,
    lng: 76.6394,
    timings: "10:00 - 17:00",
    phone: "0821-00000002",
    mapsUrl: "https://maps.google.com/?q=beta",
  },
];

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
  });

  it("returns roughly 125-150 km from Bengaluru to Mysuru", () => {
    const d = haversineKm(12.9716, 77.5946, 12.2958, 76.6394);
    expect(d).toBeGreaterThan(125);
    expect(d).toBeLessThan(150);
  });
});

describe("sortByDistance", () => {
  it("returns centers in ascending distanceKm order", () => {
    const sorted = sortByDistance(testCenters, 12.2958, 76.6394);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe("t-2");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].distanceKm).toBeGreaterThanOrEqual(sorted[i - 1].distanceKm);
    }
  });
});

describe("filterByPincodeOrDistrict", () => {
  it("matches a 6-digit query against pincode exactly", () => {
    const result = filterByPincodeOrDistrict(testCenters, "560070");
    expect(result).toHaveLength(1);
    expect(result.every((c) => c.pincode === "560070")).toBe(true);
  });

  it("matches a district name case-insensitively", () => {
    const result = filterByPincodeOrDistrict(testCenters, "mysuru");
    expect(result).toHaveLength(1);
    expect(result[0].district).toBe("Mysuru");
  });
});
