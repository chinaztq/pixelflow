import type { SessionUser } from "@/types";
import type { Brief } from "@prisma/client";

// All features are open to all authenticated users

export function canViewBrief(_user: SessionUser, _brief: Pick<Brief, "requesterId" | "assigneeId">): boolean {
  return true;
}

export function canUploadVersion(_user: SessionUser, brief: Pick<Brief, "assigneeId" | "status">): boolean {
  if (brief.status === "COMPLETED" || brief.status === "CANCELLED") return false;
  return true;
}

export function canReviewVersion(_user: SessionUser, _brief: Pick<Brief, "requesterId">): boolean {
  return true;
}

export function canAssignBrief(_user: SessionUser, brief: Pick<Brief, "status">): boolean {
  return brief.status === "PENDING";
}

export function canDeleteBrief(_user: SessionUser, brief: Pick<Brief, "requesterId" | "status">): boolean {
  return brief.status === "PENDING";
}

export function canManageUsers(_user: SessionUser): boolean {
  return true;
}
