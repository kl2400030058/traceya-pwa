"use client";

import { useRouter } from "next/navigation";
import { OnboardingCarousel } from "@/components/onboarding-carousel";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Mark onboarding as completed
    if (typeof window !== "undefined") {
      localStorage.setItem("traceya_onboarding_completed", "true");
    }

    // Redirect to login or dashboard based on auth state
    router.push("/login");
  };

  return <OnboardingCarousel onComplete={handleComplete} />;
}
