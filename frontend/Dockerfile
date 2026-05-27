FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN sed -i '/lightningcss-win32/d' package.json && npm install

COPY . .

RUN npm run build

EXPOSE 3000
ENV API_TARGET=http://backend:5000
CMD ["node", "server.js"]
