import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { BriefDetail } from "./BriefDetail";
import type { SessionUser } from "@/types";

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, avatar: true } },
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      references: true,
      versions: {
        orderBy: { versionNo: "asc" },
        include: {
          uploader: { select: { id: true, name: true, avatar: true } },
          images: true,
          comments: {
            include: { author: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!brief) notFound();

  const sessionUser = session.user as SessionUser;
  const designers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  return (
    <BriefDetail
      brief={brief as Parameters<typeof BriefDetail>[0]["brief"]}
      currentUser={sessionUser}
      designers={designers}
    />
  );
}
