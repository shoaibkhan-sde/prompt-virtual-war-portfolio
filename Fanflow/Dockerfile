FROM node:20-alpine AS build

WORKDIR /app

# Copy root package.json for workspace
COPY package*.json ./

# Copy subprojects
COPY client ./client
COPY server ./server

# Install dependencies and build
RUN npm run install:all
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package*.json ./server/

# Install only production dependencies for the server
RUN cd server && npm install --production

# Expose port and start
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/dist/index.js"]
