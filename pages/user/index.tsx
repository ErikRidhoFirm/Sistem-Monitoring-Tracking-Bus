import { useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";

type UserCard = {
  rfidTag: string;
  balance: number;
  status: string;
};

type UserPageProps = {
  userName: string;
  cards: UserCard[];
  travelSummaries: Record<TravelPeriodKey, TravelSummary>;
};

type TravelPeriodKey = "today" | "7d" | "30d" | "12m";

type TravelSummary = {
  label: string;
  description: string;
  totalAmount: number;
  tripCount: number;
};

const travelPeriodOrder: TravelPeriodKey[] = ["today", "7d", "30d", "12m"];

const UserPage: NextPage<UserPageProps> = ({ userName, cards, travelSummaries }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TravelPeriodKey>("today");
  const selectedSummary = travelSummaries[selectedPeriod];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="space-y-2 rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-bold">Selamat datang, {userName}!</h1>
          <p className="text-muted-foreground">
            Ini adalah halaman dashboard pengguna. Di sini kamu dapat melihat data kartu RFID dan saldo.
          </p>
        </div>

        <Card className="border border-border bg-card">
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
              <div className="rounded-xl border border-border bg-background p-5">
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

              <div className="rounded-xl border border-border bg-background p-5">
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

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Kartu RFID</CardTitle>
            <CardDescription>Informasi kartu yang terkait dengan akun Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <CardsList cards={cards} />
          </CardContent>
        </Card>
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
  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
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

  return {
    props: {
      userName,
      cards,
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

