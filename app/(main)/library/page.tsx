import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { LibraryGrid } from "./LibraryGrid";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [images, channels] = await Promise.all([
    prisma.image.findMany({
      where: { isArchived: true },
      include: {
        tags: true,
        version: { include: { brief: { select: { id: true, title: true, channel: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.brief.findMany({
      where: { status: "COMPLETED" },
      select: { channel: true },
      distinct: ["channel"],
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-base font-medium" style={{ color: "var(--text)" }}>
        素材库
      </h1>
      <LibraryGrid
        initialImages={images as Parameters<typeof LibraryGrid>[0]["initialImages"]}
        channels={channels.map((c) => c.channel)}
      />
    </div>
  );
}
