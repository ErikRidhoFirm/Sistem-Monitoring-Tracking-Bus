import { AdminLayout } from "@/components/admin/layout";

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Here you can manage your application.
        </p>
      </div>
    </AdminLayout>
  );
}
