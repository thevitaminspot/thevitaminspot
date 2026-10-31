import { Suspense } from "react";
import { connection } from "next/server";

/** Marks a route as intentionally request-bound so metadata can stream with Cache Components. */
export function DynamicMarker() {
  return (
    <Suspense fallback={null}>
      <Connection />
    </Suspense>
  );
}

async function Connection() {
  await connection();
  return null;
}
