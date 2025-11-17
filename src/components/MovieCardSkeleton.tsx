import { Skeleton } from "./ui/Skeleton";

// Compact skeleton for carousel display
export function CompactMovieCardSkeleton() {
  return (
    <div className="group relative overflow-hidden p-1.5 px-3 pt-3 rounded-t-[16px] rounded-b-[24px] border border-white/10 bg-[#141414] shadow-lg flex flex-col w-full max-w-[280px]">
      {/* Movie Poster Skeleton */}
      <div className="relative aspect-[2/3] w-full rounded-[18px] overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Movie Info Skeleton */}
      <div className="flex-1 flex flex-col justify-between p-4 px-0">
        <div>
          {/* Title and Year */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          
          {/* Description */}
          <div className="mb-3 space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          
          {/* Genres */}
          <div className="mb-3 flex gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        
        {/* Vote and Comment Counts */}
        <div className="mb-3 flex items-center justify-between text-xs mt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-6" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
        
        {/* Vote Buttons */}
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-8 flex-1 rounded" />
          <Skeleton className="h-8 flex-1 rounded" />
        </div>
      </div>
    </div>
  );
}

// Regular skeleton for grid display
export function MovieCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#23232B] shadow-2xl flex flex-col">
      {/* Movie Poster Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Movie Info Skeleton */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          {/* Title and Year */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          
          {/* Description */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Genres */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        
        {/* Vote Counts */}
        <div className="mb-4 flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Vote Buttons */}
        <div className="flex gap-3 mt-2">
          <Skeleton className="h-10 flex-1 rounded" />
          <Skeleton className="h-10 flex-1 rounded" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for the horizontal card layout used in /movies page
export function HorizontalMovieCardSkeleton() {
  return (
    <div className="overflow-hidden bg-black">
      <div className="flex">
        {/* Poster Skeleton */}
        <div className="relative w-[120px] h-[180px] flex-shrink-0">
          <Skeleton className="w-full h-full" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Title */}
              <div className="mb-1">
                <Skeleton className="h-5 w-3/4" />
              </div>
              {/* Description */}
              <div className="mb-2 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            {/* Watchlist button skeleton */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>

          {/* Vote buttons skeleton */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
            {/* Status skeleton */}
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}