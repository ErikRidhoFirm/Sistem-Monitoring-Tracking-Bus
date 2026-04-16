import { Button } from "@/components/ui/button";

type MapStyleKey = "light" | "streets" | "satellite";

type MapToolbarProps = {
  isTiltedView: boolean;
  mapStyle: MapStyleKey;
  onOpenGpsDialog: () => void;
  onToggleTiltedView: () => void;
  onSetMapStyle: (value: MapStyleKey) => void;
};

const styleOptions: Array<{ key: MapStyleKey; label: string }> = [
  { key: "light", label: "Light" },
  { key: "streets", label: "Streets" },
  { key: "satellite", label: "Satellite" },
];

export function MapToolbar({
  isTiltedView,
  mapStyle,
  onOpenGpsDialog,
  onToggleTiltedView,
  onSetMapStyle,
}: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#245bb0]/10 bg-white/70 px-5 py-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenGpsDialog}
        className="h-9 rounded-full border-[#245bb0]/25 bg-white px-4 text-xs font-semibold tracking-[0.06em] uppercase"
      >
        Akses GPS
      </Button>

      <button
        type="button"
        onClick={onToggleTiltedView}
        className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold tracking-[0.06em] uppercase transition ${
          isTiltedView
            ? "border-[#245bb0]/35 bg-[#245bb0]/12 text-[#173330]"
            : "border-[#245bb0]/20 bg-white text-[#173330]/75"
        }`}
      >
        {isTiltedView ? "3D View ON" : "3D View OFF"}
      </button>

      {styleOptions.map((styleOption) => (
        <button
          key={styleOption.key}
          type="button"
          onClick={() => onSetMapStyle(styleOption.key)}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold tracking-[0.06em] uppercase transition ${
            mapStyle === styleOption.key
              ? "border-[#2f8f83]/35 bg-[#2f8f83]/12 text-[#173330]"
              : "border-[#245bb0]/20 bg-white text-[#173330]/75"
          }`}
        >
          {styleOption.label}
        </button>
      ))}
    </div>
  );
}
