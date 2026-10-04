"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptAppointment,
  createInfusion,
  createProduct,
  deleteInfusion,
  deleteProduct,
  updateInfusion,
  updateProduct,
  uploadProductImage,
} from "@/actions/admin";
import { categories, type CatalogInfusion, type CatalogProduct } from "@/lib/catalog";

function naira(kobo: number) {
  return Math.round(kobo / 100);
}

const field =
  "w-full rounded-lg border border-deep/15 bg-white px-3 py-2 text-sm text-deep";

function CategoryField({ value }: { value?: string }) {
  return (
    <label className="text-sm text-deep">
      Category
      <select name="categorySlug" defaultValue={value ?? categories[0]?.slug} className={`${field} mt-1`}>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
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

export function AddProductForm({ library }: { library: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);

  function addImage(url: string) {
    if (!url || images.some((image) => image.url === url)) return;
    setImages((current) => [...current, { url, alt: "" }]);
  }

  return (
    <form
      className="grid gap-3 rounded-lg bg-white/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          const result = await createProduct({
            name: String(data.get("name") ?? ""),
            priceNaira: Number(data.get("price")),
            stock: Number(data.get("stock")),
            tagline: String(data.get("tagline") ?? ""),
            description: String(data.get("description") ?? ""),
            benefits: String(data.get("benefits") ?? ""),
            ingredients: String(data.get("ingredients") ?? ""),
            usage: String(data.get("usage") ?? ""),
            featured: data.get("featured") === "on",
            categorySlug: String(data.get("categorySlug") ?? ""),
            images,
          });
          setMessage("error" in result && result.error ? result.error : "Product added.");
          if ("ok" in result) {
            form.reset();
            setImages([]);
            router.refresh();
          }
        });
      }}
    >
      <input name="name" required placeholder="Name" aria-label="Name" className={field} />
      <input name="tagline" placeholder="Tagline" aria-label="Tagline" className={field} />
      <div className="grid gap-3 md:grid-cols-2">
        <input name="price" required type="number" min={1} placeholder="Price (₦)" aria-label="Price in naira" className={field} />
        <input name="stock" required type="number" min={0} placeholder="Stock" aria-label="Stock" className={field} />
      </div>
      <CategoryField />
      <FeaturedField />
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
      <PicturePicker images={images} library={library} onAdd={addImage} onChange={setImages} onUpload={start} onError={setMessage} />
      <button
        disabled={pending}
        className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase md:w-fit"
      >
        Add product
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}

const area =
  "min-h-24 w-full rounded-lg border border-deep/15 bg-white px-3 py-2 text-sm text-deep";

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
  return (
    <div>
      <p className="text-sm text-deep">Pictures</p>
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
              className="text-[11px] tracking-[0.14em] uppercase"
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
          className={field}
          onChange={(event) => {
            onAdd(event.target.value);
            event.target.value = "";
          }}
        >
          <option value="">Add a saved picture</option>
          {library.map((url) => (
            <option key={url} value={url}>
              {url.replace("/images/", "")}
            </option>
          ))}
        </select>
        <label className="rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase">
          Upload
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
              onUpload(async () => {
                const result = await uploadProductImage(body);
                if ("url" in result && result.url) onAdd(result.url);
                else onError("error" in result && result.error ? result.error : "Upload failed.");
              });
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function ProductEditor({
  product,
  library,
}: {
  product: CatalogProduct;
  library: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [images, setImages] = useState(product.images);

  function addImage(url: string) {
    if (!url || images.some((image) => image.url === url)) return;
    setImages((current) => [...current, { url, alt: product.name }]);
  }

  return (
    <form
      className="grid gap-3 rounded-lg bg-white/50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateProduct({
            id: product.id,
            name: String(data.get("name") ?? ""),
            priceNaira: Number(data.get("price")),
            stock: Number(data.get("stock")),
            tagline: String(data.get("tagline") ?? ""),
            description: String(data.get("description") ?? ""),
            benefits: String(data.get("benefits") ?? ""),
            ingredients: String(data.get("ingredients") ?? ""),
            usage: String(data.get("usage") ?? ""),
            featured: data.get("featured") === "on",
            categorySlug: String(data.get("categorySlug") ?? ""),
            images,
          });
          setMessage("error" in result && result.error ? result.error : "Saved.");
          if ("ok" in result) router.refresh();
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
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="price"
          required
          type="number"
          min={0}
          defaultValue={naira(product.price)}
          className={field}
          aria-label="Price in naira"
        />
        <input
          name="stock"
          required
          type="number"
          min={0}
          defaultValue={product.stock}
          className={field}
          aria-label="Stock"
        />
      </div>
      <CategoryField value={product.categorySlug} />
      <FeaturedField checked={product.featured} />
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
        onError={setMessage}
      />

      <div className="flex flex-wrap gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase"
        >
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.16em] uppercase"
          onClick={() => {
            start(async () => {
              const result = await deleteProduct(product.id);
              setMessage("error" in result && result.error ? result.error : "Deleted.");
              if ("ok" in result) router.refresh();
            });
          }}
        >
          Delete
        </button>
        {message ? <p className="self-center text-sm">{message}</p> : null}
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

export function AddInfusionForm({ library }: { library: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg bg-white/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const form = event.currentTarget;
        start(async () => {
          const result = await createInfusion(infusionPayload(data, image));
          setMessage("error" in result && result.error ? result.error : "Session added.");
          if ("ok" in result) {
            form.reset();
            setImage("");
            router.refresh();
          }
        });
      }}
    >
      <InfusionFields library={library} image={image} onImage={setImage} />
      <button
        disabled={pending}
        className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase md:w-fit"
      >
        Add session
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}

export function InfusionEditor({
  infusion,
  library,
}: {
  infusion: CatalogInfusion;
  library: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(infusion.image);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg bg-white/50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateInfusion({
            id: infusion.id,
            ...infusionPayload(data, image),
          });
          setMessage("error" in result && result.error ? result.error : "Saved.");
          if ("ok" in result) router.refresh();
        });
      }}
    >
      <InfusionFields infusion={infusion} library={library} image={image} onImage={setImage} />
      <div className="flex flex-wrap gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase"
        >
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-deep/20 px-4 py-2 text-[11px] tracking-[0.16em] uppercase"
          onClick={() => {
            if (!window.confirm(`Delete ${infusion.name}?`)) return;
            start(async () => {
              const result = await deleteInfusion(infusion.id);
              setMessage("error" in result && result.error ? result.error : "Deleted.");
              if ("ok" in result) router.refresh();
            });
          }}
        >
          Delete
        </button>
        {message ? <p className="self-center text-sm">{message}</p> : null}
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
      <label className="text-sm text-deep">
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
      </label>
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
      className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase disabled:opacity-40"
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
