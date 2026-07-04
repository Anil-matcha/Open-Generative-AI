import { NextResponse } from "next/server";

const API_BASE = "https://api.replicate.com/v1";

function getToken(request, body) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return body?.token?.trim();
}

export async function POST(request, context) {
  const body = await request.json().catch(() => null);
  const token = getToken(request, body);
  const params = await context.params;
  const id = params?.id;

  if (!token) {
    return NextResponse.json({ error: "Add a Replicate API token first." }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Prediction ID is required." }, { status: 400 });
  }

  const response = await fetch(`${API_BASE}/predictions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Replicate polling failed.", detail: data }, { status: response.status });
  }

  return NextResponse.json(data);
}
