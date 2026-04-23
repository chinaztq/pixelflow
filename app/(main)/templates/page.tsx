import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { TemplateGrid } from "./TemplateGrid";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium" style={{ color: "var(--text)" }}>
          模板库
        </h1>
      </div>
      <TemplateGrid initialTemplates={templates} />
    </div>
  );
}
