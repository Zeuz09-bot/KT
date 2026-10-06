/**
 * ImageUploader — admin image uploader component with drag-drop target, preview grid, and primary flag.
 */
'use client';

import * as React from 'react';
import { UploadCloud, X, Star, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

export interface UploadedImage {
  id: string;
  url: string;
  name?: string;
  size?: number;
  isPrimary?: boolean;
}

export interface ImageUploaderProps {
  images: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  images,
  onChange,
  maxFiles = 6,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !onChange) return;
    const remaining = maxFiles - images.length;
    if (remaining <= 0) return;

    const newItems: UploadedImage[] = Array.from(files)
      .slice(0, remaining)
      .map((file, index) => ({
        id: `local-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        isPrimary: images.length === 0 && index === 0,
      }));

    onChange([...images, ...newItems]);
  };

  const removeImage = (id: string) => {
    if (!onChange) return;
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    onChange(filtered);
  };

  const setPrimary = (id: string) => {
    if (!onChange) return;
    onChange(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFileSelect(e.dataTransfer.files);
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-card-md border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-brand-blue bg-brand-blue-surface'
            : 'border-neutral-300 hover:border-brand-blue bg-neutral-50/50 hover:bg-neutral-50',
          disabled && 'opacity-60 cursor-not-allowed hover:border-neutral-300 hover:bg-neutral-50/50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={disabled || images.length >= maxFiles}
          className="sr-only"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="rounded-full bg-brand-blue/10 p-3 text-brand-blue mb-3">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-neutral-800">
          Click to upload or drag & drop images
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          PNG, JPG, or WebP (max {maxFiles} images)
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                'group relative aspect-square rounded-card-sm border overflow-hidden bg-neutral-100 flex items-center justify-center',
                img.isPrimary ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-neutral-200',
              )}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.name || 'Preview image'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-neutral-400" />
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-full bg-neutral-0/90 text-neutral-800 hover:bg-neutral-0',
                    img.isPrimary && 'text-amber-500',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimary(img.id);
                  }}
                  title={img.isPrimary ? 'Primary image' : 'Set as primary'}
                  aria-label={img.isPrimary ? 'Primary image' : 'Set as primary'}
                >
                  <Star className={cn('h-4 w-4', img.isPrimary && 'fill-amber-500')} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-neutral-0/90 text-state-error hover:bg-neutral-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {img.isPrimary && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-blue px-1.5 py-0.5 text-[10px] font-bold text-neutral-0">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
