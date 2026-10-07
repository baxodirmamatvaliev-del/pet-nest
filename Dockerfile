FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT_API=3002

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nestjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
	&& npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

RUN mkdir -p uploads \
	&& chown nestjs:nodejs uploads

USER nestjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:${PORT_API:-3002}/health > /dev/null || exit 1

CMD ["node", "dist/apps/pat-nest-api/main.js"]
