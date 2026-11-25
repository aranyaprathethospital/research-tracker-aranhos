import { LoadingShape, Placeholder } from "@/components/ui/page-loading";

export default function AuthLoading({ screen }: { screen: "login" | "role" | "setup" | "password" }) {
  return (
    <LoadingShape label="กำลังเตรียมหน้าเข้าสู่ระบบ">
      <div className="space-y-5">
        <div className="space-y-3">
          <Placeholder className="h-12 w-52 max-w-full" />
          <Placeholder className="h-4 w-72 max-w-full" />
        </div>
        {screen === "role" ? (
          <div className="grid gap-3">
            <Placeholder className="h-23 rounded-lg" />
            <Placeholder className="h-23 rounded-lg" />
          </div>
        ) : screen === "login" ? (
          <>
            <Placeholder className="h-14 rounded-lg" />
            <Placeholder className="h-12 rounded-lg" />
            <Placeholder className="h-5 w-72 max-w-full" />
          </>
        ) : (
          <>
            {Array.from({ length: screen === "setup" ? 4 : screen === "password" ? 3 : 2 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Placeholder className="h-4 w-24" />
                <Placeholder className="h-12" />
              </div>
            ))}
            <Placeholder className="h-12" />
          </>
        )}
      </div>
    </LoadingShape>
  );
}
