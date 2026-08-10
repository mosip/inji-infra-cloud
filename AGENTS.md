# AGENTS.md

## Repository Overview

`inji-infra-cloud` holds one-click deployment automation for the INJI stack
(inji-certify, mimoto, inji-web, inji-verify, plus eSignet and Sunbird RC
registry components) across three public clouds. There is no shared code
between the clouds — each top-level folder is a self-contained deployment
project with its own tooling, its own README, and its own release cadence:

| Folder | Cloud | What it provisions with | Guide |
|--------|-------|--------------------------|-------|
| `aws/` | Amazon Web Services | AWS CDK (TypeScript) + Helm | [aws/AGENTS.md](aws/AGENTS.md) |
| `azure/` | Microsoft Azure | Terraform + Helm + shell scripts | [azure/AGENTS.md](azure/AGENTS.md) |
| `gcp/` | Google Cloud Platform | Terraform + Cloud Build + Helm | [gcp/AGENTS.md](gcp/AGENTS.md) |

Because the three folders share no build system, no CI, and no code, this
root file only orients you — read the sub-guide for the folder you are
actually changing before doing anything there.

## Technology Stack

- No language or framework is shared repo-wide. Each cloud folder uses a
  different stack — see its own AGENTS.md.
- Common thread across all three: Kubernetes (EKS / AKS / GKE) as the
  runtime target, and Helm charts to deploy the INJI/eSignet/Sunbird RC
  services onto it.
- There is no root `package.json`, no root build file, and no
  `.github/workflows` CI pipeline in this repository (verified against the
  `develop` branch) — nothing here is automatically built, linted, or
  deployed by CI. Everything is run by hand from a workstation or bastion
  host, following the steps in each folder's README.

## Build & Test Commands

There is no repo-wide build or test command. Each cloud folder documents its
own (CDK synth/deploy, `terraform plan`/`apply`, or `gcloud builds submit`)
— see the sub-guide.

## Configuration

Configuration is per-cloud (env files, `.tfvars`, Helm values). Do not treat
one cloud folder's config file as a template for another — the variable
names and required values differ (e.g. AWS uses `aws/.env` with an ACM
certificate ARN; Azure and GCP use `terraform plan -var=...` flags plus
their own `deployments/*.env` files).

## Project Structure Notes

```text
inji-infra-cloud/
├── aws/     - AWS CDK app + vendored Helm charts + inji-certify-aws-automation sub-app
├── azure/   - Terraform modules + deployment shell scripts + Helm values
├── gcp/     - Terraform + Cloud Build YAML wrappers + Helm values
└── .gitignore
```

A few things worth knowing before you touch files:

- `aws/helm/**`, and the vendored chart trees under `azure/` and `gcp/`
  `deployments/configs`, include third-party/upstream Helm chart source
  (e.g. Bitnami `common` library templates). Treat these as vendored —
  don't "clean up" or restyle code you didn't author there.
- `aws/inji-certify-aws-automation/` is a **plain subdirectory** with its
  own `package.json`/`cdk.json`, not a git submodule — it is a second,
  separate CDK app nested inside `aws/`.
- There is no root README in this repository; each cloud folder's README is
  the actual source of truth for that folder.

## Development Workflow

1. Work inside exactly one cloud folder (`aws/`, `azure/`, or `gcp/`) at a
   time — cross-cloud changes in one PR make review harder and are not the
   norm in this repo's history.
2. Read that folder's README and AGENTS.md fully before changing
   Terraform/CDK code — these scripts provision real cloud resources.
3. There is no CI in this repository. Validate your own changes locally
   (`terraform plan`, `cdk synth`, `helm template`, etc. as applicable)
   before opening a PR — nothing else will catch mistakes.
4. Keep commits scoped to the folder you changed.

## Pull Request Guidelines

- Target the `develop` branch.
- Describe which cloud (aws/azure/gcp) and which stage (infra provisioning
  vs. service/Helm deployment) your change affects.
- If a change affects deployed resource shapes (VPC CIDRs, cluster sizing,
  IAM/service-account roles, firewall rules), say so explicitly in the PR
  description — these are infrastructure changes with real cost and access
  implications.
- Do not include real cloud account IDs, subscription IDs, project IDs,
  certificate ARNs, or credentials in PR descriptions or screenshots.

## Repository-Specific Considerations

- **This is infrastructure-provisioning code.** `terraform apply`,
  `terraform destroy`, `cdk deploy`, and the `gcloud builds submit
  .../destroy-script.yaml` commands documented in the sub-guides create and
  delete real cloud resources (VPCs, Kubernetes clusters, databases, load
  balancers, service accounts). Never run an apply/deploy/destroy command
  as a side effect of exploring the repo — only run one when the user has
  explicitly asked for that action, and confirm the target cloud
  account/project/subscription first.
- **Sample secret-shaped files already exist in this repo** — e.g.
  `gcp/deployments/secrets/key.jwk` (an RSA JWK) and various
  `deployments/*.env` / `.tfvars` files across `azure/` and `gcp/` carry
  demo values (test domains, demo project/resource names). Do not assume
  these are safe patterns to copy with real values, and never add a real
  private key, password, connection string, or cloud credential to any
  tracked file — pass secrets via environment variables, `-var` flags, or
  a cloud secret manager instead, matching what each folder's README
  already documents.
- The three folders were contributed independently (AWS first, then Azure
  and GCP), so naming conventions and folder layouts differ between them
  even though they deploy the same INJI services — do not assume symmetry.

## Agent rules

### Do

1. Read the relevant cloud folder's `AGENTS.md` and `README.md` before
   editing anything inside it.
2. Keep changes scoped to a single cloud folder per PR.
3. Treat vendored Helm chart trees (Bitnami `common` templates, etc.) as
   read-only unless the task specifically asks you to change them.
4. Call out any change to provisioned resource shape (sizing, networking,
   IAM) explicitly in the PR description.
5. Use environment variables, `-var` flags, or a secret manager for any
   credential — never hardcode one into a tracked file.

### Do not

1. Do not run `terraform apply`, `terraform destroy`, `cdk deploy`, or any
   `gcloud builds submit .../destroy-script.yaml` command unless the user
   has explicitly asked you to provision or tear down infrastructure.
2. Do not copy a real cloud account ID, subscription ID, project ID,
   certificate ARN, private key, or credential into any file, commit, or
   PR description.
3. Do not assume there is a CI pipeline that will validate your change —
   this repository has none.
4. Do not mix changes across `aws/`, `azure/`, and `gcp/` in a single PR
   unless the task explicitly requires it.
