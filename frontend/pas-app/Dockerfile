# Stage 1: Build Angular clinical portal
FROM node:20-alpine AS build
WORKDIR /app
COPY pas-app/package*.json ./
RUN npm install
COPY pas-app/ ./
RUN npm run build -- --configuration=production

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist/pas-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
