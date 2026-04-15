import type { GetServerSideProps, NextPage } from "next";

import { UserLayout } from "@/components/user/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromRequest } from "@/lib/api-session";

type ProfilePageProps = {
  userName: string;
  userEmail: string;
};

const ProfilePage: NextPage<ProfilePageProps> = ({ userName, userEmail }) => {
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="space-y-2 rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-bold">Profil Pengguna</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil Anda di sini.
          </p>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>Detail akun pengguna Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Nama</p>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async (context) => {
  const session = await getSessionFromRequest(context.req);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const userName = session.user.name || "Pengguna";
  const userEmail = session.user.email || "Tidak ada email";

  return {
    props: {
      userName,
      userEmail,
    },
  };
};

export default ProfilePage;