
FROM node:18-alpine

ARG NODE_ENV
ARG BUILD_TIMESTAMP
ARG VERSION

RUN apk add --no-cache wget ca-certificates

RUN mkdir -p \
	/home/node/app/node_modules

WORKDIR /home/node/app

COPY --chown=node:node package.json /home/node/app/package.json
COPY --chown=node:node node_modules /home/node/app/node_modules
COPY --chown=node:node dist /home/node/app/dist

EXPOSE 9094

ENV NODE_ENV=${NODE_ENV}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV VERSION=${VERSION}

LABEL maintainer="Munir Mardinli <munir@mardinli.de>" \
	org.opencontainers.image.title="Alertmanager With Gotify" \
	org.opencontainers.image.vendor="Mardinli GT" \
	org.opencontainers.image.description="This is a sample Node.js application for Alertmanager" \
	org.opencontainers.image.authors="Munir Mardinli <munir@mardinli.de>" \
	org.opencontainers.image.url="technophilik/alertmanager-gotify:latest" \
	org.opencontainers.image.documentation="https://alertmanager-gotify.mardinli-gt.dev" \
	org.opencontainers.image.source="https://gitlab.com/plugin6335017/alertmanager-gotify" \
	org.opencontainers.image.revision="${VERSION}" \
	org.opencontainers.image.created="${BUILD_TIMESTAMP}" \
	org.opencontainers.image.version="${VERSION}" \
	org.opencontainers.image.base.name="node:18-alpine" \
	org.opencontainers.image.language="Node.js" \
	org.opencontainers.image.licenses="MIT"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD wget --spider -q http://localhost:9094/health || exit 1

CMD [ "npm", "start" ]
