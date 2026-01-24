'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft | null {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeUnit({ value, label, compact }: { value: number; label: string; compact: boolean }) {
  const displayValue = String(value).padStart(2, '0');

  if (compact) {
    return (
      <div className="text-center">
        <span className="text-xl font-bold text-white">{displayValue}</span>
        <span className="text-xs text-gray-500 ml-0.5">{label[0]}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-white font-mono">{displayValue}</span>
      </div>
      <span className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ targetDate, label, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Don't render on server to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className={compact ? 'h-8' : 'h-24'}>
        <div className="animate-pulse bg-[#2a2a2a] rounded h-full w-40" />
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className={`text-center ${compact ? 'py-1' : 'py-4'}`}>
        <span className="text-[#d20a0a] font-bold text-lg animate-pulse">
          LIVE NOW
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#3a3a3a]">
        {label && <span className="text-xs text-gray-400 mr-2">{label}</span>}
        <TimeUnit value={timeLeft.days} label="days" compact />
        <span className="text-gray-500">:</span>
        <TimeUnit value={timeLeft.hours} label="hours" compact />
        <span className="text-gray-500">:</span>
        <TimeUnit value={timeLeft.minutes} label="min" compact />
        <span className="text-gray-500">:</span>
        <TimeUnit value={timeLeft.seconds} label="sec" compact />
      </div>
    );
  }

  return (
    <div className="text-center">
      {label && (
        <p className="text-gray-400 text-sm mb-3 uppercase tracking-wide">{label}</p>
      )}
      <div className="flex items-center justify-center gap-3">
        <TimeUnit value={timeLeft.days} label="Days" compact={false} />
        <span className="text-2xl text-[#d20a0a] font-bold mt-[-24px]">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" compact={false} />
        <span className="text-2xl text-[#d20a0a] font-bold mt-[-24px]">:</span>
        <TimeUnit value={timeLeft.minutes} label="Mins" compact={false} />
        <span className="text-2xl text-[#d20a0a] font-bold mt-[-24px]">:</span>
        <TimeUnit value={timeLeft.seconds} label="Secs" compact={false} />
      </div>
    </div>
  );
}
