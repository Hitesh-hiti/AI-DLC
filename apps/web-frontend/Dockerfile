
# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Production environment configuration
ENV VITE_API_BASE_URL=/api
ENV VITE_USE_MOCK_API=false
ENV VITE_MOCK_POLICY=ALLOW

# Build Vite application
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
