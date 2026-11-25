import { reviewLabels, stages, type ReviewStatus } from "@/lib/research-types";

const updateLabels = new Map([
  ["Created research project", "สร้างโครงการวิจัย"],
  ["Updated project issue", "อัปเดตปัญหาหรือสิ่งที่ติดขัด"],
  ["Updated current results", "อัปเดตผลการดำเนินงานปัจจุบัน"],
  ["Updated project notes", "อัปเดตหมายเหตุ"],
  ["Updated due date", "ปรับกำหนดส่ง"],
  ["Updated primary and secondary advisor assignments", "ปรับรายชื่อที่ปรึกษาหลักและที่ปรึกษารอง"],
  ["Added advisor comment", "เพิ่มความเห็นจากที่ปรึกษา"],
]);

export function formatResearchHistory(summary: string) {
  return summary.split(" · ").map((entry) => {
    const stageMatch = /^Changed stage to (\d+)$/.exec(entry);
    const stageLabel = stageMatch ? stages[Number(stageMatch[1])] : undefined;
    if (stageLabel) return `เปลี่ยนขั้นตอนเป็น ${stageLabel}`;

    const reviewMatch = /^Updated advisor review to (.+)$/.exec(entry);
    if (reviewMatch && Object.hasOwn(reviewLabels, reviewMatch[1])) {
      return `เปลี่ยนสถานะการตรวจเป็น ${reviewLabels[reviewMatch[1] as ReviewStatus]}`;
    }

    return updateLabels.get(entry) ?? entry;
  }).join(" · ");
}
