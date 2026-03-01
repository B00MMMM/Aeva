# ---- Stage 1: Build the React app ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Build with empty VITE_API_URL so frontend uses relative /api paths
# (nginx will reverse-proxy /api to the backend container)
ENV VITE_API_URL=""

RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
