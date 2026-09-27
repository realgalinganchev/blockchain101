# Remote state in S3 with native lockfiles (Terraform >= 1.10). Bucket and region come
# from backend.hcl (gitignored), so the account-specific bucket name stays out of the repo:
#
#   cp backend.hcl.example backend.hcl   # set your bucket
#   terraform init -backend-config=backend.hcl
terraform {
  backend "s3" {
    key          = "blockchain101/aws/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
