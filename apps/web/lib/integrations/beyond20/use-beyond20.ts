/**
 * React hook for Beyond20 integration
 */
import { useEffect, useState } from "react";

import { beyond20DetectionService } from "./beyond20-detection-service";
import { Beyond20Integration } from "./types";

export function useBeyond20(): Beyond20Integration {
  const [integration, setIntegration] = useState<Beyond20Integration>(
    beyond20DetectionService.getStatus(),
  );

  useEffect(() => {
    // Register callback for when Beyond20 loads
    beyond20DetectionService.onLoaded(() => {
      setIntegration(beyond20DetectionService.getStatus());
    });

    // Also check current status
    setIntegration(beyond20DetectionService.getStatus());
  }, []);

  return integration;
}
