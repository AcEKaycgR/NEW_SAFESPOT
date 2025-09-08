import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

type MapPlaceholderProps = {
  className?: string;
  showControls?: boolean;
};

// This component is deprecated. Use <Map /> instead.
export default function MapPlaceholder({ className, showControls = false }: MapPlaceholderProps) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-lg border bg-card shadow-sm", className)}>
      <div
        className="h-full w-full opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(45deg, hsl(var(--border)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--border)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--border)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--border)) 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          Map Area
        </p>
      </div>
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
