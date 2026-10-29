"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptAppointment,
  createInfusion,
  createProduct,
  updateInfusion,
  updateProduct,
  uploadProductImage,
} from "@/actions/admin";
import {
  PRODUCT_MAX_IMAGES,
  categories,
  type CatalogInfusion,
  type CatalogProduct,
} from "@/lib/catalog";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminFormControl,
  adminFormTextarea,
  interactiveControl,
} from "@/components/ui/form-styles";
import {
  estimateServerActionBytes,
  SERVER_ACTION_SOFT_LIMIT_BYTES,
  serverActionErrorMessage,
} from "@/lib/server-action-error";

function naira(kobo: number) {
  return Math.round(kobo / 100);
}

const field = adminFormControl;
const area = adminFormTextarea;

function CategoryField({ value }: { value?: string }) {
  // Categories are no longer shown in the shop; keep a stable default for the DB row.
  return (
    <input type="hidden" name="categorySlug" value={value ?? categories[0]?.slug ?? "daily-rituals"} />
  );
}

function FeaturedField({ checked }: { checked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-deep">
      <input type="checkbox" name="featured" defaultChecked={checked} />
      Show on the homepage
    </label>
  );
}

function ActiveField({ checked = true }: { checked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-deep">
      <input type="checkbox" name="active" defaultChecked={checked} />
      For sale
    </label>
  );
}

type FormCallbacks = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

async function runServerAction<T>(
  work: () => Promise<T>,
  onError?: (message: string) => void,
): Promise<T | undefined> {
  try {
    return await work();
  } catch (error) {
    onError?.(serverActionErrorMessage(error));
    return undefined;
  }
}

function validateProductImagesForSave(
  images: { url: string; alt: string }[],
  onError?: (message: string) => void,
) {
  if (images.some((image) => image.url.startsWith("data:"))) {
    onError?.("Wait for pictures to finish uploading before you save.");
    return false;
  }
  return true;
}

function validateProductPayloadSize(payload: unknown, onError?: (message: string) => void) {
  if (estimateServerActionBytes(payload) > SERVER_ACTION_SOFT_LIMIT_BYTES) {
    onError?.("This product is too large to save. Use fewer or smaller pictures.");
    return false;
  }
  return true;
}

export function AddProductForm({
  library,
  onSuccess,
  onError,
}: {
  library: string[];
} & FormCallbacks) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);

  function addImage(url: string) {
    if (!url || images.some((image) => image.url === url)) return;
    if (images.length >= PRODUCT_MAX_IMAGES) {
      onError?.(`Up to ${PRODUCT_MAX_IMAGES} pictures per product.`);
      return;
    }
    setImages((current) => [...current, { url, alt: "" }]);
  }

  return (
    <form
      className="grid gap-5 rounded-lg bg-white/60 p-1 sm:p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          if (!validateProductImagesForSave(images, onError)) return;
          const payload = {
            name: String(data.get("name") ?? ""),
            priceNaira: Number(data.get("price")),
            compareAtPriceNaira: data.get("compareAtPrice") ? Number(data.get("compareAtPrice")) : undefined,
            stock: Number(data.get("stock")),
            tagline: String(data.get("tagline") ?? ""),
            description: String(data.get("description") ?? ""),
            benefits: String(data.get("benefits") ?? ""),
            ingredients: String(data.get("ingredients") ?? ""),
            usage: String(data.get("usage") ?? ""),
            featured: data.get("featured") === "on",
            isActive: data.get("active") === "on",
            categorySlug: String(data.get("categorySlug") ?? ""),
            images,
          };
          if (!validateProductPayloadSize(payload, onError)) return;
          const result = await runServerAction(() => createProduct(payload), onError);
          if (!result) return;
          if ("ok" in result) {
            form.reset();
            setImages([]);
            router.refresh();
            onSuccess?.();
          } else {
            onError?.(result.error || "Could not add product.");
          }
        });
      }}
    >
      <input name="name" required placeholder="Name" aria-label="Name" className={field} />
      <input name="tagline" placeholder="Tagline" aria-label="Tagline" className={field} />
      <div className="grid gap-3 md:grid-cols-3">
        <input name="price" required type="number" min={1} placeholder="Price (₦)" aria-label="Price in naira" className={field} />
        <input name="compareAtPrice" type="number" min={0} placeholder="Compare-at Price (₦) optional" aria-label="Original price" className={field} />
        <input name="stock" required type="number" min={0} placeholder="Stock quantity" aria-label="Stock" className={field} />
      </div>
      <CategoryField />
      <div className="flex flex-wrap gap-4">
        <FeaturedField />
        <ActiveField />
      </div>
      <label className="text-sm text-deep">
        Description
        <textarea name="description" className={`${area} mt-1`} />
      </label>
      <label className="text-sm text-deep">
        Benefits, one per line
        <textarea name="benefits" className={`${area} mt-1`} />
      </label>
      <label className="text-sm text-deep">
        Ingredients, one per line
        <textarea name="ingredients" className={`${area} mt-1`} />
      </label>
      <label className="text-sm text-deep">
        How to take it
        <textarea name="usage" className={`${area} mt-1`} />
      </label>
      <PicturePicker
        images={images}
        library={library}
        onAdd={addImage}
        onChange={setImages}
        onUpload={start}
        onError={(error) => onError?.(error)}
      />
      <button disabled={pending} className={`md:w-fit ${adminButtonPrimary}`}>
        {pending ? "Adding…" : "Add product"}
      </button>
    </form>
  );
}

