"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  acceptAppointment,
  createInfusion,
  createProduct,
  updateInfusion,
  updateProduct,
} from "@/actions/admin";
import { ImageUploader, type UploaderImage } from "@/components/admin/image-uploader";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminFormControl,
  adminFormLabel,
  adminFormTextarea,
} from "@/components/ui/form-styles";
import {
  PRODUCT_MAX_IMAGES,
  categories,
  type CatalogInfusion,
  type CatalogProduct,
} from "@/lib/catalog";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] tracking-[0.16em] text-deep/45 uppercase">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
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
  images: UploaderImage[],
  onError?: (message: string) => void,
) {
  if (images.some((image) => image.url.startsWith("data:") || image.url.startsWith("blob:"))) {
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

function productPayloadFromForm(data: FormData, images: UploaderImage[]) {
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
  const [images, setImages] = useState<UploaderImage[]>([]);

  return (
    <form
      className="grid gap-8"
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
        onChange={setImages}
        onError={onError}
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
  onChange,
  onError,
  onUploadingChange,
}: {
  product?: CatalogProduct;
  library: string[];
  images: UploaderImage[];
  onChange: (images: UploaderImage[]) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  return (
    <>
      <Section title="Media">
        <ImageUploader
          images={images}
          onChange={onChange}
          max={PRODUCT_MAX_IMAGES}
          library={library}
          onUploadingChange={onUploadingChange}
          onError={onError}
        />
      </Section>

      <Section title="Basics">
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
      </Section>

      <Section title="Price and stock">
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
      </Section>

      <Section title="Details">
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
      </Section>

      <Section title="Visibility">
        <div className="flex flex-wrap gap-4">
          <FeaturedField checked={product?.featured} />
          <ActiveField checked={product ? product.isActive !== false : true} />
        </div>
      </Section>
    </>
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
  const [images, setImages] = useState<UploaderImage[]>(product.images);

  return (
    <form
      className="grid gap-8"
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
        onChange={setImages}
        onError={onError}
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
  const [images, setImages] = useState<UploaderImage[]>([]);
  const [pending, start] = useTransition();
  const [pendingUpload, setPendingUpload] = useState(false);
  const image = images[0]?.url ?? "";

  return (
    <form
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (pendingUpload || image.startsWith("blob:") || image.startsWith("data:")) {
          onError?.("Wait for the picture to finish uploading before you save.");
          return;
        }
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          const result = await createInfusion(infusionPayload(data));
          if ("ok" in result) {
            form.reset();
            setImages([]);
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
        images={images}
        onChange={setImages}
        onError={onError}
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
  const [images, setImages] = useState<UploaderImage[]>(
    infusion.image ? [{ url: infusion.image, alt: infusion.name }] : [],
  );
  const [pending, start] = useTransition();
  const [pendingUpload, setPendingUpload] = useState(false);
  const image = images[0]?.url ?? "";

  return (
    <form
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (pendingUpload || image.startsWith("blob:") || image.startsWith("data:")) {
          onError?.("Wait for the picture to finish uploading before you save.");
          return;
        }
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
        images={images}
        onChange={setImages}
        onError={onError}
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
  images,
  onChange,
  onError,
  onUploadingChange,
}: {
  infusion?: CatalogInfusion;
  library: string[];
  images: UploaderImage[];
  onChange: (images: UploaderImage[]) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const image = images[0]?.url ?? "";

  return (
    <>
      <input type="hidden" name="image" value={image} />

      <Section title="Media">
        <ImageUploader
          images={images}
          onChange={onChange}
          max={1}
          library={library}
          onUploadingChange={onUploadingChange}
          onError={onError}
          emptyHint="Add a session picture for the booking page."
          altPlaceholder="Describe this session picture"
        />
      </Section>

      <Section title="Basics">
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
      </Section>

      <Section title="Price and timing">
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
      </Section>

      <Section title="Details">
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
      </Section>
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
