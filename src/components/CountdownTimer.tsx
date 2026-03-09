"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetTime: string; // ISO string
  label?: string;
}

export default function CountdownTimer({
  targetTime,
  label = "Next race",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("Started");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${secs}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (expired) {
    return (
      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
        {label}: Started
      </span>
    );
  }

  return (
    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
      {label}: {timeLeft}
    </span>
  );
}
