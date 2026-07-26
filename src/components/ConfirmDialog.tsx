"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setOpen(false);
    resolvePromise?.(true);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    setOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
          <AlertDialog.Content className="fixed z-50 w-96 max-w-md border border-gray-200 rounded-lg shadow-lg bg-white p-6">
            <div className="flex items-start gap-4">
              {options.destructive && (
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <AlertDialog.Title className="font-semibold text-gray-900">
                  {options.title}
                </AlertDialog.Title>
                {options.description && (
                  <AlertDialog.Description className="mt-2 text-sm text-gray-600">
                    {options.description}
                  </AlertDialog.Description>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <AlertDialog.Cancel asChild>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                >
                  {options.cancelText || "Cancel"}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded ${
                    options.destructive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-brand-600 hover:bg-brand-700"
                  }`}
                >
                  {options.confirmText || "Confirm"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Root>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context.confirm;
}
