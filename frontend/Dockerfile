FROM node:22-alpine

WORKDIR /app

RUN addgroup -S iua && adduser -S iua -G iua

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN chown -R iua:iua /app

USER iua

EXPOSE 3000
CMD ["npm", "run", "dev"]
