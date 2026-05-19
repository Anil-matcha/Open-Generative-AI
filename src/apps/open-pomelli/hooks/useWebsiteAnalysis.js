import { useState } from 'react';
export function useWebsiteAnalysis() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}