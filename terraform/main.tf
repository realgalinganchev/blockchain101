# ─── DigitalOcean Kubernetes Cluster ────────────────────────────────────────

resource "digitalocean_kubernetes_cluster" "k8s_cluster" {
  name    = var.cluster_name
  region  = var.region
  version = var.kubernetes_version

  node_pool {
    name       = "${var.cluster_name}-pool"
    size       = var.node_size
    node_count = var.node_count
  }
}

# ─── Kubernetes Resources ────────────────────────────────────────────────────

resource "kubernetes_namespace" "blockchain101" {
  metadata {
    name = "blockchain101"
  }

  depends_on = [digitalocean_kubernetes_cluster.k8s_cluster]
}

resource "kubernetes_secret" "firebase_credentials" {
  metadata {
    name      = "firebase-credentials"
    namespace = kubernetes_namespace.blockchain101.metadata[0].name
  }

  data = {
    FIREBASE_TYPE                   = var.firebase_type
    FIREBASE_PROJECT_ID             = var.firebase_project_id
    FIREBASE_PRIVATE_KEY_ID         = var.firebase_private_key_id
    FIREBASE_PRIVATE_KEY            = var.firebase_private_key
    FIREBASE_CLIENT_EMAIL           = var.firebase_client_email
    FIREBASE_CLIENT_ID              = var.firebase_client_id
    FIREBASE_AUTH_URI               = var.firebase_auth_uri
    FIREBASE_TOKEN_URI              = var.firebase_token_uri
    FIREBASE_AUTH_PROVIDER_CERT_URL = var.firebase_auth_provider_cert_url
    FIREBASE_CLIENT_CERT_URL        = var.firebase_client_cert_url
    FIREBASE_UNIVERSE_DOMAIN        = var.firebase_universe_domain
  }
}
