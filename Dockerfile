FROM node:14-alpine

WORKDIR /opt/app

ENV PORT=80

# daemon for cron jobs
RUN echo 'crond' > /boot.sh

# Install app dependencies
COPY package*.json ./
RUN npm install

# Build CSS
COPY src/tailwind.sass ./src/tailwind.sass
RUN npm run build:tailwind

# Bundle app source
COPY . .

CMD sh /boot.sh && npm start
