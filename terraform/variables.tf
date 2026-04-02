# DigitalOcean Authentication
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

# Cluster Config
variable "region" {
  description = "DigitalOcean region slug"
  type        = string
  default     = "fra1"
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = "blockchain101-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version slug (run: doctl kubernetes options versions)"
  type        = string
  default     = "1.32.13-do.2"
}

variable "node_size" {
  description = "DigitalOcean node size slug (~$12/mo for s-1vcpu-2gb)"
  type        = string
  default     = "s-1vcpu-2gb"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 1
}

# Firebase Credentials (stored as k8s Secret)
variable "firebase_type" {
  description = "Firebase service account type"
  type        = string
  default     = "service_account"
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  sensitive   = true
}

variable "firebase_private_key_id" {
  description = "Firebase private key ID"
  type        = string
  sensitive   = true
}

variable "firebase_private_key" {
  description = "Firebase private key"
  type        = string
  sensitive   = true
}

variable "firebase_client_email" {
  description = "Firebase client email"
  type        = string
  sensitive   = true
}

variable "firebase_client_id" {
  description = "Firebase client ID"
  type        = string
  sensitive   = true
}

variable "firebase_auth_uri" {
  description = "Firebase auth URI"
  type        = string
  default     = "https://accounts.google.com/o/oauth2/auth"
}

variable "firebase_token_uri" {
  description = "Firebase token URI"
  type        = string
  default     = "https://oauth2.googleapis.com/token"
}

variable "firebase_auth_provider_cert_url" {
  description = "Firebase auth provider cert URL"
  type        = string
  default     = "https://www.googleapis.com/oauth2/v1/certs"
}

variable "firebase_client_cert_url" {
  description = "Firebase client cert URL"
  type        = string
  sensitive   = true
}

variable "firebase_universe_domain" {
  description = "Firebase universe domain"
  type        = string
  default     = "googleapis.com"
}
