# Default target
help:
	@echo "Available commands:"
	@echo "  make dev                - Start full development environment (incl. app container)"
	@echo "  make services           - Start ONLY dependencies (db, redis) for local dev"
	@echo "  make down               - Stop all containers"
	@echo "  make logs               - Follow container logs"
	@echo "  make clean              - Stop containers (preserves data)"
	@echo "  make dangerously-clean  - Stop containers AND DELETE ALL DATA"

dev:
	docker compose up -d

services:
	docker compose up -d db redis

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f

clean:
	docker compose down --remove-orphans

dangerously-clean:
	@echo "WARNING: This will delete all database and redis data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker compose down -v --remove-orphans
