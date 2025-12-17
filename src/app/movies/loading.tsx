import Header from "~/components/navigation/Header";
import { Skeleton } from "~/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header showSearch={false} />

        <div className="flex items-center mt-10 mb-6">
          <div className="mr-3 p-2 rounded-md">
            <Skeleton className="h-[18px] w-[18px]" />
          </div>
          <Skeleton className="h-5 w-40" />
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden bg-card border border-white/10 rounded-xl">
              <div className="flex">
                <div className="relative w-[120px] h-[180px] flex-shrink-0">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1">
                        <Skeleton className="h-5 w-2/3" />
                      </div>
                      <div className="mb-2 space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-16 rounded" />
                      <Skeleton className="h-8 w-16 rounded" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}


