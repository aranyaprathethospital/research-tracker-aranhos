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

const now = new Date().toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seed: Research[] = [
  { id:"R-26001",title:"ปัจจัยที่มีผลต่อการเข้าถึงบริการสุขภาพปฐมภูมิของผู้สูงอายุ",student:"กมลชนก ใจดี",faculty:"สาธารณสุขศาสตร์",advisor:["ดร. อรทัย วัฒนกุล","ผศ. ดร. สมชาย ธรรมรักษ์"],stage:4,progress:68,dueDate:daysFromNow(12),issue:"รอข้อมูลจากหน่วยบริการในพื้นที่",nextTask:"วิเคราะห์ผลและสรุปบทที่ 4",review:"ส่งตรวจ",updatedAt:now,history:[{text:"อัปเดตความก้าวหน้าเป็น 68% · บทที่ 3",date:now,by:"กมลชนก ใจดี"},{text:"ส่งโครงร่างบทที่ 3 ให้ที่ปรึกษาตรวจ",date:new Date(Date.now()-86400000*2).toISOString(),by:"กมลชนก ใจดี"}],comments:[{text:"โครงสร้างโดยรวมชัดเจนแล้ว เพิ่มรายละเอียดเกณฑ์คัดเลือกกลุ่มตัวอย่างอีกเล็กน้อย",date:new Date(Date.now()-86400000).toISOString(),by:"ดร. อรทัย วัฒนกุล"}]},
  { id:"R-26002",title:"ความรอบรู้ด้านสุขภาพและพฤติกรรมการป้องกันโรคเบาหวาน",student:"ณัฐวุฒิ แสงทอง",faculty:"สาธารณสุขศาสตร์",advisor:["ผศ. ดร. สมชาย ธรรมรักษ์"],stage:3,progress:42,dueDate:daysFromNow(4),issue:"",nextTask:"ทบทวนวรรณกรรมเรื่องปัจจัยเสี่ยง",review:"ขอแก้ไข",updatedAt:now,history:[{text:"ส่งบทที่ 2 ฉบับแก้ไข",date:new Date(Date.now()-86400000*3).toISOString(),by:"ณัฐวุฒิ แสงทอง"}],comments:[]},
  { id:"R-26003",title:"รูปแบบการดูแลต่อเนื่องผู้ป่วยโรคเรื้อรังในชุมชน",student:"พิมพ์ชนก คำแสน",faculty:"พยาบาลศาสตร์",advisor:["ดร. อรทัย วัฒนกุล"],stage:2,progress:81,dueDate:daysFromNow(22),issue:"",nextTask:"ปรับวัตถุประสงค์ให้สอดคล้องกับกรอบแนวคิด",review:"อนุมัติ",updatedAt:now,history:[{text:"ที่ปรึกษาอนุมัติบทที่ 1",date:new Date(Date.now()-86400000*4).toISOString(),by:"ดร. อรทัย วัฒนกุล"}],comments:[]},
  { id:"R-26004",title:"ประสิทธิผลของโปรแกรมส่งเสริมการเลิกบุหรี่ในวัยทำงาน",student:"ธนภัทร มีสุข",faculty:"สาธารณสุขศาสตร์",advisor:["รศ. ดร. วิไลพร พูนเพิ่ม","ผศ. ดร. สมชาย ธรรมรักษ์"],stage:5,progress:25,dueDate:daysFromNow(35),issue:"",nextTask:"เก็บข้อมูลหลังการทดลอง",review:"ยังไม่ส่งตรวจ",updatedAt:now,history:[],comments:[]},
  { id:"R-26005",title:"การพัฒนาระบบติดตามการใช้ยาของผู้ป่วยสูงอายุ",student:"ศิริพร บุญมี",faculty:"เภสัชศาสตร์",advisor:["รศ. ดร. วิไลพร พูนเพิ่ม"],stage:1,progress:56,dueDate:daysFromNow(-2),issue:"กำหนดการเก็บข้อมูลล่าช้ากว่าแผน",nextTask:"นัดหมายผู้เชี่ยวชาญตรวจเครื่องมือ",review:"ส่งตรวจ",updatedAt:now,history:[],comments:[]},
  { id:"R-26006",title:"ปัจจัยที่เกี่ยวข้องกับสุขภาวะทางใจของนักศึกษามหาวิทยาลัย",student:"วรัญญา นาคทอง",faculty:"สังคมศาสตร์",advisor:["ดร. อรทัย วัฒนกุล"],stage:7,progress:90,dueDate:daysFromNow(6),issue:"",nextTask:"เตรียมสไลด์นำเสนอผลงาน",review:"อนุมัติ",updatedAt:now,history:[],comments:[]},
  { id:"R-26007",title:"แนวทางการสื่อสารความเสี่ยงโรคติดต่อในพื้นที่ชายแดน",student:"ปกรณ์ วงศ์คำ",faculty:"สาธารณสุขศาสตร์",advisor:["ผศ. ดร. สมชาย ธรรมรักษ์"],stage:0,progress:0,dueDate:daysFromNow(50),issue:"",nextTask:"กำหนดหัวข้อและขอบเขตการศึกษา",review:"ยังไม่ส่งตรวจ",updatedAt:now,history:[],comments:[]},
  { id:"R-26008",title:"การเข้าถึงบริการทันตกรรมของเด็กวัยเรียนในพื้นที่ชนบท",student:"ชลธิชา อินทร์แก้ว",faculty:"ทันตแพทยศาสตร์",advisor:["รศ. ดร. วิไลพร พูนเพิ่ม"],stage:6,progress:73,dueDate:daysFromNow(18),issue:"",nextTask:"จัดทำบทสรุปและข้อเสนอแนะ",review:"ส่งตรวจ",updatedAt:now,history:[],comments:[]},
];

export const initialResearch = seed;
