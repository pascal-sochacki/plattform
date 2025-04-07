import { NextRequest, NextResponse } from "next/server";

interface Params {
  slug: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return await proxyRequest(request, params);
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ slug: string[] }>,
): Promise<NextResponse> {
  const { slug } = await params; // Directly access slug from params.
  console.log(slug);
  const targetUrl = getTargetUrl(slug);

  console.log(targetUrl);

  if (!targetUrl) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  try {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("host");

    const targetRes = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
      redirect: "manual",
    });

    const body = await targetRes.json();

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}

function getTargetUrl(slug: string[]): string | null {
  const slugString = slug.join("/");

  if (slugString.startsWith("tempo")) {
    return `${process.env.TEMPO_URL || "http://localhost:3200"}/${slugString.replace(/^tempo\/?/, "")}`;
  }

  if (slugString.startsWith("prometheus")) {
    return `${process.env.PROMETHEUS_URL || "http://localhost:9090"}/${slugString.replace(/^prometheus\/?/, "")}`;
  }

  return null;
}
