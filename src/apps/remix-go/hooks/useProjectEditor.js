import { useState } from 'react';
export function useProjectEditor() {
  const [project, setProject] = useState(null);
  return { project, setProject };
}