FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

# Add --unhandled-rejections=strict so ALL errors show in logs
CMD ["node", "--unhandled-rejections=strict", "src/app.js"]