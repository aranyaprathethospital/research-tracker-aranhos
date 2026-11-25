export type UserDirectoryPerson = {
  id: string;
  name: string;
  fullName?: string;
  systemRole: string;
  capabilities: string[];
  email?: string;
  position?: string;
  positionLevel?: string;
  mission?: string;
  workGroup?: string;
  providerId?: string | null;
  cidRegistered?: boolean;
  active?: boolean;
  userId?: string | null;
  avatarUrl?: string | null;
  signatureUrl?: string | null;
};

export type ResearchPersonOption = Pick<UserDirectoryPerson, "id" | "name" | "capabilities" | "active">;
