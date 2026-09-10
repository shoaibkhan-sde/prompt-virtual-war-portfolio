import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-border/40 rounded-lg ${className}`}
      role="status"
      aria-label="Loading placeholder"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="ledger-card space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="ledger-card flex flex-col justify-between h-[300px]">
      <Skeleton className="h-6 w-1/4 mb-4" />
      <div className="flex-1 flex items-end justify-between space-x-2 pt-6">
        <Skeleton className="h-[40%] w-[12%]" />
        <Skeleton className="h-[60%] w-[12%]" />
        <Skeleton className="h-[30%] w-[12%]" />
        <Skeleton className="h-[80%] w-[12%]" />
        <Skeleton className="h-[50%] w-[12%]" />
        <Skeleton className="h-[70%] w-[12%]" />
        <Skeleton className="h-[45%] w-[12%]" />
      </div>
    </div>
  );
};

export const CoachSkeleton: React.FC = () => {
  return (
    <div className="ledger-card space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default Skeleton;
