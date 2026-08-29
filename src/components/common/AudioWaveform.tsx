import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, barCount = 36 }) => {
  const [heights, setHeights] = useState<number[]>(() => 
    Array.from({ length: barCount }, () => Math.floor(Math.random() * 20) + 6)
  );

  useEffect(() => {
    if (!isRecording) {
      setHeights(Array.from({ length: barCount }, () => 6));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Generate wave-like pulsating random height
          const base = Math.sin((i / barCount) * Math.PI) * 28;
          const jitter = Math.random() * 16;
          return Math.max(6, Math.min(48, Math.floor(base + jitter)));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isRecording, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-16 w-full px-4 bg-indigo-50/40 rounded-xl border border-indigo-100/60 overflow-hidden">
      {heights.map((h, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-100 ${
            isRecording 
              ? 'bg-gradient-to-t from-[#3525CD] to-[#712AE2]' 
              : 'bg-indigo-200'
          }`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
};
