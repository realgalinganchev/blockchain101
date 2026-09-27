output "public_ip" {
  description = "Elastic IP: create an A record for var.domain pointing here"
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "EC2 instance (connect with: aws ssm start-session --target <id>)"
  value       = aws_instance.app.id
}

output "github_deploy_role_arn" {
  description = "Store as the AWS_DEPLOY_ROLE_ARN secret in the GitHub repo"
  value       = aws_iam_role.github_deploy.arn
}

output "dns_record" {
  description = "DNS record to create at the DNS provider"
  value       = "A  ${var.domain}  ->  ${aws_eip.app.public_ip}"
}
