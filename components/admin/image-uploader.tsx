"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadProductImage } from "@/actions/admin";
import {
  adminFormControl,
  adminFormLabel,
  interactiveControl,
} from "@/components/ui/form-styles";
import { adminNotifySuccess } from "@/lib/admin-toast";
import { prepareImageForUpload } from "@/lib/prepare-image-upload";
import { serverActionErrorMessage } from "@/lib/server-action-error";

export type UploaderImage = { url: string; alt: string };

type PendingTile = {
  id: string;
  previewUrl: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp";

function isLocalPreview(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

function TileImage({ url, alt }: { url: string; alt: string }) {
  if (isLocalPreview(url)) {
    return (
      // Local blob/data previews are not served through next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} className="aspect-[4/3] w-full rounded-lg object-cover" />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={240}
      height={180}
      className="aspect-[4/3] w-full rounded-lg object-cover"
    />
  );
}

export function ImageUploader({
  images,
  onChange,
  max,
  library = [],
  onUploadingChange,
  onError,
  emptyHint = "Add at least one picture for the shop listing.",
  altPlaceholder = "Describe this picture",
}: {
  images: UploaderImage[];
  onChange: (images: UploaderImage[]) => void;
  max: number;
  library?: string[];
  onUploadingChange?: (uploading: boolean) => void;
  onError?: (message: string) => void;
  emptyHint?: string;
  altPlaceholder?: string;
}) {
  const fileId = useId();
  const libraryId = useId();
  const imagesRef = useRef(images);
  const pendingRef = useRef<PendingTile[]>([]);
  imagesRef.current = images;

  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingTile[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const uploading = pending.length > 0;
  const atLimit = images.length + pending.length >= max;
  const canReplaceSingle = max === 1 && images.length === 1 && !uploading;
  const showDropZone = !atLimit || canReplaceSingle;
  const slotsLeft = Math.max(0, max - images.length - pending.length);

  function syncPending(next: PendingTile[]) {
    pendingRef.current = next;
    setPending(next);
    onUploadingChange?.(next.length > 0);
  }

  function reportError(message: string) {
    onError?.(message);
  }

  function addLibraryImage(url: string) {
    if (!url) return;
    if (imagesRef.current.some((image) => image.url === url)) {
      reportError("That picture is already added.");
      return;
    }
    if (max === 1) {
      const next = [{ url, alt: imagesRef.current[0]?.alt ?? "" }];
      imagesRef.current = next;
      onChange(next);
      return;
    }
    if (imagesRef.current.length >= max) {
      reportError(`Up to ${max} pictures.`);
      return;
    }
    const next = [...imagesRef.current, { url, alt: "" }];
    imagesRef.current = next;
    onChange(next);
  }

  function dropPending(tile: PendingTile) {
    URL.revokeObjectURL(tile.previewUrl);
    syncPending(pendingRef.current.filter((item) => item.id !== tile.id));
  }

  function commitUploaded(url: string, previewUrl: string) {
    const tile = pendingRef.current.find((item) => item.previewUrl === previewUrl);
    if (tile) {
      URL.revokeObjectURL(tile.previewUrl);
      syncPending(pendingRef.current.filter((item) => item.id !== tile.id));
    }

    const current = imagesRef.current;
    if (current.some((image) => image.url === url)) return;

    if (max === 1) {
      const next = [{ url, alt: current[0]?.alt ?? "" }];
      imagesRef.current = next;
      onChange(next);
      return;
    }

    if (current.length >= max) return;
    const next = [...current, { url, alt: "" }];
    imagesRef.current = next;
    onChange(next);
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(Boolean);
    if (!files.length) return;

    const replacing = max === 1 && imagesRef.current.length >= 1 && pendingRef.current.length === 0;
    const room = replacing
      ? 1
      : Math.max(0, max - imagesRef.current.length - pendingRef.current.length);
    if (room <= 0) {
      reportError(`Up to ${max} pictures.`);
      return;
    }

    const batch = max === 1 ? files.slice(0, 1) : files.slice(0, room);
    if (files.length > batch.length) {
      reportError(
        max === 1
          ? "Only one picture is kept for this session."
          : `Only ${batch.length} more picture${batch.length === 1 ? "" : "s"} can be added.`,
      );
    }

    const tiles: PendingTile[] = batch.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      previewUrl: URL.createObjectURL(file),
    }));

    syncPending(max === 1 ? tiles : [...pendingRef.current, ...tiles]);

    if (max === 1) {
      imagesRef.current = [];
      onChange([]);
    }

    let uploaded = 0;
    for (let index = 0; index < batch.length; index += 1) {
      const file = batch[index]!;
      const tile = tiles[index]!;

      try {
        const prepared = await prepareImageForUpload(file);
        const body = new FormData();
        body.set("file", prepared, prepared.name);
        const result = await uploadProductImage(body);

        if ("url" in result && result.url) {
          uploaded += 1;
          commitUploaded(result.url, tile.previewUrl);
        } else {
          reportError("error" in result && result.error ? result.error : "Upload failed.");
          dropPending(tile);
        }
      } catch (error) {
        reportError(serverActionErrorMessage(error, "Upload failed."));
        dropPending(tile);
      }
    }

    if (uploaded > 0) {
      adminNotifySuccess(
        uploaded === 1 ? "Picture uploaded." : `${uploaded} pictures uploaded.`,
      );
    }
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (showDropZone) setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!showDropZone) {
      reportError(`Up to ${max} pictures.`);
      return;
    }
    void handleFiles(event.dataTransfer.files);
  }

  function removeImage(index: number) {
    const next = images.filter((_, itemIndex) => itemIndex !== index);
    imagesRef.current = next;
    onChange(next);
  }

  function updateAlt(index: number, alt: string) {
    const next = images.map((item, itemIndex) =>
      itemIndex === index ? { ...item, alt } : item,
    );
    imagesRef.current = next;
    onChange(next);
  }

  return (
    <fieldset className="space-y-3">
      <legend className={adminFormLabel}>
        Media{" "}
        <span className="font-normal text-deep/45">
          ({images.length}/{max})
        </span>
      </legend>

      {images.length > 0 || pending.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const altName = `imageAlt-${index}`;
            return (
              <div key={`${image.url}-${index}`} className="space-y-2">
                <div className="relative overflow-hidden rounded-lg border border-deep/10 bg-cream/40">
                  <TileImage
                    url={image.url}
                    alt={image.alt || `Picture ${index + 1}`}
                  />
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 rounded bg-deep/85 px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-cream uppercase">
                      Primary
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remove picture ${index + 1}`}
                    className={`absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/95 text-deep/70 shadow-sm transition hover:text-deep ${interactiveControl}`}
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                  >
                    <X className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <input type="hidden" name={`imageUrl-${index}`} value={image.url} />
                </div>
                <label className="sr-only" htmlFor={altName}>
                  Alt text for picture {index + 1}
                </label>
                <input
                  id={altName}
                  name={altName}
                  value={image.alt}
                  onChange={(event) => updateAlt(index, event.target.value)}
                  placeholder={altPlaceholder}
                  className={adminFormControl}
                  disabled={uploading}
                />
              </div>
            );
          })}

          {pending.map((tile) => (
            <div key={tile.id} className="space-y-2">
              <div className="relative overflow-hidden rounded-lg border border-deep/10 bg-cream/40">
                <TileImage url={tile.previewUrl} alt="Uploading preview" />
                <div className="absolute inset-0 flex items-end bg-deep/25 p-2">
                  <div className="w-full space-y-1">
                    <div className="h-1 overflow-hidden rounded-full bg-white/40">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-cream" />
                    </div>
                    <p className="text-[10px] tracking-[0.14em] text-cream uppercase">
                      Uploading…
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-deep/50">{emptyHint}</p>
      )}

      {showDropZone ? (
        <label
          htmlFor={fileId}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition ${
            dragging
              ? "border-deep/45 bg-tint/80"
              : "border-deep/20 bg-cream/50 hover:border-deep/35 hover:bg-cream/80"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <ImagePlus className="size-5 text-deep/45" strokeWidth={1.5} />
          <span className="text-sm text-deep">
            {dragging
              ? canReplaceSingle
                ? "Drop to replace"
                : "Drop to upload"
              : canReplaceSingle
                ? "Drag a new picture here or browse to replace"
                : "Drag pictures here or browse"}
          </span>
          <span className="text-xs text-deep/45">
            JPG, PNG, or WebP
            {max > 1 ? ` · up to ${slotsLeft} more` : ""} · large photos compress automatically
          </span>
          <input
            id={fileId}
            name="uploadFile"
            type="file"
            accept={ACCEPT}
            multiple={max > 1}
            disabled={uploading || (atLimit && !canReplaceSingle)}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={(event) => {
              const files = event.target.files;
              event.target.value = "";
              if (files?.length) void handleFiles(files);
            }}
          />
        </label>
      ) : uploading ? null : (
        <p className="text-xs text-deep/55">Remove a picture to add another.</p>
      )}

      {library.length > 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            className={`text-[11px] tracking-[0.14em] text-deep/55 uppercase transition hover:text-deep ${interactiveControl}`}
            onClick={() => setLibraryOpen((open) => !open)}
            disabled={uploading || (atLimit && !canReplaceSingle)}
          >
            {libraryOpen ? "Hide library" : "Add from library"}
          </button>
          {libraryOpen ? (
            <div>
              <label htmlFor={libraryId} className="sr-only">
                Add a saved picture
              </label>
              <select
                id={libraryId}
                name="libraryImage"
                defaultValue=""
                disabled={uploading || (atLimit && !canReplaceSingle)}
                className={`${adminFormControl} disabled:cursor-not-allowed disabled:opacity-50`}
                onChange={(event) => {
                  addLibraryImage(event.target.value);
                  event.target.value = "";
                }}
              >
                <option value="">
                  {atLimit && !canReplaceSingle
                    ? "Maximum pictures added"
                    : canReplaceSingle
                      ? "Replace with a saved picture"
                      : "Choose a saved picture"}
                </option>
                {library.map((url) => (
                  <option key={url} value={url}>
                    {url.replace("/images/", "")}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
