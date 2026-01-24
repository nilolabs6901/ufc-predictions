'use client';

interface LoadingSkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[#2a2a2a] via-[#3a3a3a] to-[#2a2a2a] bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function FightCardSkeleton() {
  return (
    <div className="fight-card overflow-hidden">
      {/* Title badge area */}
      <div className="flex justify-center py-2 bg-[#1a1a1a] border-b border-[#3a3a3a]">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Main fight display */}
      <div className="flex items-stretch">
        {/* Fighter A */}
        <div className="flex-1 p-4">
          <div className="flex flex-col items-center">
            {/* Photo */}
            <Skeleton className="w-28 h-28 mb-3 rounded-lg" />
            {/* Name */}
            <Skeleton className="h-6 w-32 mb-2" />
            {/* Nickname */}
            <Skeleton className="h-4 w-24 mb-1" />
            {/* Record */}
            <Skeleton className="h-4 w-16 mb-2" />
            {/* Odds */}
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-4 py-6 bg-[#1a1a1a]">
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Fighter B */}
        <div className="flex-1 p-4">
          <div className="flex flex-col items-center">
            <Skeleton className="w-28 h-28 mb-3 rounded-lg" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="px-4 py-3 border-t border-[#3a3a3a]">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>

      {/* Insights area */}
      <div className="border-t border-[#3a3a3a] px-4 py-3 bg-[#1a1a1a]">
        <Skeleton className="h-4 w-24 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-6 w-36 rounded" />
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="fight-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-48 mb-2" />
      <div className="bg-[#1a1a1a] rounded p-2 mb-2">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function EventPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#3a3a3a]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Event Header */}
      <div className="bg-gradient-to-r from-[#d20a0a] to-[#a00808] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-12 rounded" />
          </div>
          <Skeleton className="h-10 w-64 mb-2" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </div>

      {/* Fight Cards */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 rounded-t-lg mb-4" />
        <div className="space-y-4">
          <FightCardSkeleton />
          <FightCardSkeleton />
          <FightCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#d20a0a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
