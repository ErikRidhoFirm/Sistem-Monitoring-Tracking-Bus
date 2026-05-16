import type { MutableRefObject, RefObject } from "react";
import { useEffect, useRef } from "react";

import {
  type BusTelemetry,
  type Coordinate,
  createRealtimeBusFeed,
} from "@/lib/realtime-bus-feed";
import {
  MAP_STYLE_URLS,
  type MapStyleKey,
  type RealtimeMapRoute,
  type RealtimeMapStation,
} from "@/lib/realtime-map-types";
import { buildBusPopupHtml, pickRouteColor } from "@/lib/realtime-map-utils";

function buildStationMarkerSvgDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
      <defs>
        <filter id="station-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f3d36" flood-opacity="0.28" />
        </filter>
      </defs>
      <g filter="url(#station-shadow)">
        <path d="M26 4C17.72 4 11 10.72 11 19c0 10.4 12.2 23.7 14.1 25.72a1.2 1.2 0 0 0 1.8 0C28.8 42.7 41 29.4 41 19 41 10.72 34.28 4 26 4z" fill="#22c55e" stroke="#0f5132" stroke-width="2" />
        <circle cx="26" cy="19" r="7" fill="#f0fdf4" stroke="#14532d" stroke-width="2" />
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildBusMarkerSvgDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58">
      <defs>
        <filter id="bus-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#7c2d12" flood-opacity="0.3" />
        </filter>
      </defs>
      <g transform="translate(3 8)" filter="url(#bus-shadow)">
        <rect x="4" y="4" width="44" height="30" rx="8" fill="#f97316" stroke="#7c2d12" stroke-width="2" />
        <rect x="10" y="10" width="14" height="8" rx="2" fill="#fff7ed" />
        <rect x="28" y="10" width="14" height="8" rx="2" fill="#fff7ed" />
        <rect x="20" y="22" width="12" height="6" rx="2" fill="#ffedd5" />
        <circle cx="14" cy="36" r="5" fill="#111827" />
        <circle cx="38" cy="36" r="5" fill="#111827" />
        <circle cx="14" cy="36" r="2" fill="#e5e7eb" />
        <circle cx="38" cy="36" r="2" fill="#e5e7eb" />
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat marker icon"));
    image.src = dataUrl;
  });
}

async function ensureMapImage({
  map,
  imageId,
  markerSvgDataUrl,
  iconNode,
}: {
  map: import("mapbox-gl").Map;
  imageId: string;
  markerSvgDataUrl?: string;
  iconNode?: unknown;
}) {
  let resolvedMarkerSvgDataUrl = markerSvgDataUrl;

  if (!resolvedMarkerSvgDataUrl) {
    if (imageId === "station-lucide-icon" || iconNode === mapPinIconNode) {
      resolvedMarkerSvgDataUrl = buildStationMarkerSvgDataUrl();
    } else if (imageId === "bus-lucide-icon" || iconNode === busFrontIconNode) {
      resolvedMarkerSvgDataUrl = buildBusMarkerSvgDataUrl();
    }
  }

  if (!resolvedMarkerSvgDataUrl) {
    return;
  }

  if (map.hasImage(imageId)) {
    return;
  }

  const image = await loadImageFromDataUrl(resolvedMarkerSvgDataUrl);
  if (!map.hasImage(imageId)) {
    map.addImage(imageId, image, { pixelRatio: 2 });
  }
}

const mapPinIconNode = Symbol("legacy-map-pin-icon");
const busFrontIconNode = Symbol("legacy-bus-front-icon");

type UseRealtimeMapRendererParams = {
  mapRef: RefObject<HTMLDivElement | null>;
  routes: RealtimeMapRoute[];
  busCodeById: Record<string, string>;
  busStatusById: Record<string, string>;
  busStationById: Record<string, string>;
  busPassengersById: Record<string, number>;
  busMaxPassengersById: Record<string, number>;
  activeRouteStations: RealtimeMapStation[];
  activeRouteId: string | null;
  activeRouteCoordinates: Coordinate[];
  activeStopNames: string[];
  allStations: RealtimeMapStation[];
  hasMapData: boolean;
  mapStyle: MapStyleKey;
  isTiltedView: boolean;
  token?: string;
  userLocationRef: MutableRefObject<Coordinate | null>;
  onTokenMissingChange: (value: boolean) => void;
  onBusTelemetry?: (payload: BusTelemetry) => void;
  onFeedStatusChange?: (
    status: "connected" | "connecting" | "disconnected",
  ) => void;
};

