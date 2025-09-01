#!/bin/bash

# Stop and remove containers, networks, volumes
docker compose down -v

# Build and start containers
docker compose up -d --build
