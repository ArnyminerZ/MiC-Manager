FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=12s --start-period=30s CMD node healthcheck.js

RUN chmod +x ./scripts/wait-for-firefly.sh
RUN chmod +x ./scripts/wait-for-radicale.sh

CMD [ "./scripts/wait-for-firefly.sh", "./scripts/wait-for-radicale.sh", "node", "index.js" ]
