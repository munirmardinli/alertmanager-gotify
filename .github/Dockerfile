
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
ARG GITHUB_REPO="munirmardinli/alertmanager-gotify"
ARG GITHUB_OWNER="munirmardinli"
ARG GITHUB_WORKFLOW_NAME="Docker Image CI"
ARG GITHUB_PULL_REQUEST_NUMBER=""
ARG GITHUB_PULL_REQUEST_TITLE=""
ARG GITHUB_REF_TYPE=""
ARG GITHUB_REF_NAME=""
ARG GITHUB_RUN_NUMBER=""
ARG GITHUB_RUN_ID=""
ARG GITHUB_RUN_ATTEMPT=""
ARG GITHUB_ACTOR=""
ARG GITHUB_SHA="${VERSION}"

LABEL maintainer="Munir Mardinli <munir@mardinli.de>"
LABEL org.opencontainers.image.title="Alertmanager With Gotify"
LABEL org.opencontainers.image.vendor="Munir Mardinli"
LABEL org.opencontainers.image.description="This is a sample Node.js application for Alertmanager"
LABEL org.opencontainers.image.authors="Munir Mardinli <munir@mardinli.de>"
LABEL org.opencontainers.image.url="technophilik/alertmanager-gotify:latest"
LABEL org.opencontainers.image.documentation="https://munirmardinli.github.io/alertmanager-gotify"
LABEL org.opencontainers.image.source="https://github.com/munirmardinli/alertmanager-gotify"
LABEL org.opencontainers.image.revision="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_TIMESTAMP}"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.base.name="node:18-alpine"
LABEL org.opencontainers.image.language="Node.js"
LABEL org.opencontainers.image.licenses="MIT"
LABEL github.repo="${GITHUB_REPO}"
LABEL github.owner="${GITHUB_OWNER}"
LABEL github.workflow.name="${GITHUB_WORKFLOW_NAME}"
LABEL github.pull_request.number="${GITHUB_PULL_REQUEST_NUMBER}"
LABEL github.pull_request.title="${GITHUB_PULL_REQUEST_TITLE}"
LABEL github.ref.type="${GITHUB_REF_TYPE}"
LABEL github.ref.name="${GITHUB_REF_NAME}"
LABEL github.run_number="${GITHUB_RUN_NUMBER}"
LABEL github.run_id="${GITHUB_RUN_ID}"
LABEL github.run_attempt="${GITHUB_RUN_ATTEMPT}"
LABEL github.actor="${GITHUB_ACTOR}"
LABEL github.sha="${GITHUB_SHA}"
LABEL com.centurylinklabs.watchtower.enable="true"

CMD [ "npm", "start" ]
