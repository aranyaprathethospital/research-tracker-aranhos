export const workspacePaths = {
  "ภาพรวม": "/",
  "งานวิจัย": "/projects",
  "ความเห็น": "/comments",
  "ทีม": "/team",
} as const;

export type WorkspaceView = keyof typeof workspacePaths;

export function workspaceHref(label: string) {
  if (label === "จัดการผู้ใช้") return "/users";
  if (label === "สรุปที่ปรึกษาหลัก") return "/advisors";
  return Object.hasOwn(workspacePaths, label) ? workspacePaths[label as WorkspaceView] : "/";
}
