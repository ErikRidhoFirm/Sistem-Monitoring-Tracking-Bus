import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GpsPermissionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gpsError: string | null;
  gpsLoading: boolean;
  onRequestGpsAccess: () => void;
};

export function GpsPermissionDialog({
  open,
  onOpenChange,
  gpsError,
  gpsLoading,
  onRequestGpsAccess,
}: GpsPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-[#245bb0]/16 bg-white/95">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#173330]">
            Izinkan Akses Lokasi GPS
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-[#173330]/70">
            Buswy membutuhkan lokasi kamu untuk menampilkan titik posisi saat
            ini di peta realtime dan membantu estimasi kedekatan bus.
          </DialogDescription>
        </DialogHeader>

        {gpsError ? (
          <p className="rounded-xl border border-[#e86f3f]/25 bg-[#fff4ef] px-4 py-3 text-sm text-[#b3451c]">
            {gpsError}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Nanti Saja
          </Button>
          <Button
            type="button"
            onClick={onRequestGpsAccess}
            disabled={gpsLoading}
            className="bg-[#173330] text-[#f4f1e8] hover:bg-[#112927]"
          >
            {gpsLoading ? "Meminta Akses..." : "Izinkan GPS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
