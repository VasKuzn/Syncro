FROM node:23.8.0-alpine AS build

ARG VITE_API_URL
ARG VITE_ENVIRONMENT
ARG VITE_USE_HTTPS
ARG VITE_WS_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_ENVIRONMENT=$VITE_ENVIRONMENT \
    VITE_USE_HTTPS=$VITE_USE_HTTPS \
    VITE_WS_URL=$VITE_WS_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build:prod

# Frontend serve stage with Nginx
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]