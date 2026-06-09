import { distance, point } from "@turf/turf";

export type StationGeofenceSnapshot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export type StationGeofenceMatch = {
  station: StationGeofenceSnapshot;
  distanceMeters: number;
};

export const getDistanceToStationMeters = (
  station: StationGeofenceSnapshot,
  lat: number,
  lng: number,
) => {
  const busPoint = point([lng, lat]);
  const stationPoint = point([station.longitude, station.latitude]);
  const distanceKm = distance(busPoint, stationPoint, {
    units: "kilometers",
  });

  return distanceKm * 1000;
};

export const findStationInRange = (
  stations: StationGeofenceSnapshot[],
  lat: number,
  lng: number,
  options: { radiusMarginMeters?: number } = {},
): StationGeofenceMatch | null => {
  const radiusMarginMeters = options.radiusMarginMeters ?? 0;
  let nearest: StationGeofenceMatch | null = null;

  for (const station of stations) {
    const distanceMeters = getDistanceToStationMeters(station, lat, lng);
    const maxDistanceMeters = station.radius + radiusMarginMeters;

    if (
      distanceMeters <= maxDistanceMeters &&
      (!nearest || distanceMeters < nearest.distanceMeters)
    ) {
      nearest = {
        station,
        distanceMeters,
      };
    }
  }

  return nearest;
};
