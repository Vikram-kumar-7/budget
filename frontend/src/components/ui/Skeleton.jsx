import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--r-sm)', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}
