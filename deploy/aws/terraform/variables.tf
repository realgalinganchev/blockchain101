variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "domain" {
  description = "Public hostname for the demo (an A record must point at the Elastic IP)"
  type        = string
  default     = "blockchain101.founderexchange.co"
}

variable "instance_type" {
  description = "EC2 instance type (x86_64, matching the Docker Hub images)"
  type        = string
  default     = "t3.micro"
}

variable "github_repo" {
  description = "owner/repo allowed to deploy through GitHub Actions OIDC"
  type        = string
  default     = "realgalinganchev/blockchain101"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub OIDC provider (set false if the account already has one)"
  type        = bool
  default     = true
}

variable "budget_email" {
  description = "Email for monthly cost alerts; empty disables the budget"
  type        = string
  default     = ""
}

variable "monthly_budget_usd" {
  description = "Account-wide monthly budget that triggers the alerts"
  type        = number
  default     = 20
}
