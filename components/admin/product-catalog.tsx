"use client";

import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/actions/admin";
import { AddProductForm, ProductEditor } from "@/components/admin/editors";
import type { CatalogProduct } from "@/lib/catalog";
function nairaLabel(kobo: number) {
  const amount = Math.round(kobo / 100).toString();
  return `₦${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function ProductCatalog({
  products,
  library,
}: {
  products: CatalogProduct[];
  library: string[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenId(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function remove(product: CatalogProduct) {
    setOpenId(null);
    if (!window.confirm(`Delete ${product.name}?`)) return;
    start(async () => {
      const result = await deleteProduct(product.id);
      setMessage("error" in result && result.error ? result.error : `${product.name} deleted.`);
      if ("ok" in result) {
        if (editingId === product.id) setEditingId(null);
        router.refresh();
      }
    });
  }

  const editing = products.find((product) => product.id === editingId);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-deep/60">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.12em] text-cream uppercase"
        >
          {adding ? "Close" : "Add product"}
        </button>
      </div>

      {adding ? (
        <div className="mt-4">
          <AddProductForm library={library} />
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-deep/70">{message}</p> : null}

      <ul className="mt-4 divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white">
        {products.map((product) => {
          const photo = product.images[0];
          const open = openId === product.id;
          return (
            <li
              key={product.id}
              className={`flex items-center gap-3 px-4 py-3 ${open ? "relative z-20" : ""}`}
            >
              {photo ? (
                <Image
                  src={photo.url}
                  alt=""
                  width={64}
                  height={64}
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="size-14 shrink-0 rounded-xl bg-tint" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-deep">{product.name}</p>
                <p className="mt-1 text-sm text-deep/55">
                  {nairaLabel(product.price)} · {product.stock} in stock
                  {product.featured ? " · Homepage" : ""}
                </p>
              </div>
              <div className="relative" ref={open ? menuRef : undefined}>
                <button
                  type="button"
                  aria-label={`Actions for ${product.name}`}
                  aria-expanded={open}
                  aria-haspopup="menu"
                  className="rounded-lg p-2 text-deep hover:bg-tint"
                  onClick={() => setOpenId(open ? null : product.id)}
                >
                  <MoreHorizontal className="size-5" />
                </button>
                {open ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-deep/10 bg-white py-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-white"
                      onClick={() => {
                        setEditingId(product.id);
                        setOpenId(null);
                      }}
                    >
                      Edit
                    </button>
                    <Link
                      role="menuitem"
                      href={`/shop/${product.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-white"
                      onClick={() => setOpenId(null)}
                    >
                      View on shop
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={pending}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-white disabled:opacity-40"
                      onClick={() => remove(product)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm text-deep/60">Editing {editing.name}</p>
            <button
              type="button"
              className="text-[11px] tracking-[0.16em] uppercase"
              onClick={() => setEditingId(null)}
            >
              Close
            </button>
          </div>
          <ProductEditor key={editing.id} product={editing} library={library} />
        </div>
      ) : null}
    </div>
  );
}
