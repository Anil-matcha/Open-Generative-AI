# syntax=docker/dockerfile:1

# Stage 1: Base image
FROM node:24-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY packages/workflow-builder/package.json ./packages/workflow-builder/
RUN npm ci --include=dev

# Stage 3: Build shared package
FROM deps AS builder-lib
COPY packages/workflow-builder ./packages/workflow-builder
WORKDIR /app/packages/workflow-builder
RUN npm run build

# Stage 4: Build Next.js app
FROM deps AS builder
COPY --from=builder-lib /app/packages/workflow-builder/dist ./packages/workflow-builder/dist
COPY client ./client
ARG API_URL=http://server:8000
ENV API_URL=${API_URL}
WORKDIR /app/client
RUN npm run build

# Stage 5: Production runtime
FROM base AS production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder /app/client/public ./client/public
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "client/server.js"]
