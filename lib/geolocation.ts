export interface UserLocation {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

const STORAGE_KEY = "luma:location";
const DEFAULT_LOCATION: UserLocation = {
  name: "Paris, France",
  latitude: 48.8566,
  longitude: 2.3522,
  elevation: 35,
};

export function loadStoredLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocation(loc: UserLocation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // ignore quota errors
  }
}

export function requestBrowserGeolocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation API unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          name: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          elevation: pos.coords.altitude ?? 0,
        });
      },
      (err) => reject(err),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export async function resolveInitialLocation(): Promise<UserLocation> {
  const stored = loadStoredLocation();
  if (stored) return stored;
  try {
    const live = await requestBrowserGeolocation();
    saveLocation(live);
    return live;
  } catch {
    return DEFAULT_LOCATION;
  }
}

export { DEFAULT_LOCATION };
