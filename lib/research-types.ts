export const stages = [
  "ยังไม่เริ่ม",
  "ความเป็นมาและความสำคัญของปัญหา",
  "บทที่ 1",
  "บทที่ 2",
  "บทที่ 3",
  "บทที่ 4",
  "บทที่ 5",
  "นำเสนอ",
];

export function progressFromStage(stage: number) {
  return Math.round((stage * 100) / (stages.length - 1));
}

export type Role = "Superadmin" | "PM" | "Advisor" | "Advisee";
export type ReviewStatus = "ยังไม่ส่งตรวจ" | "ส่งตรวจ" | "ขอแก้ไข" | "อนุมัติ";
export type Research = {
  titleVersion: number;
  adviseeId: string;
  titleHistory: { version: number; title: string; author: string | null; createdAt: string | null }[];
  id: string; title: string; student: string; faculty: string; advisor: string[];
  primaryAdvisor?: string; secondaryAdvisors?: string[];
  advisorReviews?: { id: string; advisor: string; assignment: "PRIMARY" | "SECONDARY"; status: ReviewStatus }[];
  myReview?: ReviewStatus;
  isMyAdvisor?: boolean;
  stage: number; progress: number; dueDate: string; issue: string; nextTask: string; notes: string;
  review: ReviewStatus; updatedAt: string; history: { text: string; date: string; by: string }[];
  comments: { text: string; date: string; by: string }[];
};

export function titleRoundLabel(version: number) {
  return version >= 3 ? "Final" : `ครั้งที่ ${version}`;
}

export function canEditResearchTitle({
  systemRole,
  isOwnerInAdviseeMode,
  version,
}: {
  systemRole: string;
  isOwnerInAdviseeMode: boolean;
  version: number;
}) {
  return systemRole === "PM" || (isOwnerInAdviseeMode && version < 3);
}
