# Terraform - Civo Kubernetes Deployment

Deploys blockchain101 to **Civo** Kubernetes.

Chosen for its simplicity and **$250 free credit** — enough to run the cluster for weeks at no cost.

---

## Prerequisites

1. [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.0
2. [kubectl](https://kubernetes.io/docs/tasks/tools/)
3. A [Civo account](https://dashboard.civo.com/signup) (free $250 credit on signup)

---

## Civo Setup

1. Sign up at [dashboard.civo.com](https://dashboard.civo.com/signup)
2. Go to **Security** → copy your **API key**

---

## Deploy

### 1. Configure variables
```bash
cp terraform.tfvars.example terraform.tfvars
# Set civo_token to your Civo API key
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

This creates (~2-3 min):
- Civo Kubernetes cluster (1x `g4s.kube.small` node)
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
| Kubernetes cluster | 1x g4s.kube.small (1CPU/2GB) | ~$5/mo |
| Load Balancers (2x) | — | Included |

**$250 free credit covers ~50 months** of this cluster. Destroy when not in use.
