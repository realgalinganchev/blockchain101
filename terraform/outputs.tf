output "cluster_id" {
  description = "DigitalOcean Kubernetes cluster ID"
  value       = digitalocean_kubernetes_cluster.k8s_cluster.id
}

output "cluster_endpoint" {
  description = "Kubernetes API server endpoint"
  value       = digitalocean_kubernetes_cluster.k8s_cluster.endpoint
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "doctl kubernetes cluster kubeconfig save ${var.cluster_name}"
}
