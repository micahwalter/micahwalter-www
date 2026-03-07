import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmHandler from "./ConfirmHandler";

export const metadata: Metadata = {
  title: "Confirming subscription…",
};

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-reading mx-auto px-6 py-12">
          <p className="text-gray text-lg italic">Confirming your subscription…</p>
        </div>
      }
    >
      <ConfirmHandler />
    </Suspense>
  );
}
