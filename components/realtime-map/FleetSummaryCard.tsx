type FleetSummaryCardProps = {
  activeBusCount: number;
  feedMode: "mock" | "mqtt";
};

export function FleetSummaryCard({
  activeBusCount,
  feedMode,
}: FleetSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-[#245bb0]/16 bg-linear-to-br from-[#eaf2ff] via-[#f4f8ff] to-[#e9fbff] p-5 shadow-[0_10px_30px_rgba(36,91,176,0.08)]">
      <p
        style={{ fontFamily: "var(--font-display)" }}
        className="text-2xl font-semibold"
      >
        24 Bus Operasional
      </p>
      <p className="mt-2 text-sm text-[#173330]/75">
        Seluruh armada hari ini dalam status aktif dan terhubung ke sistem
        pelacakan.
      </p>
      <p className="mt-2 text-sm text-[#173330]/75">
        Bus aktif terdeteksi: {activeBusCount}
      </p>
      <p className="mt-2 text-xs tracking-[0.12em] text-[#173330]/55 uppercase">
        Sumber data: {feedMode === "mqtt" ? "MQTT" : "Dummy Simulator"}
      </p>
    </div>
  );
}
