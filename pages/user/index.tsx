import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useState } from "react";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

type UserCard = {
  rfidTag: string;
  balance: number;
  status: string;
};

type UserPageProps = {
  userName: string;
  card: UserCard | null;
};

const UserPage: NextPage<UserPageProps> = ({ userName, card }) => {
  const [connectedCard, setConnectedCard] = useState<UserCard | null>(card);
  const [rfidTag, setRfidTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLinkCard = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    if (!rfidTag.trim()) {
      setErrorMessage("RFID Tag tidak boleh kosong.");
      return;
    }

    if (connectedCard) {
      setErrorMessage("Kamu sudah memiliki satu kartu terhubung. Lepas kartu terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rfidTag: rfidTag.trim() }),
      });

      const payload = await response.json();

      if (!payload.success) {
        setErrorMessage(payload.errors?.[0]?.message ?? "Gagal menghubungkan kartu RFID.");
        return;
      }

      setConnectedCard(payload.data);
      setRfidTag("");
      setFeedbackMessage("Kartu RFID berhasil terhubungkan.");
    } catch {
      setErrorMessage("Terjadi kesalahan saat menghubungkan kartu RFID.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkCard = async () => {
    if (!connectedCard) {
      return;
    }

    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/cards", {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!payload.success) {
        setErrorMessage(payload.errors?.[0]?.message ?? "Gagal melepaskan kartu RFID.");
        return;
      }

      setConnectedCard(null);
      setFeedbackMessage("Kartu RFID berhasil dilepaskan.");
    } catch {
      setErrorMessage("Terjadi kesalahan saat melepaskan kartu RFID.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="space-y-2 rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-bold">Selamat datang, {userName}!</h1>
          <p className="text-muted-foreground">
            Dashboard user menampilkan kartu RFID yang terhubung dan memperbolehkan kamu mengelolanya.
          </p>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Kartu RFID Terhubung</CardTitle>
            <CardDescription>
              Hanya satu kartu RFID yang boleh terhubung untuk setiap akun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connectedCard ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">ID Kartu</p>
                  <p className="text-xl font-semibold">{connectedCard.rfidTag}</p>
                  <p className="text-sm text-muted-foreground">
                    Saldo: Rp {connectedCard.balance.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-muted-foreground">Status: {connectedCard.status}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/user/connected-card">
                    <Button variant="secondary">Lihat detail kartu</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={handleUnlinkCard}
                    disabled={isSubmitting}
                  >
                    Lepas kartu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Belum ada kartu RFID terhubung dengan akun kamu.
                </p>
                <form onSubmit={handleLinkCard} className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="grid gap-2">
                    <Label htmlFor="rfidTag">RFID Tag</Label>
                    <Input
                      id="rfidTag"
                      value={rfidTag}
                      onChange={(event) => setRfidTag(event.target.value)}
                      placeholder="Masukkan RFID Tag"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting || !rfidTag.trim()}>
                    Hubungkan Kartu
                  </Button>
                </form>
              </div>
            )}

            {feedbackMessage ? (
              <p className="text-sm text-muted-foreground">{feedbackMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

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

  const card = await prisma.card.findFirst({
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
      card: card || null,
    },
  };
};

export default UserPage;

