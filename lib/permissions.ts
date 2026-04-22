import type { SessionUser } from "@/types";
import type { Brief, Version } from "@prisma/client";

export function canViewBrief(user: SessionUser, brief: Pick<Brief, "requesterId" | "assigneeId">): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "REQUESTER") return brief.requesterId === user.id;
  // DESIGNER: can see if assigned or unassigned (public pool)
  return brief.assigneeId === user.id || brief.assigneeId === null;
}

export function canUploadVersion(user: SessionUser, brief: Pick<Brief, "assigneeId" | "status">): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "DESIGNER") return false;
  if (brief.status === "COMPLETED" || brief.status === "CANCELLED") return false;
  return brief.assigneeId === user.id;
}

export function canReviewVersion(user: SessionUser, brief: Pick<Brief, "requesterId">): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "REQUESTER" && brief.requesterId === user.id;
}

export function canAssignBrief(user: SessionUser, brief: Pick<Brief, "status">): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "DESIGNER") return false;
  return brief.status === "PENDING";
}

export function canDeleteBrief(user: SessionUser, brief: Pick<Brief, "requesterId" | "status">): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "REQUESTER" && brief.requesterId === user.id && brief.status === "PENDING";
}

export function canManageUsers(user: SessionUser): boolean {
  return user.role === "ADMIN";
}