function PicturePicker({
  images,
  library,
  onAdd,
  onChange,
  onUpload,
  onError,
}: {
  images: { url: string; alt: string }[];
  library: string[];
  onAdd: (url: string) => void;
  onChange: (images: { url: string; alt: string }[]) => void;
  onUpload: (work: () => Promise<void>) => void;
  onError: (message: string) => void;
}) {
  const atLimit = images.length >= PRODUCT_MAX_IMAGES;

  return (
    <div>
      <p className="text-sm text-deep">
        Pictures{" "}
        <span className="text-deep/50">
          ({images.length}/{PRODUCT_MAX_IMAGES})
        </span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="space-y-2">
            <Image
              src={image.url}
              alt={image.alt}
              width={240}
              height={180}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            <input
              value={image.alt}
              aria-label="Picture description"
              onChange={(event) =>
                onChange(
                  images.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, alt: event.target.value } : item,
                  ),
                )
              }
              className={field}
            />
            <button
              type="button"
              className={`text-[11px] tracking-[0.14em] uppercase ${interactiveControl}`}
              onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          aria-label="Add a picture from the library"
          defaultValue=""
          disabled={atLimit}
          className={`${field} disabled:cursor-not-allowed disabled:opacity-50`}
          onChange={(event) => {
            onAdd(event.target.value);
            event.target.value = "";
          }}
        >
          <option value="">
            {atLimit ? "Maximum pictures added" : "Add a saved picture"}
          </option>
          {library.map((url) => (
            <option key={url} value={url}>
              {url.replace("/images/", "")}
            </option>
          ))}
        </select>
        <label
          className={`rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase ${
            atLimit ? "cursor-not-allowed opacity-50" : interactiveControl
          }`}
        >
          Upload picture
          <input
            type="file"
            accept="image/*"
            disabled={atLimit}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (atLimit) {
                onError(`Up to ${PRODUCT_MAX_IMAGES} pictures per product.`);
                return;
              }
              const body = new FormData();
              body.set("file", file);
              onUpload(async () => {
                try {
                  const result = await uploadProductImage(body);
                  if ("url" in result && result.url) onAdd(result.url);
                  else onError("error" in result && result.error ? result.error : "Upload failed.");
                } catch (error) {
                  onError(serverActionErrorMessage(error, "Upload failed."));
                }
              });
            }}
          />
        </label>
      </div>
      {atLimit ? (
        <p className="mt-2 text-xs text-deep/55">Remove a picture to add another.</p>
      ) : null}
    </div>
  );
}

