# Kitchen & Marketplace Under Construction Page

A lightweight, static "Under Construction" page for the Living Foods Kitchen & Marketplace project. This project is containerized using Docker and served with Nginx.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine or server.

## Local Development & Testing

### 1. Build the Docker Image

Run the following command in the project root directory to build the image:

```bash
docker build -t marketplace-kitchen .
```

### 2. Run the Container

Run the built image on port `8080` (or any port of your choice):

```bash
docker run -d -p 8080:80 --name marketplace-kitchen marketplace-kitchen
```

Open your browser and navigate to `http://localhost:8080` to view the page.

### 3. Manage the Container

- **Stop the container**:
  ```bash
  docker stop marketplace-kitchen
  ```
- **Start it again**:
  ```bash
  docker start marketplace-kitchen
  ```
- **Remove the container**:
  ```bash
  docker rm marketplace-kitchen
  ```

---

## Server Deployment

This Docker image is stateless and ready to be deployed on any server or cloud container registry (e.g., AWS ECS/EKS, Google Cloud Run, DigitalOcean App Platform, or self-hosted VPS).

### Using Docker Compose

For quick deployments on a VPS with Docker Compose, you can define a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  marketplace-kitchen:
    build: .
    image: marketplace-kitchen:latest
    container_name: marketplace-kitchen
    ports:
      - "80:80"
    restart: always
```

Deploy it using:
```bash
docker compose up -d
```
