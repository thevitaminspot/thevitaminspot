"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
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
  adminFormLabel,
  adminFormTextarea,
  interactiveControl,
} from "@/components/ui/form-styles";
import {
  estimateServerActionBytes,
  SERVER_ACTION_SOFT_LIMIT_BYTES,
  serverActionErrorMessage,
} from "@/lib/server-action-error";
import { prepareImageForUpload } from "@/lib/prepare-image-upload";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";

function naira(kobo: number) {
  return Math.round(kobo / 100);
}

const field = adminFormControl;
const area = adminFormTextarea;

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={adminFormLabel}>
        {label}
        {hint ? <span className="font-normal text-deep/40"> · {hint}</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function CategoryField({ value }: { value?: string }) {
  return (
    <input
      type="hidden"
      name="categorySlug"
      value={value ?? categories[0]?.slug ?? "daily-rituals"}
    />
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

function productPayloadFromForm(
  data: FormData,
  images: { url: string; alt: string }[],
) {
  return {
    name: String(data.get("name") ?? ""),
    priceNaira: Number(data.get("price")),
    compareAtPriceNaira: data.get("compareAtPrice")
      ? Number(data.get("compareAtPrice"))
      : undefined,
    stock: Number(data.get("stock")),
    tagline: String(data.get("tagline") ?? ""),
    description: String(data.get("description") ?? ""),
    benefits: String(data.get("benefits") ?? ""),
    ingredients: String(data.get("ingredients") ?? ""),
    usage: String(data.get("usage") ?? ""),
    featured: data.get("featured") === "on",
    isActive: data.get("active") === "on",
    categorySlug: String(data.get("categorySlug") ?? ""),
    images: images.map((image, index) => ({
      url: image.url,
      alt: String(data.get(`imageAlt-${index}`) ?? image.alt ?? ""),
    })),
  };
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
  const [pendingUpload, setPendingUpload] = useState(false);
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
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          if (!validateProductImagesForSave(images, onError)) return;
          const payload = productPayloadFromForm(data, images);
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
      <ProductFields
        library={library}
        images={images}
        onAdd={addImage}
        onChange={setImages}
        onError={onError}
        onUpload={(work) => {
          void work();
        }}
        onUploadingChange={setPendingUpload}
      />
      <button
        type="submit"
        disabled={pending || pendingUpload}
        className={`md:w-fit ${adminButtonPrimary}`}
      >
        {pending ? "Adding…" : pendingUpload ? "Uploading…" : "Add product"}
      </button>
    </form>
  );
}

function ProductFields({
  product,
  library,
  images,
  onAdd,
  onChange,
  onError,
  onUpload,
  onUploadingChange,
}: {
  product?: CatalogProduct;
  library: string[];
  images: { url: string; alt: string }[];
  onAdd: (url: string) => void;
  onChange: (images: { url: string; alt: string }[]) => void;
  onError?: (message: string) => void;
  onUpload?: (work: () => Promise<void>) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  return (
    <>
      <Field label="Product name" htmlFor="product-name">
        <input
          id="product-name"
          name="name"
          required
          defaultValue={product?.name}
          placeholder="e.g. Collagen Atelier"
          className={field}
        />
      </Field>
      <Field label="Tagline" htmlFor="product-tagline" hint="short line under the name">
        <input
          id="product-tagline"
          name="tagline"
          defaultValue={product?.tagline}
          placeholder="One short sentence"
          className={field}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price (₦)" htmlFor="product-price">
          <input
            id="product-price"
            name="price"
            required
            type="number"
            min={0}
            defaultValue={product ? naira(product.price) : undefined}
            placeholder="e.g. 40000"
            className={field}
          />
        </Field>
        <Field label="Compare-at price (₦)" htmlFor="product-compareAtPrice" hint="optional">
          <input
            id="product-compareAtPrice"
            name="compareAtPrice"
            type="number"
            min={0}
            defaultValue={product?.compareAtPrice ? naira(product.compareAtPrice) : ""}
            placeholder="Strike-through price"
            className={field}
          />
        </Field>
        <Field label="Stock" htmlFor="product-stock">
          <input
            id="product-stock"
            name="stock"
            required
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            placeholder="Units on hand"
            className={field}
          />
        </Field>
      </div>
      <CategoryField value={product?.categorySlug} />
      <div className="flex flex-wrap gap-4">
        <FeaturedField checked={product?.featured} />
        <ActiveField checked={product ? product.isActive !== false : true} />
      </div>
      <Field label="Description" htmlFor="product-description">
        <textarea
          id="product-description"
          name="description"
          defaultValue={product?.description}
          rows={4}
          className={area}
        />
      </Field>
      <Field label="Benefits" htmlFor="product-benefits" hint="one per line">
        <textarea
          id="product-benefits"
          name="benefits"
          defaultValue={product?.benefits.join("\n")}
          rows={4}
          className={area}
        />
      </Field>
      <Field label="Ingredients" htmlFor="product-ingredients" hint="one per line">
        <textarea
          id="product-ingredients"
          name="ingredients"
          defaultValue={product?.ingredients.join("\n")}
          rows={4}
          className={area}
        />
      </Field>
      <Field label="How to take it" htmlFor="product-usage">
        <textarea
          id="product-usage"
          name="usage"
          defaultValue={product?.usage}
          rows={3}
          className={area}
        />
      </Field>
      <PicturePicker
        images={images}
        library={library}
        onAdd={onAdd}
        onChange={onChange}
        onUpload={onUpload ?? ((work) => void work())}
        onUploadingChange={onUploadingChange}
        onError={(error) => onError?.(error)}
      />
    </>
  );
}

function PicturePicker({
  images,
  library,
  onAdd,
  onChange,
  onUpload,
  onUploadingChange,
  onError,
}: {
  images: { url: string; alt: string }[];
  library: string[];
  onAdd: (url: string) => void;
  onChange: (images: { url: string; alt: string }[]) => void;
  onUpload: (work: () => Promise<void>) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onError: (message: string) => void;
}) {
  const atLimit = images.length >= PRODUCT_MAX_IMAGES;
  const libraryId = useId();
  const fileId = useId();
  const [uploading, setUploading] = useState(false);

  function markUploading(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  return (
    <fieldset className="space-y-3">
      <legend className={adminFormLabel}>
        Pictures{" "}
        <span className="font-normal text-deep/45">
          ({images.length}/{PRODUCT_MAX_IMAGES})
        </span>
      </legend>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const altName = `imageAlt-${index}`;
            return (
              <div key={`${image.url}-${index}`} className="space-y-2">
                <Image
                  src={image.url}
                  alt={image.alt || `Product picture ${index + 1}`}
                  width={240}
                  height={180}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                <input type="hidden" name={`imageUrl-${index}`} value={image.url} />
                <label className="block text-[11px] tracking-[0.12em] text-deep/45 uppercase" htmlFor={altName}>
                  Alt text
                </label>
                <input
                  id={altName}
                  name={altName}
                  value={image.alt}
                  onChange={(event) =>
                    onChange(
                      images.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, alt: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Describe this picture"
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
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-deep/50">Add at least one picture for the shop listing.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={libraryId} className="sr-only">
            Add a saved picture
          </label>
          <select
            id={libraryId}
            name="libraryImage"
            defaultValue=""
            disabled={atLimit || uploading}
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
        </div>
        <label
          htmlFor={fileId}
          className={`relative inline-flex items-center rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase ${
            atLimit || uploading ? "cursor-not-allowed opacity-50" : interactiveControl
          }`}
        >
          {uploading ? "Uploading…" : "Upload picture"}
          <input
            id={fileId}
            name="uploadFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
            disabled={atLimit || uploading}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (atLimit) {
                onError(`Up to ${PRODUCT_MAX_IMAGES} pictures per product.`);
                return;
              }
              onUpload(async () => {
                markUploading(true);
                try {
                  const prepared = await prepareImageForUpload(file);
                  const body = new FormData();
                  body.set("file", prepared, prepared.name);
                  const result = await uploadProductImage(body);
                  if ("url" in result && result.url) {
                    onAdd(result.url);
                    adminNotifySuccess("Picture uploaded.");
                  } else {
                    onError("error" in result && result.error ? result.error : "Upload failed.");
                  }
                } catch (error) {
                  onError(serverActionErrorMessage(error, "Upload failed."));
                } finally {
                  markUploading(false);
                }
              });
            }}
          />
        </label>
      </div>
      {uploading ? (
        <p className="text-xs text-deep/55">Uploading picture…</p>
      ) : atLimit ? (
        <p className="text-xs text-deep/55">Remove a picture to add another.</p>
      ) : (
        <p className="text-xs text-deep/45">JPG, PNG, or WebP · large phone photos are compressed automatically.</p>
      )}
    </fieldset>
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
  const [pendingUpload, setPendingUpload] = useState(false);
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
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          if (!validateProductImagesForSave(images, onError)) return;
          const payload = {
            id: product.id,
            ...productPayloadFromForm(data, images),
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
      <ProductFields
        product={product}
        library={library}
        images={images}
        onAdd={addImage}
        onChange={setImages}
        onError={onError}
        onUpload={(work) => {
          void work();
        }}
        onUploadingChange={setPendingUpload}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || pendingUpload}
          className={adminButtonPrimary}
        >
          {pending ? "Saving…" : pendingUpload ? "Uploading…" : "Save changes"}
        </button>
        {onDelete ? (
          <button
            type="button"
            disabled={pending || pendingUpload}
            className={adminButtonDanger}
            onClick={onDelete}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

function infusionPayload(data: FormData) {
  return {
    name: String(data.get("name") ?? ""),
    tagline: String(data.get("tagline") ?? ""),
    description: String(data.get("description") ?? ""),
    benefits: String(data.get("benefits") ?? ""),
    ingredients: String(data.get("ingredients") ?? ""),
    priceNaira: Number(data.get("price")),
    depositNaira: Number(data.get("deposit")),
    durationMin: Number(data.get("duration")),
    image: String(data.get("image") ?? ""),
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
  const [pendingUpload, setPendingUpload] = useState(false);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          const result = await createInfusion(infusionPayload(data));
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
      <InfusionFields
        library={library}
        image={image}
        onImage={setImage}
        onUploadingChange={setPendingUpload}
      />
      <button
        type="submit"
        disabled={pending || pendingUpload}
        className={`md:w-fit ${adminButtonPrimary}`}
      >
        {pending ? "Adding…" : pendingUpload ? "Uploading…" : "Add session"}
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
  const [pendingUpload, setPendingUpload] = useState(false);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateInfusion({
            id: infusion.id,
            ...infusionPayload(data),
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
      <InfusionFields
        infusion={infusion}
        library={library}
        image={image}
        onImage={setImage}
        onUploadingChange={setPendingUpload}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || pendingUpload}
          className={adminButtonPrimary}
        >
          {pending ? "Saving…" : pendingUpload ? "Uploading…" : "Save changes"}
        </button>
        {onDelete ? (
          <button
            type="button"
            disabled={pending || pendingUpload}
            className={adminButtonDanger}
            onClick={onDelete}
          >
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
  onUploadingChange,
}: {
  infusion?: CatalogInfusion;
  library: string[];
  image: string;
  onImage: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const fileId = useId();
  const [uploading, setUploading] = useState(false);

  function markUploading(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  return (
    <>
      <input type="hidden" name="image" value={image} />
      <Field label="Session name" htmlFor="infusion-name">
        <input
          id="infusion-name"
          name="name"
          required
          defaultValue={infusion?.name}
          placeholder="e.g. Myers Cocktail"
          className={field}
        />
      </Field>
      <Field label="Tagline" htmlFor="infusion-tagline" hint="short line under the name">
        <input
          id="infusion-tagline"
          name="tagline"
          defaultValue={infusion?.tagline}
          placeholder="One short sentence"
          className={field}
        />
      </Field>
      <Field label="Description" htmlFor="infusion-description">
        <textarea
          id="infusion-description"
          name="description"
          defaultValue={infusion?.description}
          rows={4}
          className={area}
        />
      </Field>
      <Field label="What it does" htmlFor="infusion-benefits" hint="one per line">
        <textarea
          id="infusion-benefits"
          name="benefits"
          defaultValue={infusion?.benefits.join("\n")}
          rows={4}
          className={area}
        />
      </Field>
      <Field label="What’s in it" htmlFor="infusion-ingredients" hint="one per line">
        <textarea
          id="infusion-ingredients"
          name="ingredients"
          defaultValue={infusion?.ingredients.join("\n")}
          rows={4}
          className={area}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price (₦)" htmlFor="infusion-price">
          <input
            id="infusion-price"
            name="price"
            required
            type="number"
            min={0}
            defaultValue={infusion ? naira(infusion.price) : undefined}
            placeholder="Full price"
            className={field}
          />
        </Field>
        <Field label="Booking fee (₦)" htmlFor="infusion-deposit">
          <input
            id="infusion-deposit"
            name="deposit"
            required
            type="number"
            min={0}
            defaultValue={infusion ? naira(infusion.deposit) : undefined}
            placeholder="Deposit to hold the chair"
            className={field}
          />
        </Field>
        <Field label="Duration (minutes)" htmlFor="infusion-duration">
          <input
            id="infusion-duration"
            name="duration"
            required
            type="number"
            min={15}
            defaultValue={infusion?.durationMin}
            placeholder="e.g. 60"
            className={field}
          />
        </Field>
      </div>
      <Field label="Session picture" htmlFor="infusion-imageSelect">
        <select
          id="infusion-imageSelect"
          name="imageSelect"
          value={image}
          onChange={(event) => onImage(event.target.value)}
          className={field}
          disabled={uploading}
        >
          <option value="">Choose a picture</option>
          {image && !library.includes(image) ? <option value={image}>{image}</option> : null}
          {library.map((url) => (
            <option key={url} value={url}>
              {url.replace("/images/", "")}
            </option>
          ))}
        </select>
        <label
          htmlFor={fileId}
          className={`relative mt-2 inline-flex rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase ${
            uploading ? "cursor-not-allowed opacity-50" : interactiveControl
          }`}
        >
          {uploading ? "Uploading…" : "Upload picture"}
          <input
            id={fileId}
            name="uploadFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
            disabled={uploading}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              markUploading(true);
              void (async () => {
                try {
                  const prepared = await prepareImageForUpload(file);
                  const body = new FormData();
                  body.set("file", prepared, prepared.name);
                  const result = await uploadProductImage(body);
                  if ("url" in result && result.url) {
                    onImage(result.url);
                    adminNotifySuccess("Picture uploaded.");
                  } else if ("error" in result && result.error) {
                    adminNotifyError(result.error);
                  } else {
                    adminNotifyError("Upload failed.");
                  }
                } catch (error) {
                  adminNotifyError(serverActionErrorMessage(error, "Upload failed."));
                } finally {
                  markUploading(false);
                }
              })();
            }}
          />
        </label>
        <p className="mt-2 text-xs text-deep/45">
          JPG, PNG, or WebP · large phone photos are compressed automatically.
        </p>
      </Field>
      {image ? (
        <Image
          src={image}
          alt=""
          width={320}
          height={200}
          className="aspect-[8/5] w-48 rounded-lg object-cover"
        />
      ) : null}
    </>
  );
}

export function AcceptAppointmentButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
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
          if ("error" in result && result.error) {
            adminNotifyError(result.error);
            return;
          }
          adminNotifySuccess("Booking accepted.");
          router.refresh();
        });
      }}
    >
      {pending ? "Saving…" : "Accept"}
    </button>
  );
}
