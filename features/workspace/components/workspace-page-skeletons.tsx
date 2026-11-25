import { Placeholder } from "@/components/ui/page-loading";
import WorkspaceLoading, { SummaryLoading } from "./workspace-loading";

function ListSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-4 sm:p-6">
      <Placeholder className="h-6 w-40" />
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Placeholder className="h-11" /><Placeholder className="h-11" />
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-border pt-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <Placeholder className="h-5 w-full max-w-48" />
          <Placeholder className="hidden h-4 w-24 sm:block" />
          <Placeholder className="hidden h-4 w-20 sm:block" />
          <Placeholder className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ProjectListLoading() {
  return <WorkspaceLoading label="กำลังโหลดรายการงานวิจัย"><ListSkeleton /></WorkspaceLoading>;
}

export function TeamLoading() {
  return (
    <WorkspaceLoading label="กำลังโหลดทีมวิจัย">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => <Placeholder key={index} className="h-40 rounded-2xl" />)}
      </div>
    </WorkspaceLoading>
  );
}

export function DashboardLoading() {
  return (
    <WorkspaceLoading label="กำลังโหลดภาพรวมงานวิจัย">
      <div className="space-y-5">
        <SummaryLoading />
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <ListSkeleton />
          <div className="space-y-4 rounded-xl border border-border bg-white p-5">
            <Placeholder className="h-6 w-32" />
            <Placeholder className="h-12" /><Placeholder className="h-12" />
          </div>
        </div>
      </div>
    </WorkspaceLoading>
  );
}

export function UsersLoading() {
  return (
    <WorkspaceLoading label="กำลังตรวจสอบสิทธิ์และโหลดรายชื่อผู้ใช้">
      <div className="space-y-5">
        <SummaryLoading />
        <Placeholder className="h-14" />
        <ListSkeleton />
      </div>
    </WorkspaceLoading>
  );
}

export function ProfileFieldsLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.5fr]">
      <div className="space-y-4 rounded-xl border border-border bg-white p-5">
        <Placeholder className="h-20" />
        <Placeholder className="size-16 rounded-full" />
        <Placeholder className="h-6 w-40" />
        <Placeholder className="h-24" />
      </div>
      <div className="grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-2">
        <Placeholder className="h-11 sm:col-span-2" />
        {Array.from({ length: 6 }, (_, index) => <Placeholder key={index} className="h-16" />)}
        <Placeholder className="h-14 sm:col-span-2" />
      </div>
    </div>
  );
}

export function ProfileLoading() {
  return <WorkspaceLoading label="กำลังโหลดโปรไฟล์"><ProfileFieldsLoading /></WorkspaceLoading>;
}
