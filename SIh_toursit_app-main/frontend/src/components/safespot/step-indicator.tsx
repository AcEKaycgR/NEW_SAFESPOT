import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  icon: React.ElementType;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.label}
            className={cn("relative", stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20 flex-1" : "")}
          >
            {currentStep > stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : currentStep === stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background"
                >
                   <step.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
              </>
            )}
            <div className="absolute top-10 w-max -ml-2">
                 <p className={cn("text-sm font-medium", currentStep >= stepIdx + 1 ? 'text-primary' : 'text-muted-foreground' )}>{step.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
