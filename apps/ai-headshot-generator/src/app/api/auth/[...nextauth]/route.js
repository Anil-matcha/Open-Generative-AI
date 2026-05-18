// Auth disabled
export async function GET() {
  return new Response("Auth disabled", { status: 404 });
}
