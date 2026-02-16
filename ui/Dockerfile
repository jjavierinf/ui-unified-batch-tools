FROM node:20-alpine AS deps
WORKDIR /app
COPY ui/package.json ui/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=1
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache git bash && \
    git config --global user.email "docker@localhost" && \
    git config --global user.name "Docker" && \
    git config --global init.defaultBranch main

COPY scripts/setup-test-repo.sh /app/setup-test-repo.sh
RUN chmod +x /app/setup-test-repo.sh

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["sh", "-c", "bash /app/setup-test-repo.sh && node server.js"]
