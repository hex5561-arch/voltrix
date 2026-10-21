import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';

// Extracted Home Page Component (Fv in minified bundle)
export function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6">
        <h1 className="text-4xl text-balance font-bold tracking-tight">
          Welcome to Your Blank App
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start chatting to build your app
        </p>
      </div>
    </div>
  );
}

// Extracted Auth Callback Component (Pv in minified bundle)
export function AuthCallback() {
  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4 text-foreground">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

// Extracted 404 Component (Iv in minified bundle)
export function NotFound() {
  const location = useLocation();

  React.useEffect(() => {
    console.error(`404 Error: User attempted to access non-existent route:`, location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          This page does not exist.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Extracted Root Component (Lv in minified bundle)
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
