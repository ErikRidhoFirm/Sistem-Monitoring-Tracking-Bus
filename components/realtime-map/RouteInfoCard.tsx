type RouteInfoCardProps = {
  stopNames: string[];
};

export function RouteInfoCard({ stopNames }: RouteInfoCardProps) {
  return (
    <div className="rounded-3xl border border-[#245bb0]/16 bg-white/72 p-5 shadow-[0_10px_30px_rgba(36,91,176,0.08)] backdrop-blur-sm">
      <p className="text-xs tracking-[0.18em] text-[#173330]/60 uppercase">
        Informasi Rute
      </p>
      <ul className="mt-4 space-y-3 text-sm text-[#173330]/85">
        {stopNames.map((stopName) => (
          <li
            key={stopName}
            className="flex items-center justify-between rounded-xl border border-[#245bb0]/12 bg-linear-to-r from-[#ffffff] to-[#f3f7ff] px-3 py-2"
          >
            <span>{stopName}</span>
            <span className="text-[#e86f3f]">Aktif</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
