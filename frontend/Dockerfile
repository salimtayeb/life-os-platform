FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN sed -i '/lightningcss-win32/d' package.json && npm install

COPY . .

RUN npm run build

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "out", "-l", "3000"]
