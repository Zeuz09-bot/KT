/**
 * ImageUploader — Admin image uploader component.
 *
 * Features:
 * - Drag & drop target with file picker (JPEG, PNG, WebP)
 * - Automatic browser-side processing (resizes to 1600px, converts to WebP, strips EXIF)
 * - Signed upload URL direct to Supabase Storage
 * - Alt text input for accessibility compliance
 * - Primary image designation
 */
'use client';

import * as React from 'react';
import {
  UploadCloud,
  X,
  Star,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processImageForUpload } from '@/modules/media/pipeline';
import { requestUploadUrlAction } from '@/modules/media/actions';

export interface UploadedImage {
  id: string;
  url: string;
  path?: string;
  name?: string;
  alt?: string;
  size?: number;
  width?: number;
  height?: number;
  isPrimary?: boolean;
  status?: 'idle' | 'processing' | 'uploading' | 'error';
  errorMessage?: string;
}

export interface ImageUploaderProps {
  images: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  productId?: string;
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
  const [activeEditingId, setActiveEditingId] = React.useState<string | null>(
    null,
  );
  const [editingAlt, setEditingAlt] = React.useState('');
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !onChange) return;
    setGlobalError(null);

    const remaining = maxFiles - images.length;
    if (remaining <= 0) return;

    const selectedFiles = Array.from(files).slice(0, remaining);
    const newItems: UploadedImage[] = selectedFiles.map((file, idx) => ({
      id: `pending-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      isPrimary: images.length === 0 && idx === 0,
      status: 'processing',
    }));

    // Optimistically update list
    let currentList = [...images, ...newItems];
    onChange(currentList);

    // Process each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const pendingItem = newItems[i];

      try {
        // Step 1: Client-side pipeline (resize, WebP, EXIF strip)
        const processed = await processImageForUpload(file);

        // Update item with status 'uploading'
        currentList = currentList.map((item) =>
          item.id === pendingItem.id
            ? {
                ...item,
                status: 'uploading' as const,
                width: processed.width,
                height: processed.height,
                size: processed.sizeBytes,
              }
            : item,
        );
        onChange(currentList);

        // Step 2: Request signed upload URL from server action
        const urlRes = await requestUploadUrlAction({
          fileName: processed.path,
          contentType: 'image/webp',
          sizeBytes: processed.sizeBytes,
        });

        if (!urlRes.ok) {
          throw new Error(urlRes.error.message);
        }

        const { uploadUrl, path, publicUrl } = urlRes.data;

        // Step 3: Direct PUT upload to Supabase Storage
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/webp',
          },
          body: processed.blob,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }

        // Step 4: Finalize item
        currentList = currentList.map((item) =>
          item.id === pendingItem.id
            ? {
                ...item,
                url: publicUrl,
                path,
                status: 'idle' as const,
              }
            : item,
        );
        onChange(currentList);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Processing failed';
        currentList = currentList.map((item) =>
          item.id === pendingItem.id
            ? {
                ...item,
                status: 'error' as const,
                errorMessage: errorMsg,
              }
            : item,
        );
        onChange(currentList);
      }
    }
  };

  const removeImage = (id: string) => {
    if (!onChange) return;
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    onChange(filtered);
    if (activeEditingId === id) setActiveEditingId(null);
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

  const startEditAlt = (img: UploadedImage) => {
    setActiveEditingId(img.id);
    setEditingAlt(img.alt || '');
  };

  const saveAlt = (id: string) => {
    if (!onChange) return;
    onChange(
      images.map((img) =>
        img.id === id ? { ...img, alt: editingAlt.trim() } : img,
      ),
    );
    setActiveEditingId(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {globalError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{globalError}</span>
        </div>
      )}

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
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-brand-blue bg-blue-50/50'
            : 'border-neutral-300 hover:border-brand-blue bg-neutral-50/50 hover:bg-neutral-50',
          disabled &&
            'opacity-60 cursor-not-allowed hover:border-neutral-300 hover:bg-neutral-50/50',
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
        <div className="rounded-full bg-accent-orange/10 p-3 text-accent-orange mb-3">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-text-primary">
          Click to upload or drag & drop product photos
        </p>
        <p className="text-xs text-text-muted mt-1">
          JPEG, PNG, or WebP · Max 8 MB · Resized to 1600px & WebP ≤ 250 KB
          (max {maxFiles} images)
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                'group relative aspect-square rounded-xl border overflow-hidden bg-neutral-100 flex flex-col items-center justify-center',
                img.isPrimary
                  ? 'border-brand-blue ring-2 ring-brand-blue/20'
                  : 'border-border-default',
              )}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.alt || img.name || 'Preview image'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-neutral-400" />
              )}

              {/* Status Overlay */}
              {img.status && img.status !== 'idle' && (
                <div className="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center p-2 text-center text-white text-xs">
                  {img.status === 'processing' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-accent-orange" />
                      <span>Optimizing...</span>
                    </>
                  )}
                  {img.status === 'uploading' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-400" />
                      <span>Uploading WebP...</span>
                    </>
                  )}
                  {img.status === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 mb-1 text-red-400" />
                      <span className="text-[10px] text-red-200">
                        {img.errorMessage || 'Error'}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Overlay controls */}
              {img.status !== 'processing' && img.status !== 'uploading' && (
                <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-full bg-white/90 text-neutral-800 hover:bg-white',
                      img.isPrimary && 'text-amber-500',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(img.id);
                    }}
                    title={img.isPrimary ? 'Primary image' : 'Set as primary'}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        img.isPrimary && 'fill-amber-500',
                      )}
                    />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/90 text-neutral-700 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditAlt(img);
                    }}
                    title="Edit Alt Text"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/90 text-red-600 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Primary Badge */}
              {img.isPrimary && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-blue px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alt Text Edit Modal / Field */}
      {activeEditingId && (
        <div className="p-3 bg-neutral-50 border border-border-default rounded-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              Image Alt Text (Required for accessibility & SEO)
            </span>
            <button
              type="button"
              onClick={() => setActiveEditingId(null)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="imageAltInput"
                placeholder="e.g. iPhone 16 Pro Max Natural Titanium back view"
                value={editingAlt}
                onChange={(e) => setEditingAlt(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => saveAlt(activeEditingId)}
              disabled={editingAlt.trim().length < 3}
            >
              Save Alt Text
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
