# ==========================================
# Trinnity Viseron System v1.0 - Dockerfile
# ==========================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json tsconfig.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar proyecto TypeScript
RUN npm run build || npx tsc

# Stage de Producción
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ANTIGRAVITY.md ./

# Exponer puerto para API / Socket.IO
EXPOSE 3000

CMD ["node", "dist/src/index.js"]
