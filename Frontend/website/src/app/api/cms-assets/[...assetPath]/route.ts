import { NextResponse } from "next/server";

const DEFAULT_CMS_BASE_URL = "http://127.0.0.1:3000";

function getCmsBaseUrl(): string {
  const configured = process.env["CMS_BASE_URL"]?.trim();
  const baseUrl =
    configured && configured.length > 0 ? configured : DEFAULT_CMS_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

type RouteContext = {
  params: Promise<{
    assetPath?: string[];
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const resolved = await params;
  const segments = resolved.assetPath ?? [];

  if (segments.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ASSET_PATH",
          message: "Missing asset path",
        },
      },
      { status: 400 },
    );
  }

  const targetPath = segments.join("/");
  const targetUrl = `${getCmsBaseUrl()}/${targetPath}`;

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "*/*",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CMS_ASSET_UNAVAILABLE",
          message: "Could not reach CMS asset backend",
        },
      },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const cacheControl =
    upstream.headers.get("cache-control") ?? "public, max-age=60";
  const etag = upstream.headers.get("etag");
  const lastModified = upstream.headers.get("last-modified");
  const contentLength = upstream.headers.get("content-length");

  const headers = new Headers({
    "content-type": contentType,
    "cache-control": cacheControl,
  });

  if (etag) {
    headers.set("etag", etag);
  }

  if (lastModified) {
    headers.set("last-modified", lastModified);
  }

  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
