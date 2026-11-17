FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps || npm install --legacy-peer-deps; else npm install --legacy-peer-deps; fi

COPY . .

ARG VITE_API_URL=/
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/client /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