export function ProductEditor({
  product,
  library,
  onSuccess,
  onError,
  onDelete,
}: {
  product: CatalogProduct;
  library: string[];
} & FormCallbacks & {
    onDelete?: () => void;
  }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [images, setImages] = useState(product.images);

  function addImage(url: string) {
    if (!url || images.some((image) => image.url === url)) return;
    if (images.length >= PRODUCT_MAX_IMAGES) {
      onError?.(`Up to ${PRODUCT_MAX_IMAGES} pictures per product.`);
      return;
    }
    setImages((current) => [...current, { url, alt: product.name }]);
  }

  return (
    <form
      className="grid gap-5 rounded-lg bg-white/50 p-1 sm:p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          if (!validateProductImagesForSave(images, onError)) return;
          const payload = {
            id: product.id,
            name: String(data.get("name") ?? ""),
            priceNaira: Number(data.get("price")),
            compareAtPriceNaira: data.get("compareAtPrice") ? Number(data.get("compareAtPrice")) : undefined,
            stock: Number(data.get("stock")),
            tagline: String(data.get("tagline") ?? ""),
            description: String(data.get("description") ?? ""),
            benefits: String(data.get("benefits") ?? ""),
            ingredients: String(data.get("ingredients") ?? ""),
            usage: String(data.get("usage") ?? ""),
            featured: data.get("featured") === "on",
            isActive: data.get("active") === "on",
            categorySlug: String(data.get("categorySlug") ?? ""),
            images,
          };
          if (!validateProductPayloadSize(payload, onError)) return;
          const result = await runServerAction(() => updateProduct(payload), onError);
          if (!result) return;
          if ("ok" in result) {
            router.refresh();
            onSuccess?.();
          } else {
            onError?.(result.error || "Could not save.");
          }
        });
      }}
    >
      <p className="text-[11px] tracking-[0.18em] text-sage uppercase">Shop listing</p>
      <input name="name" required defaultValue={product.name} aria-label="Name" className={field} />
      <input
        name="tagline"
        defaultValue={product.tagline}
        aria-label="Tagline"
        placeholder="Tagline"
        className={field}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-deep/60">
            Price in Naira (₦)
          </label>
          <input
            name="price"
            required
            type="number"
            min={0}
            defaultValue={naira(product.price)}
            className={`${field} mt-1`}
            aria-label="Price in naira"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-deep/60">
            Compare-at / Strike Price (₦)
          </label>
          <input
            name="compareAtPrice"
            type="number"
            min={0}
            defaultValue={product.compareAtPrice ? naira(product.compareAtPrice) : ""}
            placeholder="e.g. 50000 (optional)"
            className={`${field} mt-1`}
            aria-label="Compare-at price in naira"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-deep/60">
            Current Stock Level
          </label>
          <input
            name="stock"
            required
            type="number"
            min={0}
            defaultValue={product.stock}
            className={`${field} mt-1`}
            aria-label="Stock"
          />
        </div>
      </div>
      <CategoryField value={product.categorySlug} />
      <div className="flex flex-wrap gap-4">
        <FeaturedField checked={product.featured} />
        <ActiveField checked={product.isActive !== false} />
      </div>
      <label className="text-sm text-deep">
        Description
        <textarea
          name="description"
          defaultValue={product.description}
          className={`${area} mt-1`}
        />
      </label>
      <label className="text-sm text-deep">
        Benefits, one per line
        <textarea
          name="benefits"
          defaultValue={product.benefits.join("\n")}
          className={`${area} mt-1`}
        />
      </label>
      <label className="text-sm text-deep">
        Ingredients, one per line
        <textarea
          name="ingredients"
          defaultValue={product.ingredients.join("\n")}
          className={`${area} mt-1`}
        />
      </label>
      <label className="text-sm text-deep">
        Usage
        <textarea name="usage" defaultValue={product.usage} className={`${area} mt-1`} />
      </label>

      <PicturePicker
        images={images}
        library={library}
        onAdd={addImage}
        onChange={setImages}
        onUpload={(work) => start(async () => work())}
        onError={(error) => onError?.(error)}
      />

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className={adminButtonPrimary}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {onDelete ? (
          <button type="button" disabled={pending} className={adminButtonDanger} onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

function infusionPayload(data: FormData, image: string) {
  return {
    name: String(data.get("name") ?? ""),
    tagline: String(data.get("tagline") ?? ""),
    description: String(data.get("description") ?? ""),
    benefits: String(data.get("benefits") ?? ""),
    ingredients: String(data.get("ingredients") ?? ""),
    priceNaira: Number(data.get("price")),
    depositNaira: Number(data.get("deposit")),
    durationMin: Number(data.get("duration")),
    image,
  };
}

export function AddInfusionForm({
  library,
  onSuccess,
  onError,
}: {
  library: string[];
} & FormCallbacks) {
  const router = useRouter();
  const [image, setImage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-5 rounded-lg bg-white/60 p-1 sm:p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          const result = await createInfusion(infusionPayload(data, image));
          if ("ok" in result) {
            form.reset();
            setImage("");
            router.refresh();
            onSuccess?.();
          } else {
            onError?.(result.error || "Could not add session.");
          }
        });
      }}
    >
      <InfusionFields library={library} image={image} onImage={setImage} />
      <button disabled={pending} className={`md:w-fit ${adminButtonPrimary}`}>
        {pending ? "Adding…" : "Add session"}
      </button>
    </form>
  );
}

