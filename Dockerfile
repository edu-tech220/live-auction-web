# syntax=docker/dockerfile:1
# 1) Build con Node: la URL de la API se "hornea" en el bundle en tiempo de build (Vite).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:5080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# 2) Solo los archivos estáticos servidos por Nginx (imagen final pequeña, sin Node).
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
