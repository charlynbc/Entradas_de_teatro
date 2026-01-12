FROM node:24.11.1-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY teatro-tickets-backend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código
COPY teatro-tickets-backend .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicación
CMD ["node", "index-v3-postgres.js"]
