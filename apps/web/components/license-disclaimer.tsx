import { APP_CONFIG } from "@/lib/config/app-config";

export function LicenseDisclaimer() {
  return (
    <div className="border-t bg-muted/30 py-2 px-4">
      <div className="container mx-auto">
        <p className="text-xs text-muted-foreground text-center">
          {APP_CONFIG.APP_NAME} is an independent product published under the Nimble 3rd Party
          Creator License and is not affiliated with Nimble Co. Nimble © 2025 Nimble Co.
        </p>
      </div>
    </div>
  );
}
