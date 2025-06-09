# Alertmanager-Gotify Webhook 🔔

**A lightweight Prometheus Alertmanager webhook that forwards alerts to [Gotify](https://gotify.net/) - perfect for homelabs, self-hosted setups, and production environments.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/munirmardinli/alertmanager-gotify?include_prereleases&style=flat-square)](https://github.com/munirmardinli/alertmanager-gotify/releases)
[![Last Commit](https://img.shields.io/github/last-commit/munirmardinli/alertmanager-gotify?style=flat-square)](https://github.com/munirmardinli/alertmanager-gotify/commits)
[![Code Size](https://img.shields.io/github/languages/code-size/munirmardinli/alertmanager-gotify?style=flat-square)](https://github.com/munirmardinli/alertmanager-gotify)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)

<a href="https://www.buymeacoffee.com/munirmardinli"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=munirmardinli&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" /></a>


## 🚨 AlertManager Webhook Server Architecture
```text
┌───────────────────────────────────────────────────────────────────────┐
│                        Alert Processing Server                        │
│                                                                       │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────┐  │
│  │    Express App    │    │  Alert Processor  │    │   Gotify API  │  │
│  │                   │    │                   │    │               │  │
│  │ - REST Endpoints  │◄──►│ - Deduplication   │◄──►│ - Push Notif. │  │
│  │ - Middlewares     │    │ - Cache Management│    │ - Priority    │  │
│  └───────────────────┘    └───────────────────┘    └───────────────┘  │
│                                                                       │
│  ┌───────────────────┐                                                │
│  │   Scheduled Jobs  │                                                │
│  │                   │                                                │
│  │ - Cache Cleanup   │                                                │
│  └───────────────────┘                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## 🚀 Features

- **Instant Push Notifications**: Get Alertmanager alerts delivered to Gotify on any device
- **Simple Configuration**: Just set your Gotify URL and token
- **Docker-Friendly**: Ready-to-run container image
- **Templating Support**: Customize alert formats with Go templates
- **Lightweight**: Low resource usage (~10MB Docker image)

## 📦 Installation

### Docker (Recommended)

```yaml
---
services:
 alertmanager-gotify:
  image: ghcr.io/${GROUP:-munirmardinli}/alertmanager-gotify:${TAG:-latest}
  container_name: alertmanager-gotify
  hostname: alertmanager-gotify
  restart: always
  ports:
   - ${GOTIFY_PORT:-9094}:9094
  volumes:
   - type: bind
     source: /etc/localtime
     target: /etc/localtime
     read_only: true
  environment:
   GOTIFY_ALERT_URL: ${GOTIFY_ALERT_URL?:App Token is missing}
   GOTIFY_PORT: ${GOTIFY_PORT:-9094}
   UID: ${UID_NAS_ADMIN:-1026} #optional
   GID: ${GID_NAS_ADMIN:-100} #optional
  networks:
   dockerization:
  labels:
   com.centurylinklabs.watchtower.enable: true

networks:
 dockerization:
  external: true

```

## 🚀 Starting

1. Change to the Docker `folder`:

```bash
cd alertmanager-gotify
```

2. `Start` the desired compose stack:

```bash
docker-compose -f server.yml up -d
```

## ⚙️ Configuration

### Core Environment Variables

| Variable                       | Required | Default                 | Description                                                         |
| ------------------------------ | -------- | ----------------------- | ------------------------------------------------------------------- |
| `GOTIFY_URL`                   | Yes      | -                       | Full URL of your Gotify server (e.g., `http://gotify/message?token=`) |
| `GOTIFY_PORT`                  | No       | `9094`                  | Port for Gotify server (if not using default 80/443)                |
| `GOTIFY_ALERT_URL`             | Yes      | `http://gotify`         | Fallback Gotify base URL (used if `GOTIFY_URL` not set)             |


### Operational Variables

| Variable         | Required | Default         | Description                                          |
| ---------------- | -------- | --------------- | ---------------------------------------------------- |
| `NODE_ENV`       | No       | `development`   | Runtime environment (`production`/`development`)     |

### Configuration Example

1. Create `.env` file:
   ```ini
	GOTIFY_ALERT_URL=http://gotify/message?token=
	GOTIFY_PORT=4000
	NODE_ENV=development
   ```

### Alertmanager Integration

```yaml
# alertmanager.yml
receivers:
  - name: 'gotify-alerts'
    webhook_configs:
      - url: 'http://alertmanager-gotify:8080'
        send_resolved: true
route:
  receiver: 'gotify-alerts'
```
