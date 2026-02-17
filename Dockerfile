FROM oven/bun:1 AS base

COPY package.json .

COPY bun.lock .

RUN bun install

COPY . .

EXPOSE 3344

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
