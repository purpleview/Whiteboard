FROM node:18 AS base

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create app directory and set ownership
RUN mkdir -p /opt/app && chown -R appuser:appuser /opt/app
WORKDIR /opt/app

# Switch to non-root user
USER appuser

# Install app dependencies
COPY --chown=appuser:appuser ./package.json package-lock.json ./
RUN npm ci

# Bundle frontend
COPY --chown=appuser:appuser src ./src
COPY --chown=appuser:appuser assets ./assets
COPY --chown=appuser:appuser config ./config
RUN npm run build

#####################
# Final image
#####################

FROM node:18-alpine
ENV NODE_ENV=prod

LABEL maintainer="cracker0dks"

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -s /sbin/nologin -G appuser appuser

# Create app directory and set ownership
RUN mkdir -p /opt/app && chown -R appuser:appuser /opt/app
WORKDIR /opt/app

# Switch to non-root user
USER appuser

COPY --chown=appuser:appuser ./package.json ./package-lock.json config.default.yml ./
RUN npm ci --only=prod

COPY --chown=appuser:appuser scripts ./scripts
COPY --from=base --chown=appuser:appuser /opt/app/dist ./dist

EXPOSE 8080
ENTRYPOINT ["npm", "run", "start"]