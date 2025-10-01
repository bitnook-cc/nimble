export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found - Portal</h2>
        <p className="text-muted-foreground">
          This page could not be found on the Nimble Portal.
        </p>
        <a href="/" className="inline-block mt-4 text-primary hover:underline">
          Return to Home
        </a>
      </div>
    </div>
  );
}
