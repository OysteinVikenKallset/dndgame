"use client";

import { useEffect } from "react";
import { AlertBlock } from "@/components/ui/AlertBlock";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container width="content" className="py-16 sm:py-20">
      <Card>
        <h1 className="text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 text-text-muted">
          The page could not be rendered right now. You can try again.
        </p>
        <div className="mt-5">
          <AlertBlock
            title="Rendering error"
            message={error.message || "Unknown error"}
            tone="danger"
          />
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover active:bg-primary-active"
          >
            Try again
          </button>
        </div>
      </Card>
    </Container>
  );
}
