// src/components/ui/Clock.tsx
import React, { useEffect, useState } from 'react';

const Clock: React.FC<{
  size?: number;
  borderColor?: string;
}> = ({ size = 32, borderColor = '#666' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // calculate hand angles
  const seconds = time.getSeconds();
  const minutes = time.getMinutes() + seconds / 60;
  const hours   = time.getHours() % 12 + minutes / 60;

  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle   = (hours   / 12) * 360;

  const center = size / 2;
  const radius = center - 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      {/* clock face */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke={borderColor}
        strokeWidth="2"
      />
      {/* hour hand */}
      <line
        x1={center}
        y1={center}
        x2={center + Math.sin((Math.PI / 180) * hourAngle) * radius * 0.5}
        y2={center - Math.cos((Math.PI / 180) * hourAngle) * radius * 0.5}
        stroke={borderColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* minute hand */}
      <line
        x1={center}
        y1={center}
        x2={center + Math.sin((Math.PI / 180) * minuteAngle) * radius * 0.75}
        y2={center - Math.cos((Math.PI / 180) * minuteAngle) * radius * 0.75}
        stroke={borderColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* second hand */}
      <line
        x1={center}
        y1={center}
        x2={center + Math.sin((Math.PI / 180) * secondAngle) * radius * 0.85}
        y2={center - Math.cos((Math.PI / 180) * secondAngle) * radius * 0.85}
        stroke="red"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* center dot */}
      <circle cx={center} cy={center} r="2" fill={borderColor} />
    </svg>
  );
};

export default Clock;
