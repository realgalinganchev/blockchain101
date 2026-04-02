# Terraform - DigitalOcean Kubernetes Deployment

Deploys blockchain101 to **DigitalOcean Kubernetes Service (DOKS)**.

Default config: 1x `s-1vcpu-2gb` node (~$12/mo), region `fra1` (Frankfurt).

---

## Prerequisites

1. [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.0
2. [kubectl](https://kubernetes.io/docs/tasks/tools/)
3. [doctl](https://docs.digitalocean.com/reference/doctl/how-to/install/) (DigitalOcean CLI)
4. A [DigitalOcean account](https://cloud.digitalocean.com/registrations/new) with a Personal Access Token

---

## DigitalOcean Setup

1. Sign up at [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Go to **API** → **Personal access tokens** → generate a token with read/write scope

---

## Deploy

### 1. Configure variables
```bash
cp terraform.tfvars.example terraform.tfvars
# Set do_token to your DigitalOcean personal access token
```

### 2. Set Firebase secrets via environment (don't commit them)
```bash
export TF_VAR_firebase_project_id="your-project-id"
export TF_VAR_firebase_private_key_id="your-key-id"
export TF_VAR_firebase_private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export TF_VAR_firebase_client_email="firebase-adminsdk@your-project.iam.gserviceaccount.com"
export TF_VAR_firebase_client_id="your-client-id"
export TF_VAR_firebase_client_cert_url="https://www.googleapis.com/robot/v1/metadata/x509/..."
```

### 3. Apply
```bash
terraform init
terraform plan
terraform apply
```

This creates (~3-5 min):
- DigitalOcean Kubernetes cluster (1x `s-1vcpu-2gb` node)
- `blockchain101` namespace
- Firebase credentials as a Kubernetes Secret

### 4. Configure kubectl
```bash
# Use the command from terraform output
terraform output kubeconfig_command | bash
```

### 5. Deploy application
```bash
kubectl apply -f ../k8s/
```

### 6. Get service URLs
```bash
kubectl get services -n blockchain101
```

Wait for `EXTERNAL-IP` to be assigned (1-2 min), then:
- **Backend**: `http://<backend-external-ip>:9001`
- **Frontend**: `http://<frontend-external-ip>`

---

## Destroy

```bash
kubectl delete -f ../k8s/
terraform destroy
```

---

## Cost

| Resource | Size | Cost |
|---|---|---|
| Kubernetes cluster | 1x s-1vcpu-2gb (1CPU/2GB) | ~$12/mo |
| Load Balancers (2x) | — | ~$12/mo each |

Destroy when not in use to avoid charges.
