import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  const user = {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
    avatar: session.user.avatar,
  };

  return (
    <MainLayout user={user} unreadCount={unreadCount}>
      {children}
    </MainLayout>
  );
}
