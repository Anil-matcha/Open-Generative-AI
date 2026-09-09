"use client";

import ImageStudio from "./ImageStudio.jsx";
import ProviderPicker from "./ProviderPicker.jsx";

/**
 * Image Studio shell for the multi-provider branch.
 * The provider picker persists the backend preference consumed by
 * providerAwareImage.js while leaving the existing Studio UI intact.
 */
export default function ProviderAwareImageStudio(props) {
  return (
    <div className="relative w-full h-full">
      <ProviderPicker />
      <ImageStudio {...props} />
    </div>
  );
}
