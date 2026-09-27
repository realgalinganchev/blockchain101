#!/usr/bin/env bash
# (Re)deploys the stack on the EC2 host. Runs as root, triggered by the CI deploy job
# through SSM Run Command (no SSH): fetches the compose files for GIT_REF, builds .env
# from SSM Parameter Store, pulls the latest images and restarts.
set -euo pipefail

: "${AWS_REGION:?AWS_REGION must be set}"
GIT_REF="${GIT_REF:-main}"
REPO="${REPO:-realgalinganchev/blockchain101}"
DIR=/opt/blockchain101
RAW="https://raw.githubusercontent.com/${REPO}/${GIT_REF}/deploy/aws"

mkdir -p "$DIR"
cd "$DIR"
curl -fsSL "$RAW/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$RAW/Caddyfile" -o Caddyfile

param() {
  aws ssm get-parameter --region "$AWS_REGION" --name "$1" --with-decryption \
    --query Parameter.Value --output text
}

# Secrets never touch the repo or the image: they live in SSM and land in a root-only .env.
umask 077
DOMAIN="$(param /blockchain101/domain)" \
ADMIN_TOKEN="$(param /blockchain101/admin-token)" \
FIREBASE_JSON="$(param /blockchain101/firebase-service-account)" \
python3 - > .env.tmp <<'PY'
import json, os

sa = json.loads(os.environ["FIREBASE_JSON"])
env = {
    "DOMAIN": os.environ["DOMAIN"],
    "ADMIN_TOKEN": os.environ["ADMIN_TOKEN"],
    "FIREBASE_TYPE": sa.get("type", "service_account"),
    "FIREBASE_PROJECT_ID": sa["project_id"],
    "FIREBASE_PRIVATE_KEY_ID": sa["private_key_id"],
    # one line with literal \n; the backend turns them back into newlines
    "FIREBASE_PRIVATE_KEY": sa["private_key"].replace("\n", "\\n"),
    "FIREBASE_CLIENT_EMAIL": sa["client_email"],
    "FIREBASE_CLIENT_ID": sa["client_id"],
    "FIREBASE_AUTH_URI": sa.get("auth_uri", "https://accounts.google.com/o/oauth2/auth"),
    "FIREBASE_TOKEN_URI": sa.get("token_uri", "https://oauth2.googleapis.com/token"),
    "FIREBASE_AUTH_PROVIDER_CERT_URL": sa.get("auth_provider_x509_cert_url", "https://www.googleapis.com/oauth2/v1/certs"),
    "FIREBASE_CLIENT_CERT_URL": sa["client_x509_cert_url"],
    "FIREBASE_UNIVERSE_DOMAIN": sa.get("universe_domain", "googleapis.com"),
}
for key, value in env.items():
    print(f"{key}='{value}'")  # single quotes: compose takes the value literally
PY
mv .env.tmp .env

docker compose pull --quiet
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
docker compose ps
