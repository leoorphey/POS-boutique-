import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(toasts));
}

export function pushToast(toast: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { ...toast, id }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
