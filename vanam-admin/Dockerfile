# UltraCoreWood Admin (Vite + React) — production build, served by nginx

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
# Use `npm ci` if lockfile exists, otherwise fall back to `npm install`
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_BASE_PATH=/ultracorewood-admin
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Admin runs on port 5174 (different from storefront)
RUN echo 'server { \
    listen 5174; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5174
CMD ["nginx", "-g", "daemon off;"]
