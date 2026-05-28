import { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { Link as LinkIcon, Unlink as UnlinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";

type UserCard = {
  rfidTag: string;
  balance: number;
  status: string;
};

type LatestTransactionItem = {
  id: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
  stationName: string | null;
  rfidTag: string;
  bus: {
    busCode: string;
    plateNumber: string;
  };
};

type UserPageProps = {
  userName: string;
  cards: UserCard[];
  travelSummaries: Record<TravelPeriodKey, TravelSummary>;
  latestTransactions: LatestTransactionItem[];
};

type TravelPeriodKey = "today" | "7d" | "30d" | "12m";

type TravelSummary = {
  label: string;
  description: string;
  totalAmount: number;
  tripCount: number;
};

const travelPeriodOrder: TravelPeriodKey[] = ["today", "7d", "30d", "12m"];

const transactionTypeLabels: Record<TransactionType, string> = {
  IN: "Tap In",
  OUT: "Tap Out",
  PENALTY: "Denda",
};

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));

const dashboardSurfaceClassName =
  "rounded-3xl border border-border/50 bg-card/80 shadow-[0_14px_42px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-transparent hover:bg-transparent hover:shadow-[0_20px_54px_rgba(15,23,42,0.1)]";

const dashboardSoftCardClassName =
  "rounded-xl border border-border/40 bg-background/80 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-transparent hover:bg-transparent hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]";