export function InfusionEditor({
  infusion,
  library,
  onSuccess,
  onError,
  onDelete,
}: {
  infusion: CatalogInfusion;
  library: string[];
} & FormCallbacks & {
    onDelete?: () => void;
  }) {
  const router = useRouter();
  const [image, setImage] = useState(infusion.image);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-5 rounded-lg bg-white/50 p-1 sm:p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateInfusion({
            id: infusion.id,
            ...infusionPayload(data, image),
          });
          if ("ok" in result) {
            router.refresh();
            onSuccess?.();
          } else {
            onError?.(result.error || "Could not save.");
          }
        });
      }}
    >
      <InfusionFields infusion={infusion} library={library} image={image} onImage={setImage} />
      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className={adminButtonPrimary}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {onDelete ? (
          <button type="button" disabled={pending} className={adminButtonDanger} onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

function InfusionFields({
  infusion,
  library,
  image,
  onImage,
}: {
  infusion?: CatalogInfusion;
  library: string[];
  image: string;
  onImage: (url: string) => void;
}) {
  return (
    <>
      <input
        name="name"
        required
        defaultValue={infusion?.name}
        placeholder="Name"
        aria-label="Name"
        className={field}
      />
      <input
        name="tagline"
        defaultValue={infusion?.tagline}
        placeholder="Tagline"
        aria-label="Tagline"
        className={field}
      />
      <label className="text-sm text-deep">
        Description
        <textarea name="description" defaultValue={infusion?.description} className={`${area} mt-1`} />
      </label>
      <label className="text-sm text-deep">
        What it does, one per line
        <textarea
          name="benefits"
          defaultValue={infusion?.benefits.join("\n")}
          className={`${area} mt-1`}
        />
      </label>
      <label className="text-sm text-deep">
        What’s in it, one per line
        <textarea
          name="ingredients"
          defaultValue={infusion?.ingredients.join("\n")}
          className={`${area} mt-1`}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="price"
          required
          type="number"
          min={0}
          defaultValue={infusion ? naira(infusion.price) : undefined}
          placeholder="Price (₦)"
          aria-label="Price in naira"
          className={field}
        />
        <input
          name="deposit"
          required
          type="number"
          min={0}
          defaultValue={infusion ? naira(infusion.deposit) : undefined}
          placeholder="Deposit (₦)"
          aria-label="Deposit in naira"
          className={field}
        />
        <input
          name="duration"
          required
          type="number"
          min={15}
          defaultValue={infusion?.durationMin}
          placeholder="Minutes"
          aria-label="Duration in minutes"
          className={field}
        />
      </div>
      <div className="text-sm text-deep">
        Picture
        <select
          aria-label="Session picture"
          value={image}
          onChange={(event) => onImage(event.target.value)}
          className={`${field} mt-1`}
        >
          <option value="">Choose a picture</option>
          {image && !library.includes(image) ? <option value={image}>{image}</option> : null}
          {library.map((url) => (
            <option key={url} value={url}>
              {url.replace("/images/", "")}
            </option>
          ))}
        </select>
        <label className="mt-2 inline-flex rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase">
          Upload picture
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const body = new FormData();
              body.set("file", file);
              void uploadProductImage(body).then((result) => {
                if ("url" in result && result.url) onImage(result.url);
              });
            }}
          />
        </label>
      </div>
      {image ? (
        <Image src={image} alt="" width={320} height={200} className="aspect-[8/5] w-48 rounded-lg object-cover" />
      ) : null}
    </>
  );
}

export function AcceptAppointmentButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  if (status === "CONFIRMED") return <span className="text-sage">Accepted</span>;

  return (
    <button
      type="button"
      disabled={pending || status === "CANCELLED"}
      className={`${adminButtonPrimary} disabled:opacity-40`}
      onClick={() => {
        start(async () => {
          const result = await acceptAppointment(id);
          setMessage("error" in result && result.error ? result.error : "Accepted.");
          if ("ok" in result) router.refresh();
        });
      }}
    >
      {message || "Accept"}
    </button>
  );
}
