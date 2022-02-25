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

# Temporarily set git credentials to those passed as --build-args to the docker build command
ARG GITUSER
ARG GITPASS
RUN git config --global credential.helper '!f() { sleep 1; echo "username='$GITUSER'"; echo "password='$GITPASS'"; }; f'

# Install build tools for Rust native modules
# (build tools for node-gyp C++ native modules are pre-installed)
RUN apt-get update
RUN apt-get install -y \
    build-essential \
    curl
RUN apt-get update
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install node_modules
RUN npm install -g --force yarn@latest
RUN yarn cache clean
RUN yarn set version berry
RUN yarn install

# Set git credential helper to cache to erase credentials
RUN git config --global credential.helper cache

# Define run command
CMD [ "node", "dist/index.js" ]
