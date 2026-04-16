import type { Coordinate } from "@/lib/realtime-bus-feed";

type BusStatusCardProps = {
  busLabel: string;
  currentStop: string;
  eta: number;
  speedKph: number;
  passengerCount: number;
  userLocation: Coordinate | null;
  statusLabel: string;
};

export function BusStatusCard({
  busLabel,
  currentStop,
  eta,
  speedKph,
  passengerCount,
  userLocation,
  statusLabel,
}: BusStatusCardProps) {
  return (
    <div className="rounded-3xl border border-[#245bb0]/16 bg-white/72 p-5 shadow-[0_10px_30px_rgba(36,91,176,0.08)] backdrop-blur-sm">
      <p className="text-xs tracking-[0.18em] text-[#173330]/60 uppercase">
        Status Bus
      </p>
      <p
        style={{ fontFamily: "var(--font-display)" }}
        className="mt-2 text-3xl font-semibold text-[#e86f3f]"
      >
        {busLabel}
      </p>
      <p className="mt-4 text-sm text-[#173330]/80">
        Posisi terdekat: {currentStop}
      </p>
      <p className="mt-1 text-sm text-[#173330]/80">
        ETA menuju shelter berikutnya: {eta} menit
      </p>
      <p className="mt-1 text-sm text-[#173330]/80">
        Kecepatan saat ini: {speedKph.toFixed(1)} km/j
      </p>
      <p className="mt-1 text-sm text-[#173330]/80">
        Jumlah penumpang: {passengerCount} orang
      </p>
      <p className="mt-1 text-sm text-[#173330]/80">
        Lokasi saya: {userLocation ? "Terdeteksi" : "Belum aktif"}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2f8f83]/35 bg-[#2f8f83]/10 px-3 py-1 text-xs font-semibold text-[#22685f]">
        <span className="h-2 w-2 rounded-full bg-[#62f4da] animate-pulse" />
        {statusLabel}
      </div>
    </div>
  );
}
