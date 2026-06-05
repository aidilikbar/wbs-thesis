FROM node:22-bookworm-slim

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
