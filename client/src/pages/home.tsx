import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  
  // Automatically redirect to the mobile landing page
  useEffect(() => {
    navigate("/mobile-landing");
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Redirecting to CPXTB Mobile...</p>
      </div>
    </div>
  );
}