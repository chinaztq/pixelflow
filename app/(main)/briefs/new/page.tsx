import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { BriefForm } from "@/components/brief/BriefForm";

export default async function NewBriefPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "DESIGNER") redirect("/briefs");

  const designers = await prisma.user.findMany({
    where: { role: "DESIGNER", active: true },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-base font-medium mb-5" style={{ color: "var(--text)" }}>
        新建需求单
      </h1>
      <BriefForm designers={designers} />
    </div>
  );
}
