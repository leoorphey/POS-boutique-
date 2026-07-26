import { useToasts } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg bg-background animate-in slide-in-from-bottom-2",
            toast.variant === "destructive" &&
              "border-destructive bg-destructive text-destructive-foreground",
            toast.variant === "success" &&
              "border-green-600 bg-green-600 text-white"
          )}
        >
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description && (
            <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
