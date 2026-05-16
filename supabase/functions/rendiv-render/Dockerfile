# Dockerfile for director-rendiv Supabase Edge Function
# Deployed on Render as a Docker web service

FROM denoland/deno:1.40

WORKDIR /app

# Copy function source files
COPY . .

# Expose the port Render expects
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "fetch('http://localhost:8080/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))" || exit 1

# Run the edge function
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "index.ts"]
