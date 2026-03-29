export type SharedMapRegion = "world" | "europe" | "usa" | "india";

export type CityCatalogEntry = {
  canonical: string;
  aliases: string[];
  region: SharedMapRegion;
};

export const normalizeLocationKey = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const CITY_CATALOG: readonly CityCatalogEntry[] = [
  {
    canonical: "San Francisco",
    aliases: ["san francisco", "sf"],
    region: "usa",
  },
  { canonical: "New York", aliases: ["new york"], region: "usa" },
  { canonical: "Los Angeles", aliases: ["los angeles"], region: "usa" },
  { canonical: "Seattle", aliases: ["seattle"], region: "usa" },
  { canonical: "Austin", aliases: ["austin"], region: "usa" },
  { canonical: "Chicago", aliases: ["chicago"], region: "usa" },
  { canonical: "Boston", aliases: ["boston"], region: "usa" },
  { canonical: "Toronto", aliases: ["toronto"], region: "world" },
  { canonical: "London", aliases: ["london"], region: "europe" },
  { canonical: "Paris", aliases: ["paris"], region: "europe" },
  { canonical: "Berlin", aliases: ["berlin"], region: "europe" },
  { canonical: "Amsterdam", aliases: ["amsterdam"], region: "europe" },
  { canonical: "Madrid", aliases: ["madrid"], region: "europe" },
  { canonical: "Rotterdam", aliases: ["rotterdam"], region: "europe" },
  { canonical: "Dubai", aliases: ["dubai"], region: "world" },
  { canonical: "Riyadh", aliases: ["riyadh"], region: "world" },
  { canonical: "Mumbai", aliases: ["mumbai"], region: "india" },
  {
    canonical: "Bangalore",
    aliases: ["bangalore", "bengaluru"],
    region: "india",
  },
  { canonical: "Hyderabad", aliases: ["hyderabad"], region: "india" },
  { canonical: "Chennai", aliases: ["chennai"], region: "india" },
  { canonical: "Pune", aliases: ["pune"], region: "india" },
  { canonical: "Delhi", aliases: ["delhi", "delhi ncr"], region: "india" },
  { canonical: "Singapore", aliases: ["singapore"], region: "world" },
  { canonical: "Tokyo", aliases: ["tokyo"], region: "world" },
  { canonical: "Seoul", aliases: ["seoul"], region: "world" },
  { canonical: "Hong Kong", aliases: ["hong kong"], region: "world" },
  { canonical: "Sydney", aliases: ["sydney"], region: "world" },
  { canonical: "Melbourne", aliases: ["melbourne"], region: "world" },
  { canonical: "Jakarta", aliases: ["jakarta"], region: "world" },
  { canonical: "Shanghai", aliases: ["shanghai"], region: "world" },
  { canonical: "Sao Paulo", aliases: ["sao paulo"], region: "world" },
  {
    canonical: "Mexico City",
    aliases: ["mexico city", "ciudad de mexico"],
    region: "world",
  },
] as const;

const canonicalCoordinates: Record<string, [number, number]> = {
  "San Francisco": [-122.4194, 37.7749],
  "New York": [-74.006, 40.7128],
  "Los Angeles": [-118.2437, 34.0522],
  Seattle: [-122.3321, 47.6062],
  Austin: [-97.7431, 30.2672],
  Chicago: [-87.6298, 41.8781],
  Boston: [-71.0589, 42.3601],
  Toronto: [-79.3832, 43.6532],
  London: [-0.1276, 51.5072],
  Paris: [2.3522, 48.8566],
  Berlin: [13.405, 52.52],
  Amsterdam: [4.9041, 52.3676],
  Madrid: [-3.7038, 40.4168],
  Rotterdam: [4.4777, 51.9244],
  Dubai: [55.2708, 25.2048],
  Riyadh: [46.6753, 24.7136],
  Mumbai: [72.8777, 19.076],
  Bangalore: [77.5946, 12.9716],
  Hyderabad: [78.4867, 17.385],
  Chennai: [80.2707, 13.0827],
  Pune: [73.8567, 18.5204],
  Delhi: [77.1025, 28.7041],
  Singapore: [103.8198, 1.3521],
  Tokyo: [139.6917, 35.6895],
  Seoul: [126.978, 37.5665],
  "Hong Kong": [114.1694, 22.3193],
  Sydney: [151.2093, -33.8688],
  Melbourne: [144.9631, -37.8136],
  Jakarta: [106.8456, -6.2088],
  Shanghai: [121.4737, 31.2304],
  "Sao Paulo": [-46.6333, -23.5505],
  "Mexico City": [-99.1332, 19.4326],
};

export const CITY_COORDINATES: Record<string, [number, number]> =
  CITY_CATALOG.reduce<Record<string, [number, number]>>((acc, entry) => {
    const coordinates = canonicalCoordinates[entry.canonical];

    if (!coordinates) {
      return acc;
    }

    acc[normalizeLocationKey(entry.canonical)] = coordinates;
    entry.aliases.forEach((alias) => {
      acc[normalizeLocationKey(alias)] = coordinates;
    });
    return acc;
  }, {});

export const CITY_FALLBACK_COORDS: Record<string, { x: number; y: number }> = {
  "San Francisco": { x: 18, y: 40 },
  "New York": { x: 24, y: 34 },
  "Los Angeles": { x: 14, y: 39 },
  Seattle: { x: 16, y: 31 },
  Austin: { x: 21, y: 43 },
  Chicago: { x: 23, y: 35 },
  Boston: { x: 25, y: 33 },
  Toronto: { x: 26, y: 31 },
  London: { x: 47, y: 27 },
  Paris: { x: 45, y: 29 },
  Berlin: { x: 49, y: 26 },
  Amsterdam: { x: 46, y: 25 },
  Madrid: { x: 42, y: 33 },
  Rotterdam: { x: 46, y: 24 },
  Dubai: { x: 57, y: 43 },
  Riyadh: { x: 54, y: 44 },
  Mumbai: { x: 60, y: 48 },
  Bangalore: { x: 60, y: 56 },
  Hyderabad: { x: 61, y: 52 },
  Chennai: { x: 64, y: 57 },
  Pune: { x: 58, y: 53 },
  Delhi: { x: 60, y: 45 },
  Singapore: { x: 68, y: 58 },
  Tokyo: { x: 81, y: 35 },
  Seoul: { x: 78, y: 33 },
  "Hong Kong": { x: 74, y: 47 },
  Sydney: { x: 85, y: 72 },
  Melbourne: { x: 83, y: 76 },
  Jakarta: { x: 72, y: 64 },
  Shanghai: { x: 76, y: 40 },
  "Sao Paulo": { x: 32, y: 77 },
  "Mexico City": { x: 18, y: 48 },
};
