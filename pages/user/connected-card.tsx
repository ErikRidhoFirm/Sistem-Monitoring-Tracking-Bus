import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

type ConnectedCard = {
  rfidTag: string;
  balance: number;
  status: string;
};

type ConnectedCardPageProps = {
  userName: string;
  card: ConnectedCard;
};

const ConnectedCardPage: NextPage<ConnectedCardPageProps> = ({ userName, card }) => {
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="space-y-2 rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-bold">Kartu Terhubung</h1>
          <p className="text-muted-foreground">
            Detail kartu RFID yang terhubung dengan akun {userName}.
          </p>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Informasi Kartu RFID</CardTitle>
            <CardDescription>Kartu yang saat ini terhubung dengan akun kamu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground">ID Kartu</p>
              <p className="text-2xl font-semibold">{card.rfidTag}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Saldo: Rp {card.balance.toLocaleString("id-ID")}</p>
                <p>Status: {card.status}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/user">
                <Button variant="secondary">Kembali ke dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps<ConnectedCardPageProps> = async (
  context,
) => {
  const session = await getSessionFromRequest(context.req);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const card = await prisma.card.findFirst({
    where: { userId: session.user.id },
    select: {
      rfidTag: true,
      balance: true,
      status: true,
    },
  });

  if (!card) {
    return {
      redirect: {
        destination: "/user",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userName: session.user.name || session.user.email || "Pengguna",
      card,
    },
  };
};

export default ConnectedCardPage;
