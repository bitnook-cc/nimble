import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
}

export function LoadingScreen({ message = "Loading...", showSpinner = true }: LoadingScreenProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {showSpinner && <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />}
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
