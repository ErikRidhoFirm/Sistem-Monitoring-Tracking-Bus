import type { GetServerSideProps, NextPage } from "next";
import { useState } from "react";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getSessionFromRequest } from "@/lib/api-session";

type ProfilePageProps = {
  userName: string;
  userEmail: string;
};

const ProfilePage: NextPage<ProfilePageProps> = ({ userName, userEmail }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    const response = await fetch("/api/user/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, email: userEmail }),
    });

    if (response.ok) {
      alert("Profil berhasil diperbarui");
      setIsEditing(false);
    } else {
      alert("Gagal memperbarui profil");
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Profil User"
          title="Profil Pengguna"
          description="Kelola informasi akun Anda dengan tampilan yang konsisten dan profesional." 
        />

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
              <Button type="button" onClick={handleEditToggle} className="mt-4 w-full">
                Edit Profil
              </Button>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <Card className="border border-border bg-card mt-6">
            <CardHeader>
              <CardTitle>Edit Profil</CardTitle>
              <CardDescription>Perbarui informasi profil Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Nama Baru</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="button" onClick={handleSave} className="mt-4 w-full">
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
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
