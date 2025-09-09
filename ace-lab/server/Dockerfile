FROM node:18-alpine
WORKDIR /app
COPY ./package.json ./package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY ./server ./server
ENV PORT=4000 NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/index.mjs"]
