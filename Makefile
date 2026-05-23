# Default target
help:
	@echo "Available commands:"
	@echo "  make services           - Start dependencies (db, redis) for local dev"
	@echo "  make down               - Stop all containers"
	@echo "  make logs               - Follow container logs"
	@echo "  make clean              - Stop containers (preserves data)"
	@echo "  make dangerously-clean  - Stop containers AND DELETE ALL DATA"

services:
	docker compose up -d

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f

clean:
	docker compose down --remove-orphans

dangerously-clean:
	@echo "WARNING: This will delete all database and redis data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker compose down -v --remove-orphans
