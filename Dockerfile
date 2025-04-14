# Build stage
FROM node:18.19.1 AS builder

WORKDIR /usr/src/app

RUN apt update && apt install -y build-essential \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.74.1
ENV PATH="/root/.cargo/bin:${PATH}"

COPY . .
RUN npm ci

# Production stage
FROM node:18.19.1-slim

WORKDIR /usr/src/app

RUN chown -R node:node /usr/src/app \
    && chmod 2775 -R /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/config.json ./config.json
COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json
COPY --from=builder --chown=node:node /usr/src/app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /usr/src/app/src/config ./genesis_files
COPY --from=builder --chown=node:node /usr/src/app/environments ./environments

USER node

CMD [ "node", "dist/src/index.js" ]
