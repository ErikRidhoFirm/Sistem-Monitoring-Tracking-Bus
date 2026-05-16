import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Manrope, Sora } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FloatingMapControls } from "@/components/realtime-map/FloatingMapControls";
import { GpsPermissionDialog } from "@/components/realtime-map/GpsPermissionDialog";
import { useRealtimeMapRenderer } from "@/lib/hooks/use-realtime-map-renderer";
import { prisma } from "@/lib/prisma";
import type { BusTelemetry, Coordinate } from "@/lib/realtime-bus-feed";
import {
  type MapStyleKey,
  type RealtimeMapRoute,
  type RealtimeMapStation,
} from "@/lib/realtime-map-types";
import { parseLineStringCoordinatesFromGeoJson } from "@/lib/realtime-map-utils";

import styles from "./realtime-map.module.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

type RealtimeMapPageProps = {
  routes: RealtimeMapRoute[];
  activeBuses: Array<{
    id: string;
    busCode: string;
    passengerCount: number;
    maxPassengers: number;
  }>;
};

export default function RealtimeMapPage({
  routes,
  activeBuses,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const userLocationRef = useRef<Coordinate | null>(null);
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("light");
  const [isTiltedView, setIsTiltedView] = useState(true);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [busStatusById, setBusStatusById] = useState<Record<string, string>>(
    {},
  );
  const [busStationById, setBusStationById] = useState<Record<string, string>>(
    {},
  );
  const [busTelemetryById, setBusTelemetryById] = useState<
    Record<string, BusTelemetry>
  >({});
  const [busLastSeenById, setBusLastSeenById] = useState<
    Record<string, number>
  >({});
  const [mqttStatus, setMqttStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [now, setNow] = useState(() => Date.now());

  const busesActive = useMemo(
    () => Object.values(busTelemetryById),
    [busTelemetryById],
  );

  const activeRoute = routes[0] ?? null;
  const activeRouteCoordinates = activeRoute?.coordinates ?? [];
  const activeRouteStations = activeRoute?.stations ?? [];
  const activeStopNames = useMemo(
    () => activeRoute?.stations.map((station) => station.name) ?? [],
    [activeRoute],
  );
  const allStations = useMemo(() => {
    const deduped = new Map<string, RealtimeMapStation>();

    routes.forEach((route) => {
      route.stations.forEach((station) => {
        if (!deduped.has(station.id)) {
          deduped.set(station.id, station);
        }
      });
    });

    return Array.from(deduped.values());
  }, [routes]);
  const hasMapData =
    routes.some((route) => route.coordinates.length >= 2) ||
    allStations.length > 0;
  const busCodeById = useMemo(
    () =>
      Object.fromEntries(
        busesActive.map((bus) => [bus.busId, bus.busCode ?? bus.busId]),
      ),
    [busesActive],
  );
  const busPassengersById = useMemo(
    () =>
      Object.fromEntries(
        busesActive.map((bus) => [bus.busId, bus.passengerCount ?? 0]),
      ),
    [busesActive],
  );
  const busMaxPassengersById = useMemo(
    () =>
      Object.fromEntries(
        busesActive.map((bus) => [bus.busId, bus.maxPassengers ?? 0]),
      ),
    [busesActive],
  );

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const handleBusTelemetry = useCallback((payload: BusTelemetry) => {
    setBusTelemetryById((prev) => ({
      ...prev,
      [payload.busId]: payload,
    }));

    setBusLastSeenById((prev) => ({
      ...prev,
      [payload.busId]: Date.now(),
    }));

    const statusLabel = payload.busStatusLabel || "In Transit";

    setBusStatusById((prev) => ({
      ...prev,
      [payload.busId]: statusLabel,
    }));

    setBusStationById((prev) => ({
      ...prev,
      [payload.busId]: payload.nearestStop ?? "-",
    }));
  }, []);

  const { mapInstanceRef, upsertUserLocationSource } = useRealtimeMapRenderer({
    mapRef,
    routes,
    busCodeById,
    busStatusById,
    busStationById,
    busPassengersById,
    busMaxPassengersById,
    activeRouteStations,
    activeRouteId: activeRoute?.id ?? null,
    activeRouteCoordinates,
    activeStopNames,
    allStations,
    hasMapData,
    mapStyle,
    isTiltedView,
    token,
    userLocationRef,
    onTokenMissingChange: setTokenMissing,
    onBusTelemetry: handleBusTelemetry,
    onFeedStatusChange: setMqttStatus,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleRequestGpsAccess = () => {
    if (!navigator.geolocation) {
      setGpsError("Browser tidak mendukung GPS/geolocation.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinate = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        userLocationRef.current = coords;
        setGpsLoading(false);
        setGpsDialogOpen(false);

        const map = mapInstanceRef.current;
        if (map) {
          upsertUserLocationSource(map, coords);
          map.easeTo({
            center: coords,
            duration: 900,
            zoom: Math.max(map.getZoom(), 15.2),
            essential: true,
          });
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("Akses lokasi ditolak. Izinkan GPS untuk melanjutkan.");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setGpsError("Waktu permintaan lokasi habis. Coba lagi.");
          return;
        }

        setGpsError("Lokasi tidak tersedia saat ini. Coba beberapa saat lagi.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isViewMenuOpen) {
        return;
      }

      const target = event.target as Node;
      const clickedMenu = menuRef.current?.contains(target) ?? false;
      const clickedTrigger = menuTriggerRef.current?.contains(target) ?? false;

      if (!clickedMenu && !clickedTrigger) {
        setIsViewMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isViewMenuOpen]);

  const mqttStatusLabel =
    mqttStatus === "connected"
      ? "Realtime Connected"
      : mqttStatus === "connecting"
        ? "Realtime Connecting"
        : "Realtime Disconnected";
  const mqttStatusClass =
    mqttStatus === "connected"
      ? "bg-emerald-500/15 text-emerald-700"
      : mqttStatus === "connecting"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-rose-500/15 text-rose-700";
  const mqttStatusDotClass =
    mqttStatus === "connected"
      ? "bg-emerald-500"
      : mqttStatus === "connecting"
        ? "bg-amber-500"
        : "bg-rose-500";
  const liveThresholdMs = 15000;
  const sidebarBuses = useMemo(
    () =>
      activeBuses.map((bus) => {
        const telemetry = busTelemetryById[bus.id];
        const isLive = now - (busLastSeenById[bus.id] ?? 0) <= liveThresholdMs;
        const liveStatus = telemetry
          ? telemetry.busStatusLabel || "In Transit"
          : "Not Connected";
        return {
          busId: bus.id,
          busCode: telemetry?.busCode || bus.busCode,
          status: isLive ? busStatusById[bus.id] || liveStatus : "Not Connected",
          passengerCount: telemetry?.passengerCount ?? bus.passengerCount,
          maxPassengers: telemetry?.maxPassengers ?? bus.maxPassengers,
          isLive,
        };
      }),
    [activeBuses, busLastSeenById, busStatusById, busTelemetryById, now],
  );

  return (
    <div
      className={`${sora.variable} ${manrope.variable} h-screen w-screen overflow-hidden bg-[#f7f9ff] text-[#173330]`}
    >
      <div className="absolute inset-0">
        <div
          ref={mapRef}
          className={`${styles.mapContainer} h-screen w-screen`}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        <FloatingMapControls
          isViewMenuOpen={isViewMenuOpen}
          isTiltedView={isTiltedView}
          isSidebarOpen={isSidebarOpen}
          mapStyle={mapStyle}
          menuRef={menuRef}
          menuTriggerRef={menuTriggerRef}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleViewMenu={() => setIsViewMenuOpen((prev) => !prev)}
          onToggleTiltedView={() => setIsTiltedView((prev) => !prev)}
          onSelectMapStyle={setMapStyle}
          onOpenGpsDialog={() => {
            setIsViewMenuOpen(false);
            setGpsDialogOpen(true);
          }}
        />

        <aside
          className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ""}`}
        >
          <div className={styles.sidebarHeader}>
            <div>
              <p className="text-xs tracking-[0.18em] text-[#173330]/60 uppercase">
                Realtime Fleet
              </p>
              <h2
                style={{ fontFamily: "var(--font-display)" }}
                className="mt-1 text-xl font-semibold"
              >
                Bus Aktif
              </h2>
            </div>
            <button
              type="button"
              className={styles.sidebarClose}
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Tutup sidebar bus"
            >
              Tutup
            </button>
          </div>

          <div className={styles.sidebarStatusRow}>
            <span className={`${styles.sidebarStatusBadge} ${mqttStatusClass}`}>
              <span
                className={`${styles.sidebarStatusDot} ${mqttStatusDotClass}`}
              />
              {mqttStatusLabel}
            </span>
            <span className="text-xs text-[#173330]/55">
              {activeBuses.length} bus aktif
            </span>
          </div>

          <div className={styles.sidebarList}>
            {sidebarBuses.length === 0 ? (
              <div className={styles.sidebarEmpty}>Belum ada bus aktif.</div>
            ) : (
              sidebarBuses.map((bus) => (
                <div key={bus.busId} className={styles.sidebarItem}>
                  <div>
                    <p className="text-sm font-semibold">
                      {bus.busCode ?? bus.busId}
                    </p>
                    <p className="mt-1 text-xs text-[#173330]/65">
                      Status: {bus.status}
                    </p>
                    <p className="mt-1 text-xs text-[#173330]/65">
                      Penumpang: {bus.passengerCount ?? 0} /{" "}
                      {bus.maxPassengers ?? 0}
                    </p>
                  </div>
                  <span
                    className={`${styles.sidebarItemTag} ${
                      bus.isLive ? "" : styles.sidebarItemTagOffline
                    }`}
                  >
                    {bus.isLive ? "Live" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-6">
          <div className="mx-auto max-w-max rounded-md border border-slate-200/80 bg-white/88 px-2 py-1 text-xs text-slate-600 shadow-sm backdrop-blur-sm">
            Tap ikon bus untuk detail
          </div>
        </div>

        {tokenMissing ? (
          <div className="pointer-events-auto absolute inset-x-4 top-1/2 z-30 -translate-y-1/2 rounded-xl border border-slate-200/90 bg-white/95 p-6 text-center shadow-sm backdrop-blur-sm md:inset-x-auto md:left-1/2 md:w-136 md:-translate-x-1/2">
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl font-semibold text-[#e86f3f]"
            >
              Token Mapbox Belum Diatur
            </p>
            <p className="mt-3 text-sm leading-7 text-[#173330]/75">
              Tambahkan NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN di file .env.local agar
              peta realtime dapat ditampilkan.
            </p>
          </div>
        ) : null}

        {!tokenMissing && !hasMapData ? (
          <div className="pointer-events-auto absolute inset-x-4 top-1/2 z-30 -translate-y-1/2 rounded-xl border border-slate-200/90 bg-white/95 p-6 text-center shadow-sm backdrop-blur-sm md:inset-x-auto md:left-1/2 md:w-136 md:-translate-x-1/2">
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl font-semibold text-[#e86f3f]"
            >
              Data Rute Belum Tersedia
            </p>
            <p className="mt-3 text-sm leading-7 text-[#173330]/75">
              Tambahkan data route dengan GeoJSON LineString dan station di
              database agar peta realtime dapat ditampilkan.
            </p>
          </div>
        ) : null}
      </div>

      <GpsPermissionDialog
        open={gpsDialogOpen}
        onOpenChange={setGpsDialogOpen}
        gpsError={gpsError}
        gpsLoading={gpsLoading}
        onRequestGpsAccess={handleRequestGpsAccess}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  RealtimeMapPageProps
> = async (context) => {
  const routeIdQuery = context.query.routeId;
  const routeId =
    typeof routeIdQuery === "string" && routeIdQuery.trim().length > 0
      ? routeIdQuery
      : null;

  const routeRecords = await prisma.route.findMany({
    where: routeId ? { id: routeId } : undefined,
    orderBy: {
      routeName: "asc",
    },
    include: {
      stations: {
        include: {
          station: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  const routes: RealtimeMapRoute[] = routeRecords.map((route) => {
    const coordinates = parseLineStringCoordinatesFromGeoJson(
      route.pathGeoJSON,
    );
    const relationStations = route.stations.map((item) => ({
      id: item.station.id,
      name: item.station.name,
      latitude: item.station.latitude,
      longitude: item.station.longitude,
      order: item.order,
    }));

    return {
      id: route.id,
      routeName: route.routeName,
      coordinates,
      stations: relationStations,
    };
  });

  const activeBuses = await prisma.bus.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      busCode: "asc",
    },
    select: {
      id: true,
      busCode: true,
      passengerCount: true,
      maxPassengers: true,
    },
  });

  return {
    props: {
      routes,
      activeBuses,
    },
  };
};
