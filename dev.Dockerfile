# NOTE: This Dockerfile compiles an image that uses Debian Stretch as its OS
#
# Build time is fast because the native modules used by Shardus
# (sodium-native, sqlite3) have precomiled binaries for Debian.
#
# However, the resulting image size is very large (~1.25GB).
#
# Useful for development, but don't ship it. Use 'prod.Dockerfile' instead.

# Node.js LTS 16.x.x from Docker Hub
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install node_modules
RUN npm set unsafe-perm true
RUN npm config set fetch-retries=0
RUN npm install

COPY node_modules/shardus-global-server node_modules/shardus-global-server

RUN npm run compile

# Define run command
CMD [ "node", "dist/index.js" ]
