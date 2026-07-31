FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/sap-simulator/package.json apps/sap-simulator/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN pnpm install --frozen-lockfile --filter @forjadata/sap-simulator...
COPY apps/sap-simulator apps/sap-simulator
COPY packages/contracts packages/contracts
COPY packages/domain packages/domain
RUN pnpm --filter @forjadata/sap-simulator build

FROM node:24-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
COPY --from=build /workspace /workspace
EXPOSE 7072
CMD ["node", "apps/sap-simulator/dist/server.js"]
