
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

LABEL maintainer="Munir Mardinli <munir@mardinli.de>" \
	org.opencontainers.image.title="Alertmanager With Gotify" \
	org.opencontainers.image.vendor="Munir Mardinli" \
	org.opencontainers.image.description="This is a sample Node.js application for Alertmanager" \
	org.opencontainers.image.authors="Munir Mardinli <munir@mardinli.de>" \
	org.opencontainers.image.url="technophilik/alertmanager-gotify:latest" \
	org.opencontainers.image.documentation="https://munirmardinli.github.io/alertmanager-gotify" \
	org.opencontainers.image.source="https://github.com/munirmardinli/alertmanager-gotify" \
	org.opencontainers.image.revision="${VERSION}" \
	org.opencontainers.image.created="${BUILD_TIMESTAMP}" \
	org.opencontainers.image.version="${VERSION}" \
	org.opencontainers.image.base.name="node:18-alpine" \
	org.opencontainers.image.language="Node.js" \
	org.opencontainers.image.licenses="MIT"\
  github.repo="${GITHUB_REPO}" \
  github.owner="${GITHUB_OWNER}" \
  github.workflow.name="${GITHUB_WORKFLOW_NAME}" \
  github.pull_request.number="${GITHUB_PULL_REQUEST_NUMBER}" \
  github.pull_request.title="${GITHUB_PULL_REQUEST_TITLE}" \
  github.ref.type="${GITHUB_REF_TYPE}" \
  github.ref.name="${GITHUB_REF_NAME}" \
  github.run_number="${GITHUB_RUN_NUMBER}" \
  github.run_id="${GITHUB_RUN_ID}" \
  github.run_attempt="${GITHUB_RUN_ATTEMPT}" \
  github.actor="${GITHUB_ACTOR}" \
  github.sha="${GITHUB_SHA}"

CMD [ "npm", "start" ]
