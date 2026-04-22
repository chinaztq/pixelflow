import type {
  User,
  Brief,
  Version,
  Image,
  Comment,
  Tag,
  ReferenceImage,
  Notification,
  Role,
  BriefStatus,
  Priority,
  VersionStatus,
  CommentType,
} from "@prisma/client";

export type { Role, BriefStatus, Priority, VersionStatus, CommentType };

// Extended types with relations
export type UserSafe = Omit<User, "password">;

export type BriefWithRelations = Brief & {
  requester: UserSafe;
  assignee: UserSafe | null;
  versions: VersionWithRelations[];
  references: ReferenceImage[];
  _count?: { versions: number };
};

export type VersionWithRelations = Version & {
  uploader: UserSafe;
  images: Image[];
  comments: CommentWithAuthor[];
};

export type CommentWithAuthor = Comment & {
  author: UserSafe;
};

export type ImageWithTags = Image & {
  tags: Tag[];
  version: Version & {
    brief: Pick<Brief, "id" | "title" | "channel">;
  };
};

// API response shape
export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Paginated response
export type PaginatedData<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Session user (from NextAuth)
export interface SessionUser {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  role: Role;
  avatar?: string | null;
}
