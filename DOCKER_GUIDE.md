# Docker & AWS Deployment Guide for Aeva

## Table of Contents
1. [Docker Concepts](#docker-concepts)
2. [Project Architecture](#project-architecture)
3. [Run Locally with Docker](#run-locally-with-docker)
4. [AWS Free Tier Setup](#aws-free-tier-setup)
5. [GitHub Auto-Deploy](#github-auto-deploy)
6. [Useful Docker Commands](#useful-docker-commands)

---

## Docker Concepts

### What is Docker?
Docker packages your app + its dependencies into **containers** — lightweight, portable boxes that run the same everywhere (your laptop, AWS, etc).

### Key Terms
| Term | What it means |
|---|---|
| **Image** | A read-only template (like a recipe). Built from a `Dockerfile`. |
| **Container** | A running instance of an image (like a dish made from the recipe). |
| **Dockerfile** | Instructions to build an image (install Node, copy code, etc). |
| **docker-compose** | A tool to run **multiple containers** together (frontend + backend). |
| **Volume** | Persistent storage that survives container restarts. |
| **Network** | A private network so containers can talk to each other by name. |

### How This Project Uses Docker
```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │   frontend   │    │     backend      │   │
│  │ (nginx:80)   │───▶│  (express:5000)  │   │
│  │ serves React │    │  connects to:    │   │
│  │ proxies /api │    │  - MongoDB Atlas │   │
│  └──────────────┘    │  - Upstash Redis │   │
│        ↑             └──────────────────┘   │
│     port 80                                 │
└─────────────────────────────────────────────┘
         ↑
     Your browser
```

---

## Project Architecture

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine        # Start from a tiny Node.js image
WORKDIR /app               # Set working directory inside container
COPY package.json ./       # Copy package.json first (for caching)
RUN npm install --production  # Install only production deps
COPY . .                   # Copy the rest of the code
EXPOSE 5000                # Document which port the app uses
CMD ["node", "server.js"]  # Start the server
```

### Frontend Dockerfile (`frontend/Dockerfile`)
This uses a **multi-stage build** (a Docker best practice):
- **Stage 1**: Uses Node.js to `npm run build` (creates static HTML/JS/CSS)
- **Stage 2**: Uses nginx (a tiny web server) to serve the built files

The nginx config also **reverse-proxies** `/api/*` requests to the backend container, so the frontend doesn't need to know the backend's URL.

### docker-compose.yml
Defines both services, connects them on a shared network, and maps ports.

---

## Run Locally with Docker

### Prerequisites
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes docker-compose)

### Steps

```bash
# 1. Clone your repo
git clone https://github.com/YOUR_USERNAME/aeva.git
cd aeva

# 2. Create backend environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your real MongoDB URI, JWT secret, Redis credentials

# 3. Build and start everything
docker compose up --build

# 4. Open browser
# Frontend: http://localhost       (port 80)
# Backend:  http://localhost:5000  (direct access)
```

### Stop everything
```bash
docker compose down
```

### Rebuild after code changes
```bash
docker compose up --build
```

---

## AWS Free Tier Setup

> **AWS Free Tier** gives you 1 year of a `t2.micro` EC2 instance (1 vCPU, 1GB RAM) for free — enough to run this project.

### Step 1: Create an AWS Account
1. Go to https://aws.amazon.com/free/
2. Sign up (requires credit card, but won't charge for free tier usage)
3. Choose **Basic (Free)** support plan

### Step 2: Launch an EC2 Instance

1. Go to **EC2 Dashboard** → **Launch Instance**
2. Configure:
   - **Name**: `aeva-server`
   - **AMI**: Amazon Linux 2023 (Free tier eligible)
   - **Instance type**: `t2.micro` (Free tier eligible)
   - **Key pair**: Create a new key pair → Download the `.pem` file (save it safely!)
   - **Network settings**: Allow SSH (22), HTTP (80), and HTTPS (443) from anywhere
   - **Storage**: 20 GB gp3 (free tier allows up to 30GB)
3. Click **Launch Instance**

### Step 3: Connect to Your Instance

```bash
# Make the key file read-only (required by SSH)
chmod 400 your-key.pem

# Connect via SSH (replace with your instance's public IP)
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

On Windows, use PowerShell or the AWS Console's "Connect" button.

### Step 4: Install Docker on EC2

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Install Git
sudo dnf install git -y

# Log out and back in for group changes to take effect
exit
```

Then SSH back in:
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Step 5: Deploy the App

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/aeva.git
cd aeva

# Create the backend .env file
nano backend/.env
# Paste your environment variables (MONGODB_URI, JWT_SECRET, UPSTASH_*, PORT=5000)
# Save: Ctrl+O, Enter, Ctrl+X

# Build and start
docker compose up -d --build

# Check it's running
docker compose ps
docker compose logs -f
```

### Step 6: Access Your App
Open `http://YOUR_EC2_PUBLIC_IP` in your browser. That's it!

> **Tip**: To get a free domain, use [Freenom](https://www.freenom.com) or point a subdomain to your EC2 IP. For HTTPS, you can set up [Let's Encrypt with Certbot](https://certbot.eff.org/).

---

## GitHub Auto-Deploy

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys to your EC2 instance whenever you push to `main`.

### Setup (one-time)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these **Repository Secrets**:

| Secret Name | Value |
|---|---|
| `EC2_HOST` | Your EC2 instance's public IP (e.g., `3.14.159.26`) |
| `EC2_SSH_KEY` | Contents of your `.pem` file (paste the full text) |
| `BACKEND_ENV` | Full contents of your `backend/.env` file |

### How it works
```
Push to main → GitHub Actions → SSH into EC2 → git pull → docker compose up --build
```

Every push to `main` triggers this pipeline automatically. You can see the status in the **Actions** tab of your GitHub repo.

---

## Useful Docker Commands

```bash
# See running containers
docker compose ps

# View live logs
docker compose logs -f

# View logs for one service
docker compose logs -f backend

# Restart a specific service
docker compose restart backend

# Stop everything
docker compose down

# Rebuild and restart
docker compose up -d --build

# Enter a running container (for debugging)
docker exec -it aeva-backend sh
docker exec -it aeva-frontend sh

# Check disk usage
docker system df

# Clean up unused images/containers
docker system prune -f
```

---

## Local Development (without Docker)

If you want to run without Docker during development, create a `frontend/.env` file:

```
VITE_API_URL=http://localhost:5000
```

Then run the frontend and backend separately:
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

---

## Cost Summary (Free!)

| Service | Free Tier |
|---|---|
| **AWS EC2** | t2.micro — 750 hrs/month for 12 months |
| **MongoDB Atlas** | M0 cluster — 512MB free forever |
| **Upstash Redis** | 10,000 commands/day free forever |
| **GitHub Actions** | 2,000 minutes/month free for public repos |
| **GitHub** | Free for public/private repos |

Your entire stack can run at **$0/month** within free tier limits.
