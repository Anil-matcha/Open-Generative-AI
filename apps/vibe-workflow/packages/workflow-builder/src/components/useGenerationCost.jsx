import { useState, useEffect } from "react";
import axios from "axios";

export const useGenerationCost = (selectedModel, formValues) => {
  const [generationCost, setGenerationCost] = useState(null);
  const [isRefreshingCost, setIsRefreshingCost] = useState(false);

  useEffect(() => {
    if (!selectedModel?.id || selectedModel.id.includes("passthrough")) {
      setGenerationCost(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setIsRefreshingCost(true);
      // We use the direct 8000 port since workflow-demo doesn't proxy /app/ internally and muapiapp runs on 8000
      axios.post("/api/app/calculate_dynamic_cost", {
        task_name: selectedModel.id,
        payload: formValues
      })
      .then((response) => {
        setGenerationCost(response.data.cost);
        setIsRefreshingCost(false);
      })
      .catch((error) => {
        console.error("Error fetching cost:", error);
        setGenerationCost(null);
        setIsRefreshingCost(false);
      });
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [selectedModel?.id, formValues]);

  return { generationCost, isRefreshingCost };
};