const UserPage: NextPage<UserPageProps> = ({ userName, cards, travelSummaries, latestTransactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TravelPeriodKey>("today");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkRfidTag, setLinkRfidTag] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkedCard, setLinkedCard] = useState<UserCard | null>(cards && cards.length > 0 ? cards[0] : null);

  const selectedSummary = travelSummaries[selectedPeriod];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const handleLinkCard = async () => {
    if (!linkRfidTag.trim()) {
      toast.error("Masukkan RFID Tag");
      return;
    }

    setIsLinking(true);
    try {
      const response = await fetch("/api/user/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfidTag: linkRfidTag.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.errors?.[0]?.message || "Gagal menghubungkan kartu");
        return;
      }

      setLinkedCard({
        rfidTag: data.rfidTag,
        balance: data.balance || 0,
        status: data.status || "active",
      });
      setLinkRfidTag("");
      setIsLinkDialogOpen(false);
      toast.success("Kartu berhasil dihubungkan");
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkCard = async () => {
    if (!linkedCard) return;

    if (!confirm("Apakah Anda yakin ingin melepas kartu ini dari akun?")) {
      return;
    }

    try {
      const response = await fetch("/api/user/cards", {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Gagal melepas kartu");
        return;
      }

      setLinkedCard(null);
      toast.success("Kartu berhasil dilepas dari akun");
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Dashboard User"
          title={`Selamat datang, ${userName}!`}
          description="Lihat ringkasan perjalanan, saldo kartu RFID, dan riwayat transaksi terbaru dalam satu tampilan yang konsisten." 
        />

        <Card className={dashboardSurfaceClassName}>
          <CardHeader>
            <CardTitle>Ringkasan Perjalanan</CardTitle>
            <CardDescription>
              Total uang yang dipakai untuk perjalanan hari ini, 7 hari, 30 hari, atau 12 bulan terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {travelPeriodOrder.map((period) => {
                const summary = travelSummaries[period];

                return (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={selectedPeriod === period ? "default" : "secondary"}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {summary.label}
                  </Button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={dashboardSoftCardClassName + " p-5"}>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Total Biaya Perjalanan
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(selectedSummary.totalAmount)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedSummary.description}
                </p>
              </div>

              <div className={dashboardSoftCardClassName + " p-5"}>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Jumlah Perjalanan
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {selectedSummary.tripCount}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Berdasarkan transaksi {TransactionType.IN} yang tercatat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardSurfaceClassName}>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <CardDescription>Lihat 5 transaksi terakhir dari akun Anda dan buka riwayat lengkap saat diperlukan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestTransactions.length === 0 ? (
              <div className={dashboardSoftCardClassName + " p-6 text-sm text-muted-foreground"}>
                Belum ada riwayat transaksi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[600px] w-full border-separate border-spacing-y-3 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      <th className="px-4 py-2">Info Tap</th>
                      <th className="px-4 py-2">Bus & Stasiun</th>
                      <th className="px-4 py-2">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestTransactions.map((tx) => (
                      <tr key={tx.id} className="rounded-2xl border border-border/40 bg-card/80 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border/60 hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-full bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                              {transactionTypeLabels[tx.type] ?? tx.type}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
                            <span className="text-xs text-muted-foreground">{tx.rfidTag}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">{tx.bus.busCode} ({tx.bus.plateNumber})</span>
                            <span className="text-xs text-muted-foreground">{tx.stationName ?? "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground">{formatCurrency(tx.amount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end">
              <Link href="/user/history">
                <Button variant="default">Lihat Semua Riwayat</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Kartu RFID</CardTitle>
            <CardDescription>Hubungkan kartu RFID Anda untuk menggunakan layanan. Maksimal 1 kartu per akun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedCard ? (
              <div>
                <div className="rounded-xl border border-border bg-background p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">ID Kartu RFID</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{linkedCard.rfidTag}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo</p>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        Rp {linkedCard.balance.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold text-foreground mt-1 capitalize">{linkedCard.status}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleUnlinkCard}
                    className="flex items-center gap-2"
                  >
                    <UnlinkIcon className="h-4 w-4" />
                    Lepas Kartu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Belum ada kartu RFID yang terhubung dengan akun Anda.</p>
                <Button
                  type="button"
                  onClick={() => setIsLinkDialogOpen(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <LinkIcon className="h-4 w-4" />
                  Hubungkan Kartu RFID
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="max-w-md rounded-3xl border border-border bg-card">
            <DialogHeader>
              <DialogTitle>Hubungkan Kartu RFID</DialogTitle>
              <DialogDescription>
                Masukkan ID RFID Tag kartu yang ingin Anda hubungkan dengan akun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rfidInput">RFID Tag</Label>
                <Input
                  id="rfidInput"
                  value={linkRfidTag}
                  onChange={(e) => setLinkRfidTag(e.target.value)}
                  placeholder="Contoh: D4:5C:B1:F2"
                  disabled={isLinking}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLinkDialogOpen(false)}
                disabled={isLinking}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleLinkCard}
                disabled={isLinking}
              >
                {isLinking ? "Menghubungkan..." : "Hubungkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
};

function CardsList({ cards }: { cards: UserCard[] }) {
  if (!cards || cards.length === 0) {
    return <div className="text-sm text-muted-foreground">Belum ada kartu RFID terdaftar.</div>;
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <div key={card.rfidTag} className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold">ID Kartu: {card.rfidTag}</p>
          <p className="text-sm text-muted-foreground">Saldo: Rp {card.balance.toLocaleString("id-ID")}</p>
          <p className="text-sm text-muted-foreground">Status: {card.status}</p>
        </div>
      ))}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<UserPageProps> = async (context) => {
  const session = await getSessionFromRequest(context.req);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const userName = session.user.name || session.user.email || "Pengguna";

  const now = new Date();
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const startOfMonthOffset = (date: Date, monthsBack: number) => {
    const start = new Date(date);
    start.setDate(1);
    start.setMonth(start.getMonth() - monthsBack);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const sumUserTravel = async (from: Date) => {
    const aggregate = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.IN,
        createdAt: {
          gte: from,
        },
        card: {
          userId: session.user.id,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      totalAmount: aggregate._sum.amount ?? 0,
      tripCount: aggregate._count._all,
    };
  };

  const [todayTravel, last7Days, last30Days, last12Months] = await Promise.all([
    sumUserTravel(startOfDay(now)),
    sumUserTravel(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    sumUserTravel(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    sumUserTravel(startOfMonthOffset(now, 11)),
  ]);

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    select: {
      rfidTag: true,
      balance: true,
      status: true,
    },
  });

  const latestTransactionsData = await prisma.transaction.findMany({
    where: {
      card: {
        userId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      bus: {
        select: {
          busCode: true,
          plateNumber: true,
        },
      },
      card: {
        select: {
          rfidTag: true,
        },
      },
    },
  });

  const latestTransactions = latestTransactionsData.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    createdAt: tx.createdAt.toISOString(),
    stationName: tx.stationName,
    rfidTag: tx.card.rfidTag,
    bus: {
      busCode: tx.bus.busCode,
      plateNumber: tx.bus.plateNumber,
    },
  }));

  return {
    props: {
      userName,
      cards,
      latestTransactions,
      travelSummaries: {
        today: {
          label: "Hari Ini",
          description: "Akumulasi biaya perjalanan sejak awal hari ini.",
          totalAmount: todayTravel.totalAmount,
          tripCount: todayTravel.tripCount,
        },
        "7d": {
          label: "7 Hari Terakhir",
          description: "Akumulasi biaya perjalanan selama 7 hari terakhir.",
          totalAmount: last7Days.totalAmount,
          tripCount: last7Days.tripCount,
        },
        "30d": {
          label: "30 Hari Terakhir",
          description: "Akumulasi biaya perjalanan selama 30 hari terakhir.",
          totalAmount: last30Days.totalAmount,
          tripCount: last30Days.tripCount,
        },
        "12m": {
          label: "12 Bulan Terakhir",
          description: "Akumulasi biaya perjalanan selama 12 bulan terakhir.",
          totalAmount: last12Months.totalAmount,
          tripCount: last12Months.tripCount,
        },
      },
    },
  };
};

export default UserPage;

