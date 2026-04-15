import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Clock, Shield, Navigation } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <header className="mb-10 flex w-full flex-col gap-4 rounded-3xl border border-border bg-muted/70 p-4 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-foreground">BusControl</p>
            <p className="text-xs text-muted-foreground">IoT monitoring dashboard starter</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              Admin Dashboard
            </Link>
            <Link href="/admin/buses" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              Bus Management
            </Link>
            <Link href="/admin/rfid" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              RFID Management
            </Link>
          </nav>
        </header>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the index.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-background text-foreground`}>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-card/95 border-b border-border shadow-sm z-50 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Bus className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-foreground">BussControl</span>
            </div>
            <div className="hidden md:flex gap-6">
              <Link href="#" className="text-foreground/75 hover:text-primary">Beranda</Link>
              <Link href="#layanan" className="text-foreground/75 hover:text-primary">Layanan</Link>
              <Link href="#tentang" className="text-foreground/75 hover:text-primary">Tentang</Link>
            </div>
            <Link href="/auth/login">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-primary to-accent text-primary-foreground pt-20">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Perjalanan Mudah Aman dan Nyaman</h1>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Sistem monitoring dan tracking bus real-time untuk kenyamanan perjalanan Anda.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/login">
                <Button className="bg-card text-foreground border border-border hover:bg-card/90">
                  Mulai Sekarang
                </Button>
              </Link>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Layanan Section */}
      <section id="layanan" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Layanan Kami</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center bg-card border border-border shadow-sm">
              <CardHeader>
                <Navigation className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Live Tracking</CardTitle>
                <CardDescription>
                  Pantau posisi bus secara real-time dan estimasi kedatangan yang akurat.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center bg-card border border-border shadow-sm">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Jadwal Terjadwal</CardTitle>
                <CardDescription>
                  Informasi jadwal keberangkatan dan kedatangan yang tepat waktu.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center bg-card border border-border shadow-sm">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Keamanan Terjamin</CardTitle>
                <CardDescription>
                  Sistem keamanan terintegrasi untuk perjalanan yang aman dan nyaman.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground/70 border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; 2026 BussControl. Menghubungkan Kehidupan Mahasiswa Malang.</p>
        </div>
      </footer>
    </div>
  );
}