function upsertUserLocationSource(
  map: import("mapbox-gl").Map,
  coords: Coordinate,
) {
  const sourceId = "user-location";
  const outerLayerId = "user-location-outer";
  const innerLayerId = "user-location-inner";
  const data = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: coords,
        },
      },
    ],
  };

  const existingSource = map.getSource(sourceId) as
    | import("mapbox-gl").GeoJSONSource
    | undefined;

  if (existingSource) {
    existingSource.setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
  });

  map.addLayer({
    id: outerLayerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": 15,
      "circle-color": "#245bb0",
      "circle-opacity": 0.22,
    },
  });

  map.addLayer({
    id: innerLayerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": 7,
      "circle-color": "#245bb0",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 3,
    },
  });
}

export function useRealtimeMapRenderer({
  mapRef,
  routes,
  busCodeById,
  busStatusById,
  busStationById,
  busPassengersById,
  busMaxPassengersById,
  activeRouteStations,
  activeRouteId,
  activeRouteCoordinates,
  activeStopNames,
  allStations,
  hasMapData,
  mapStyle,
  isTiltedView,
  token,
  userLocationRef,
  onTokenMissingChange,
  onBusTelemetry,
  onFeedStatusChange,
}: UseRealtimeMapRendererParams) {
  const mapInstanceRef = useRef<import("mapbox-gl").Map | null>(null);
  const activeBusIdRef = useRef<string | null>(null);
  const busCodeByIdRef = useRef(busCodeById);
  const busStatusByIdRef = useRef(busStatusById);
  const busStationByIdRef = useRef(busStationById);
  const busPassengersByIdRef = useRef(busPassengersById);
  const busMaxPassengersByIdRef = useRef(busMaxPassengersById);
  const isPopupPinnedRef = useRef(false);

  useEffect(() => {
    busCodeByIdRef.current = busCodeById;
  }, [busCodeById]);

  useEffect(() => {
    busStatusByIdRef.current = busStatusById;
  }, [busStatusById]);

  useEffect(() => {
    busStationByIdRef.current = busStationById;
  }, [busStationById]);

  useEffect(() => {
    busPassengersByIdRef.current = busPassengersById;
  }, [busPassengersById]);

  useEffect(() => {
    busMaxPassengersByIdRef.current = busMaxPassengersById;
  }, [busMaxPassengersById]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!hasMapData) {
      return;
    }

    if (!token) {
      onTokenMissingChange(true);
      return;
    }
    onTokenMissingChange(false);

    let map: import("mapbox-gl").Map | null = null;
    let stopFeed: (() => void) | null = null;
    let popup: import("mapbox-gl").Popup | null = null;
    let lastCameraFollowAt = 0;
    let mounted = true;
    let animationFrameId: number | null = null;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = token;

      const routesWithRoadGeometry = routes.map((route, index) => ({
        ...route,
        drawCoordinates: route.coordinates,
        routeColor: pickRouteColor(index),
        routeIndex: index + 1,
      }));

      const routeLineFeatures = routesWithRoadGeometry
        .filter((route) => route.drawCoordinates.length >= 2)
        .map((route) => ({
          type: "Feature" as const,
          properties: {
            routeId: route.id,
            routeName: route.routeName,
            routeColor: route.routeColor,
            routeIndex: route.routeIndex,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: route.drawCoordinates,
          },
        }));

      const activeRouteFeature = routeLineFeatures.find(
        (feature) => feature.properties.routeId === activeRouteId,
      );
      const feedCoordinates =
        activeRouteFeature?.geometry.coordinates ?? activeRouteCoordinates;

      const centerPoint: Coordinate | null =
        feedCoordinates.length > 0
          ? feedCoordinates[Math.floor(feedCoordinates.length / 2)]
          : allStations.length > 0
            ? [allStations[0].longitude, allStations[0].latitude]
            : null;

      if (!centerPoint) {
        return;
      }

      map = new mapboxgl.Map({
        container: mapRef.current as HTMLDivElement,
        style: MAP_STYLE_URLS[mapStyle],
        center: centerPoint,
        zoom: 14.8,
        pitch: isTiltedView ? 52 : 0,
        bearing: isTiltedView ? -22 : 0,
        antialias: true,
      });
      mapInstanceRef.current = map;

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true }),
        "top-right",
      );

      map.on("load", async () => {
        if (!map || !mounted) {
          return;
        }

        const mapInstance = map;

        await ensureMapImage({
          map,
          imageId: "station-lucide-icon",
          markerSvgDataUrl: buildStationMarkerSvgDataUrl(),
        });

        await ensureMapImage({
          map,
          imageId: "bus-lucide-icon",
          markerSvgDataUrl: buildBusMarkerSvgDataUrl(),
        });

        map.addSource("bus-route", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: routeLineFeatures,
          },
        });

        map.addSource("stops", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: allStations.map((station) => ({
              type: "Feature",
              properties: {
                name: station.name,
              },
              geometry: {
                type: "Point",
                coordinates: [station.longitude, station.latitude],
              },
            })),
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        routeLineFeatures.forEach((feature) => {
          feature.geometry.coordinates.forEach(([lng, lat]) => {
            bounds.extend([lng, lat]);
          });
        });
        allStations.forEach((station) => {
          bounds.extend([station.longitude, station.latitude]);
        });

        if (bounds.isEmpty()) {
          bounds.extend(centerPoint);
        }

        map.fitBounds(bounds, {
          padding: 56,
          duration: 800,
          maxZoom: 16.2,
          pitch: isTiltedView ? 52 : 0,
          bearing: isTiltedView ? -22 : 0,
        });

        if (userLocationRef.current) {
          upsertUserLocationSource(map, userLocationRef.current);
        }

        map.addLayer({
          id: "bus-route-glow",
          type: "line",
          source: "bus-route",
          paint: {
            "line-color": ["coalesce", ["get", "routeColor"], "#16a34a"],
            "line-width": 14,
            "line-opacity": 0.25,
          },
        });

        map.addLayer({
          id: "bus-route-line",
          type: "line",
          source: "bus-route",
          paint: {
            "line-color": ["coalesce", ["get", "routeColor"], "#16a34a"],
            "line-width": 5,
            "line-opacity": 0.95,
            "line-dasharray": [1.6, 1.2],
          },
        });

        map.addLayer({
          id: "stops-icon",
          type: "symbol",
          source: "stops",
          layout: {
            "icon-image": "station-lucide-icon",
            "icon-size": 0.48,
            "icon-anchor": "center",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });

        map.addLayer({
          id: "stops-label",
          type: "symbol",
          source: "stops",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 12,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-offset": [0, 1.5],
          },
          paint: {
            "text-color": "#173330",
            "text-halo-color": "#fff9ed",
            "text-halo-width": 1,
          },
        });

        const busMarkers = new Map<string, mapboxgl.Marker>();
        const busTargets = new Map<
          string,
          { from: Coordinate; to: Coordinate; start: number }
        >();
        const markerAnimationDurationMs = 900;

        const buildPopupForBus = (
          selectedBusId: string,
          position: Coordinate,
        ) => {
          const selectedBus = busesById.get(selectedBusId);
          if (!selectedBus) {
            return;
          }

          const selectedBusCode =
            busCodeByIdRef.current[selectedBusId] ?? selectedBusId;

          popup?.remove();
          popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnMove: false,
            offset: 16,
            className: "bus-info-popup",
          })
            .setLngLat(position)
            .setHTML(
              buildBusPopupHtml(selectedBusCode, {
                speed: selectedBus.speed,
                nearestStop: selectedBus.nearestStop,
                etaMinutes: selectedBus.etaMinutes,
                datetime: selectedBus.datetime,
                status:
                  busStatusByIdRef.current[selectedBusId] ?? selectedBus.status,
                stationName: busStationByIdRef.current[selectedBusId] ?? "-",
                passengerCount: busPassengersByIdRef.current[selectedBusId],
                maxPassengers: busMaxPassengersByIdRef.current[selectedBusId],
              }),
            )
            .addTo(mapInstance);

          popup.on("close", () => {
            isPopupPinnedRef.current = false;
            popup = null;
          });
        };

        const animateMarkers = (timestamp: number) => {
          if (!mapInstance || !mounted) {
            return;
          }

          busTargets.forEach((target, busId) => {
            const marker = busMarkers.get(busId);
            if (!marker) {
              return;
            }

            const elapsed = Math.max(timestamp - target.start, 0);
            const progress = Math.min(elapsed / markerAnimationDurationMs, 1);
            const lng =
              target.from[0] + (target.to[0] - target.from[0]) * progress;
            const lat =
              target.from[1] + (target.to[1] - target.from[1]) * progress;
            const nextPosition: Coordinate = [lng, lat];
            marker.setLngLat(nextPosition);

            if (progress >= 1) {
              busTargets.delete(busId);
            }

            if (activeBusIdRef.current === busId && popup) {
              buildPopupForBus(busId, nextPosition);
            }
          });

          animationFrameId = requestAnimationFrame(animateMarkers);
        };

        animationFrameId = requestAnimationFrame(animateMarkers);

        const feed = createRealtimeBusFeed({
          wsUrl: process.env.NEXT_PUBLIC_REALTIME_WS_URL,
          onStatusChange: onFeedStatusChange,
        });

        const busesById = new Map<string, BusTelemetry>();

        stopFeed = feed.connect(
          (payload) => {
            if (!map || !mounted) {
              return;
            }

            busesById.set(payload.busId, payload);

            if (!activeBusIdRef.current) {
              activeBusIdRef.current = payload.busId;
            }

            const marker = busMarkers.get(payload.busId);
            if (!marker) {
              const markerEl = document.createElement("div");
              markerEl.style.width = "26px";
              markerEl.style.height = "26px";
              markerEl.style.display = "block";
              markerEl.style.padding = "4px";
              markerEl.style.cursor = "pointer";
              markerEl.style.pointerEvents = "auto";
              markerEl.style.backgroundImage = `url("${buildBusMarkerSvgDataUrl()}")`;
              markerEl.style.backgroundSize = "contain";
              markerEl.style.backgroundRepeat = "no-repeat";
              markerEl.style.backgroundPosition = "center";
              markerEl.style.transformOrigin = "center";

              const nextMarker = new mapboxgl.Marker({
                element: markerEl,
                anchor: "center",
              })
                .setLngLat(payload.position)
                .addTo(mapInstance);

              markerEl.addEventListener("mouseenter", () => {
                mapInstance.getCanvas().style.cursor = "pointer";
              });

              markerEl.addEventListener("mouseleave", () => {
                mapInstance.getCanvas().style.cursor = "";
              });

              markerEl.addEventListener("click", (event) => {
                event.stopPropagation();
                activeBusIdRef.current = payload.busId;
                isPopupPinnedRef.current = true;
                buildPopupForBus(payload.busId, payload.position);
              });

              busMarkers.set(payload.busId, nextMarker);
              busTargets.set(payload.busId, {
                from: payload.position,
                to: payload.position,
                start: performance.now(),
              });
            } else {
              const current = marker.getLngLat();
              busTargets.set(payload.busId, {
                from: [current.lng, current.lat],
                to: payload.position,
                start: performance.now(),
              });
            }

            const selectedBusId = activeBusIdRef.current;
            if (
              selectedBusId === payload.busId &&
              popup &&
              isPopupPinnedRef.current
            ) {
              buildPopupForBus(payload.busId, payload.position);
              const now = Date.now();
              if (now - lastCameraFollowAt > 450) {
                mapInstance.easeTo({
                  center: payload.position,
                  duration: 650,
                  essential: true,
                });
                lastCameraFollowAt = now;
              }
            }

            onBusTelemetry?.(payload);
          },
          {
            routeCoordinates: feedCoordinates,
            stopNames: activeStopNames,
            routeStops: activeRouteStations,
            loopDurationSeconds: 80,
            busCount: 2,
          },
        );
      });
    };

    initMap();

    return () => {
      mounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      stopFeed?.();
      popup?.remove();
      map?.remove();
      mapInstanceRef.current = null;
    };
  }, [
    activeRouteCoordinates,
    activeRouteId,
    activeRouteStations,
    activeStopNames,
    allStations,
    hasMapData,
    isTiltedView,
    mapRef,
    mapStyle,
    onTokenMissingChange,
    onBusTelemetry,
    onFeedStatusChange,
    routes,
    token,
    userLocationRef,
  ]);

  return {
    mapInstanceRef,
    upsertUserLocationSource,
  };
}
