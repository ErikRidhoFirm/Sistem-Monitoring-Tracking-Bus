import { UserLayout } from "@/components/user/layout";

export default function UserPage() {
  return (
    <UserLayout>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the user dashboard. Here you can view your profile and
          manage your settings.
        </p>
      </div>
    </UserLayout>
  );
}
