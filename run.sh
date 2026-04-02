#!/bin/bash

# ─── Config ──────────────────────────────────────────────────────────────────
BACKEND_URL="http://164.90.242.214:9001"
FRONTEND_URL="http://138.68.125.204"
NAMESPACE="blockchain101"
CLUSTER_NAME="blockchain101-cluster"

# ─── Helpers ─────────────────────────────────────────────────────────────────
green()  { echo -e "\033[0;32m$1\033[0m"; }
red()    { echo -e "\033[0;31m$1\033[0m"; }
yellow() { echo -e "\033[0;33m$1\033[0m"; }
header() { echo -e "\n\033[1;36m$1\033[0m\n"; }

run() {
  yellow "▶ $*"
  "$@"
  local code=$?
  if [ $code -ne 0 ]; then
    red "✗ Command failed (exit $code)"
  else
    green "✓ Done"
  fi
  return $code
}

pause() {
  echo ""
  read -rp "Press Enter to return to menu..."
}

# ─── Menus ───────────────────────────────────────────────────────────────────

menu_docker() {
  while true; do
    header "🐳  Docker"
    echo "  1) Start local devnet"
    echo "  2) Rebuild + start local devnet"
    echo "  3) Stop local devnet"
    echo "  4) Tail logs"
    echo "  0) Back"
    echo ""
    read -rp "Choose: " opt
    case $opt in
      1) run docker compose up -d; pause ;;
      2) run docker compose up --build -d; pause ;;
      3) run docker compose down; pause ;;
      4) docker compose logs -f ;;
      0) break ;;
      *) red "Invalid option" ;;
    esac
  done
}

menu_scripts() {
  while true; do
    header "🤖  Automation Scripts"
    echo "  1) Populate devnet (transactions + blocks)"
    echo "  2) Quick populate"
    echo "  3) Verify blockchain state"
    echo "  4) Run tests"
    echo "  0) Back"
    echo ""
    read -rp "Choose: " opt
    case $opt in
      1) (cd scripts && run npm run populate); pause ;;
      2) (cd scripts && run npm run populate:quick); pause ;;
      3) (cd scripts && run npm run verify); pause ;;
      4) (cd scripts && run npm test); pause ;;
      0) break ;;
      *) red "Invalid option" ;;
    esac
  done
}

menu_terraform() {
  while true; do
    header "🏗️   Terraform"
    echo "  1) Init"
    echo "  2) Plan"
    echo "  3) Apply"
    echo "  4) Destroy"
    echo "  0) Back"
    echo ""
    read -rp "Choose: " opt
    case $opt in
      1) (cd terraform && run terraform init); pause ;;
      2) (cd terraform && run terraform plan); pause ;;
      3) (cd terraform && run terraform apply); pause ;;
      4) (cd terraform && run terraform destroy); pause ;;
      0) break ;;
      *) red "Invalid option" ;;
    esac
  done
}

menu_k8s() {
  while true; do
    header "☸️   Kubernetes"
    echo "  1) Save kubeconfig (auth)"
    echo "  2) Deploy all manifests"
    echo "  3) Get pods"
    echo "  4) Get services + IPs"
    echo "  5) Tail backend logs"
    echo "  6) Tail frontend logs"
    echo "  7) Restart deployments"
    echo "  8) Clean redeploy (delete + apply)"
    echo "  9) Delete all resources"
    echo "  0) Back"
    echo ""
    read -rp "Choose: " opt
    case $opt in
      1) run doctl kubernetes cluster kubeconfig save $CLUSTER_NAME; pause ;;
      2) run kubectl apply -f k8s/; pause ;;
      3) run kubectl get pods -n $NAMESPACE; pause ;;
      4) run kubectl get services -n $NAMESPACE; pause ;;
      5) kubectl logs -n $NAMESPACE -l app=blockchain101-backend -f ;;
      6) kubectl logs -n $NAMESPACE -l app=blockchain101-frontend -f ;;
      7) run kubectl rollout restart deployment/blockchain101-backend -n $NAMESPACE
         run kubectl rollout restart deployment/blockchain101-frontend -n $NAMESPACE; pause ;;
      8) run kubectl delete all --all -n $NAMESPACE
         sleep 3
         run kubectl apply -f k8s/
         kubectl get pods -n $NAMESPACE -w ;;
      9) run kubectl delete all --all -n $NAMESPACE; pause ;;
      0) break ;;
      *) red "Invalid option" ;;
    esac
  done
}

menu_app() {
  while true; do
    header "🌐  App"
    echo "  1) Open frontend in browser"
    echo "  2) Open backend /blockchain in browser"
    echo "  3) Check backend status"
    echo "  0) Back"
    echo ""
    read -rp "Choose: " opt
    case $opt in
      1) open $FRONTEND_URL; pause ;;
      2) open $BACKEND_URL/blockchain; pause ;;
      3) run curl -s $BACKEND_URL/blockchain | python3 -m json.tool | head -30; pause ;;
      0) break ;;
      *) red "Invalid option" ;;
    esac
  done
}

# ─── Main Menu ────────────────────────────────────────────────────────────────

while true; do
  header "⛓️   blockchain101 Playground"
  echo "  1) Docker   — local devnet (build/start/stop/logs)"
  echo "  2) Scripts  — populate / verify / test"
  echo "  3) Terraform — infrastructure"
  echo "  4) Kubernetes — deploy / manage"
  echo "  5) App      — open / status"
  echo "  0) Exit"
  echo ""
  read -rp "Choose: " choice
  case $choice in
    1) menu_docker ;;
    2) menu_scripts ;;
    3) menu_terraform ;;
    4) menu_k8s ;;
    5) menu_app ;;
    0) echo "Bye!"; exit 0 ;;
    *) red "Invalid option" ;;
  esac
done
