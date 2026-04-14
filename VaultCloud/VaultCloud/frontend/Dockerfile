# ─── Stage 1: Build the React app ────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the production bundle (Vite outputs to /app/dist)
RUN npm run build

# ─── Stage 2: Serve with nginx ───────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
