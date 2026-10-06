/**
 * ConfirmDialog — accessible confirmation modal for destructive or critical actions.
 */
'use client';

import * as React from 'react';
import { Modal, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={title} description={description} widthClass="max-w-md">
        <div className="mt-4 flex items-start gap-3 rounded-card-sm p-3 bg-neutral-50 border border-neutral-200">
          {isDanger ? (
            <AlertTriangle className="h-5 w-5 text-state-error shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Info className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <p className="text-xs text-neutral-600 leading-relaxed">
            {isDanger
              ? 'This action cannot be undone. Please ensure you want to proceed.'
              : 'Please review the details before confirming this update.'}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={isDanger ? 'bg-state-error hover:bg-state-error/90 text-neutral-0 focus-visible:outline-state-error' : undefined}
            isLoading={isLoading}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
