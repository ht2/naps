import { redirect } from "next/navigation";
import { validateAdminSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await validateAdminSession();

  if (!isAuthenticated) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
