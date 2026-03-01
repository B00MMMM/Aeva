# ---- Backend Dockerfile ----
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

RUN npm install --production

# Copy the rest of the source code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
