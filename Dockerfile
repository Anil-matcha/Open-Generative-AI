FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY . .
# The app builds from git submodules; fail early with a clear message if missing.
RUN for d in packages/Vibe-Workflow/packages/workflow-builder packages/Open-Poe-AI/packages/agents packages/Open-AI-Design-Agent/packages/design-agent; do \
      [ -f "$d/package.json" ] || { echo "ERROR: $d is missing. Submodules are not initialized. Run: git submodule update --init --recursive (or clone with --recurse-submodules), then rebuild." >&2; exit 1; }; \
    done
RUN npm install

# Build sub-packages
FROM deps AS builder
RUN npm run build:packages
RUN npm run build

# Production runner
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
