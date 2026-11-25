export const projectFilterLabels = {
  all: "ทุกโครงการ",
  due: "ใกล้กำหนดส่ง",
  attention: "ต้องติดตาม",
} as const;

export type ProjectFilter = keyof typeof projectFilterLabels;
