// Hook for headshot generation status polling
import { useState } from 'react';
export function useHeadshotGeneration() {
  const [status, setStatus] = useState('idle');
  return { status, setStatus };
}