# AGENTS.md

Scope: this file covers the `azure/` folder only. See the [root
AGENTS.md](../AGENTS.md) for how this folder relates to `aws/` and `gcp/`.

## Repository Overview

One-click deployment of the INJI stack (inji-certify, mimoto, inji-web,
inji-verify) plus eSignet and Sunbird RC (registry) onto Azure. Deployment
has two stages, per `azure/README.md`:

- **Infrastructure**: Terraform provisions the AKS cluster, networking,
  bastion host, Postgres, and identity resources.
- **Service deployment**: shell scripts (run from the bastion host) invoke
  Helm to install the INJI/eSignet/RC charts, using config under
  `deployments/`.

## Technology Stack

- Terraform for Azure (azurerm provider, modules under
  `terraform-scripts/infra/modules/`)
- Helm charts, driven by shell scripts (`inji_deploy.sh`,
  `update_did.sh`, `upload_p12.sh`) and config in `deployments/`
- Postman collections (`postman-collections/`) for exercising the deployed
  APIs (registry, eSignet OIDC client management)

## Build & Test Commands

There is no automated test suite here. `terraform validate` and
`terraform plan` are safe, read-only validation steps. `terraform apply`
changes real cloud resources and requires explicit user approval before
running — it is not a routine validation step. Once applied, exercise the
deployed services with the Postman collection. Run these from
`azure/terraform-scripts/<stage>/`:

```bash
# One-time: Terraform state storage
cd terraform-scripts/storage-state
terraform init
terraform plan -var="subscription_id=your-subscription-id"
terraform apply -var="subscription_id=your-subscription-id"
```

```bash
# Core infra: AKS, network, bastion, Postgres
cd terraform-scripts/infra
terraform init
export TF_VAR_subscription_id="your-subscription-id"
export TF_VAR_bastion_admin_password="<load from a secret manager, never a literal>"
export TF_VAR_ssh_public_key="your-ssh-public-key"
terraform plan
# terraform apply changes real cloud resources — only run after explicit user approval:
terraform apply
```

Tear-down (destructive — see caution below):

```bash
cd terraform-scripts/infra
terraform destroy
```

After infra is up, service deployment is done from the bastion host by
running `inji_deploy.sh` (fetched from a script hosting location documented
in `README.md`) — read `README.md`'s "INJI service deployment" section
before running it, since it expects the bastion/AKS context to already be
configured via `az aks get-credentials`.

## Configuration

- `deployments/configs/.esignet.env`, `.inji.env`, `.registry.env` pin the
  Helm chart/image versions for each service group; edit these to change
  deployed versions.
- `deployments/properties/*.properties` (`esignet.properties`,
  `certify.properties`, `mimoto-default.properties`) hold application
  config applied during service setup — the README's step-by-step guide
  edits these when wiring up DID/credential-schema IDs.
- Terraform variables are passed on the command line, either via
  `-var=...` flags or `TF_VAR_*` environment variables (see Build & Test
  Commands above), rather than a checked-in `.tfvars` file — there is no
  `terraform.tfvars` in this folder. Use `-var=...` only for non-sensitive
  values; pass sensitive values like `bastion_admin_password` via
  `TF_VAR_*` or an approved secret manager, never as a literal `-var=...`
  argument (it would be exposed via shell history, process listings, and
  CI logs).

## Project Structure Notes

```text
azure/
├── terraform-scripts/
│   ├── storage-state/   - Terraform backend/state bucket setup
│   └── infra/            - AKS, network, bastion, Postgres, identity modules
├── deployments/
│   ├── configs/           - Helm values + env files per service group
│   ├── properties/        - application .properties + issuer config
│   ├── schemas/           - sample credential schemas (Hospital, Vaccination)
│   └── templates/         - credential HTML template
├── postman-collections/   - API collections for registry/eSignet/DID setup
├── assets/                - architecture diagrams
├── inji_deploy.sh, update_did.sh, upload_p12.sh   - bastion-side service setup scripts
└── LICENSE                - Mozilla Public License 2.0 (Terraform-module-scoped)
```

## Development Workflow

1. Terraform changes: `terraform init` then `terraform plan` in the
   relevant `terraform-scripts/<stage>/` folder before ever running
   `apply`.
2. Review `main.tf`/`variables.tf` in the specific module under
   `terraform-scripts/infra/modules/` (`aks`, `bastion`, `identity`,
   `network`, `psql`) you're changing — each is self-contained with its
   own `outputs.tf`.
3. Shell-script changes (`inji_deploy.sh`, `update_did.sh`,
   `upload_p12.sh`): these are meant to run on the bastion host with `az`
   and `kubectl` already configured — read the script's `get_input`/prompt
   flow before changing it, since later steps depend on earlier prompts.
4. Config edits under `deployments/configs` or `deployments/properties`
   take effect only after the corresponding Helm release or config-update
   step is re-run — check `README.md`'s step-by-step guide for which step
   applies.

## Pull Request Guidelines

- State whether the change is to Terraform infra, a deployment script, or
  Helm values/properties config.
- If a Terraform change affects an existing resource's identity (name,
  location, SKU) rather than just adding a new one, call this out — it
  may force a destroy/recreate.
- Do not include a real Azure subscription ID, bastion password, SSH key,
  or Postgres credential in the PR description.

## Repository-Specific Considerations

- **`terraform apply` and `terraform destroy` under `terraform-scripts/`
  provision and delete real Azure resources** (AKS cluster, VMs, Postgres,
  networking). Never run these without the user's explicit request, and
  confirm the target subscription first. The README also documents
  deleting resource groups directly (`az group delete -y -n inji-rg-dev`)
  as an alternative teardown — treat that the same way: destructive,
  explicit-request-only.
- `deployments/configs/*.env` and `deployments/properties/*.properties`
  checked into `develop` contain demo/example values (test domains, demo
  chart versions) — do not assume they're safe to deploy as-is to a real
  environment, and don't replace them with real secrets in a commit.
- The bastion-host scripts (`inji_deploy.sh`, `update_did.sh`,
  `upload_p12.sh`) are fetched by URL from an external GitHub location
  referenced in `README.md`, not run directly from this checkout — if you
  change these scripts, note in the PR that the hosted copy also needs
  updating.

## Agent rules

### Do

1. Run `terraform init` and `terraform plan` before ever suggesting
   `terraform apply` for a change under `terraform-scripts/`.
2. Read the specific Terraform module (`modules/aks`, `modules/bastion`,
   etc.) fully before editing its variables or resources.
3. Flag any Terraform change that could force resource replacement
   (name/location/SKU changes).
4. Note in the PR if a bastion-host script change also needs to be applied
   to the externally hosted copy referenced in `README.md`.

### Do not

1. Do not run `terraform apply`, `terraform destroy`, or `az group delete`
   unless the user has explicitly asked to provision or tear down Azure
   infrastructure.
2. Do not put a real Azure subscription ID, bastion admin password, SSH
   key, or database credential into a `.tfvars`/`.env` file, commit, or PR
   description.
3. Do not treat the demo values in `deployments/configs/*.env` as
   production-ready without the user confirming they should be replaced.
