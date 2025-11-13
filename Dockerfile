# syntax=docker.io/docker/dockerfile:1

FROM node:lts-alpine AS dependencies

WORKDIR /mlb-app

COPY package*.json ./

RUN npm ci && npm cache clean --force


FROM node:lts-alpine AS builder

WORKDIR /mlb-app
COPY --from=dependencies /mlb-app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /mlb-app

# Create non-root user for security
RUN addgroup --system --gid 1001 mlb && \
adduser --system --uid 1001 roku

# Copy built application
COPY --from=builder --chown=roku:mlb /mlb-app/.next/standalone ./
COPY --from=builder --chown=roku:mlb /mlb-app/.next/static ./.next/static
COPY --from=builder --chown=roku:mlb /mlb-app/public ./public

# Switch to non-root user
USER roku

# Expose port for MLB app
EXPOSE 3000

# Start the MLB.TV application
CMD ["node", "server.js"]