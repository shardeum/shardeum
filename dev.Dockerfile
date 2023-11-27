# NOTE: This Dockerfile compiles an image that uses Debian Stretch as its OS
#
# Build time is fast because the native modules used by our app
# (sodium-native, sqlite3) have precomiled binaries for Debian.
#
# However, the resulting image size is very large (~1.25GB).
#
# Useful for development, but don't ship it. Use 'Dockerfile' instead.

# Node.js LTS 12.x.x from Docker Hub
FROM node:18.16.1

# Create app directory
WORKDIR /usr/src/app
RUN mkdir shardeum
RUN mkdir core
WORKDIR /usr/src/app/shardeum

# Bundle app source
COPY . .

# Install Rust build chain for modules
RUN apt-get update
RUN apt-get install -y \
    build-essential \
    curl
RUN apt-get update
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install node_modules
RUN rm -rf shardus-global-server/
RUN npm ci --ignore-scripts

WORKDIR /usr/src/app/core/
COPY ./shardus-global-server .
RUN npm ci
RUN npm run build:dev
RUN npm link

WORKDIR /usr/src/app/shardeum/
RUN npm ci --ignore-scripts
RUN npm link @shardus/core
RUN npm run compile

# Define run command
CMD [ "node", "dist/src/index.js" ]