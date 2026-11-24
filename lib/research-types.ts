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

export type Role = "Superadmin" | "PM" | "Advisor" | "Advisee";
export type ReviewStatus = "ยังไม่ส่งตรวจ" | "ส่งตรวจ" | "ขอแก้ไข" | "อนุมัติ";
export type Research = {
  id: string; title: string; student: string; faculty: string; advisor: string[];
  primaryAdvisor?: string; secondaryAdvisors?: string[];
  advisorReviews?: { id: string; advisor: string; assignment: "PRIMARY" | "SECONDARY"; status: ReviewStatus }[];
  myReview?: ReviewStatus;
  isMyAdvisor?: boolean;
  stage: number; progress: number; dueDate: string; issue: string; nextTask: string;
  review: ReviewStatus; updatedAt: string; history: { text: string; date: string; by: string }[];
  comments: { text: string; date: string; by: string }[];
};
