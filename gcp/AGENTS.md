# AGENTS.md

Scope: this file covers the `gcp/` folder only. See the [root
AGENTS.md](../AGENTS.md) for how this folder relates to `aws/` and
`azure/`.

## Repository Overview

One-click deployment of the INJI stack (inji-certify, mimoto, inji-web,
inji-verify) plus eSignet and Sunbird RC (registry) onto GCP. Deployment
has three parts, per `gcp/README.md`:

- **Terraform** provisions infrastructure (GKE cluster, network, Cloud SQL,
  service accounts) in stages: `pre-config` then app-level infra.
- **Cloud Build YAML** files under `builds/` wrap the Terraform/Helm steps
  so they can be run as one `gcloud builds submit` command instead of
  invoking Terraform/Helm by hand.
- **Helm** deploys the application services onto the provisioned GKE
  cluster, using config under `deployments/`.

## Technology Stack

- Terraform for GCP (google provider; only a `pre-config` stage exists
  under `terraform-scripts/` on `develop` — see Project Structure Notes)
- Google Cloud Build (`builds/*/deploy-script.yaml`,
  `destroy-script.yaml`) as the orchestration layer
- Helm charts, driven through Cloud Build and config in `deployments/`
- Postman collections (`postman-collections/`) for exercising deployed
  APIs

## Build & Test Commands

There is no automated test suite — validation is done by running Cloud
Build submissions and then exercising the deployed services with the
Postman collection. All commands below are documented in `gcp/README.md`
and expect `PROJECT_ID`, `REGION`, `GSA` (service account), and related
shell variables to already be set (see that README's "Setup CLI
environment variables" section).

```bash
# One-time: Terraform state bucket
gcloud storage buckets create gs://$PROJECT_ID-inji-state \
  --project=$PROJECT_ID --default-storage-class=STANDARD \
  --location=$REGION --uniform-bucket-level-access
```

```bash
# Provision infra (GKE, network, Cloud SQL, etc.)
gcloud builds submit --config="./builds/infra/deploy-script.yaml" \
  --project=$PROJECT_ID \
  --substitutions=_PROJECT_ID_=$PROJECT_ID,_SERVICE_ACCOUNT_=$SERVICE_ACCOUNT,_LOG_BUCKET_=$PROJECT_ID-inji-state
```

```bash
# Deploy application services (Helm charts)
gcloud builds submit --config="./builds/apps/deploy-script.yaml" \
  --region=$REGION --project=$PROJECT_ID \
  --substitutions=_PROJECT_ID_=$PROJECT_ID,_REGION_=$REGION,_LOG_BUCKET_=$PROJECT_ID-inji-state,_EMAIL_ID_=$EMAIL_ID,_DOMAIN_=$DOMAIN,_SERVICE_ACCOUNT_=$GSA,_FR_DOMAIN_=$FR_DOMAIN,_ESIGNET_DOMAIN_=$ESIGNET_DOMAIN,_VERIFY_DOMAIN_=$VERIFY_DOMAIN,_WEB_DID_BASE_URL_=$WEB_DID_BASE_URL
```

Teardown (destructive — see caution below) uses the matching
`destroy-script.yaml` under `builds/infra/` and `builds/apps/` with the
same substitution pattern.

## Configuration

- `gcp/.env` pins Helm chart/image versions for inji-certify, mimoto,
  inji-web, inji-verify.
- `deployments/.esignet.env` and `deployments/.registry.env` pin chart
  versions for the eSignet and registry (Sunbird RC) service groups.
- `terraform-variables/dev/pre-config/pre-config.tfvars` supplies the
  actual values (project/network/firewall/GKE cluster/Cloud SQL shape)
  consumed by `terraform-scripts/pre-config/variables.tf` — this file is
  checked into `develop` with demo naming (`inji-demo-*`); review every
  value before applying against a real project rather than assuming it's
  ready to use as-is.
- `deployments/secrets/key.jwk` is referenced by the p12-import build step
  (`builds/p12-import/deploy-script.yaml`) as the expected location for the
  OIDC client's private key JWK. **The copy checked into `develop` is a
  real-shaped RSA private key, not a placeholder marker** — treat any file
  at this path as sensitive, never let a real production key end up
  committed here, and flag this file if you're asked to review the repo's
  handling of secrets.

## Project Structure Notes

```text
gcp/
├── terraform-scripts/
│   └── pre-config/        - backend.tf, pre-config.tf, variables.tf (landing-zone infra)
├── terraform-variables/
│   └── dev/pre-config/pre-config.tfvars   - actual values for the pre-config stage
├── builds/
│   ├── infra/              - Cloud Build wrapper: provision/destroy infra
│   ├── apps/                - Cloud Build wrapper: deploy/destroy app services
│   ├── config-update/       - Cloud Build wrapper: push properties/config changes
│   └── p12-import/          - Cloud Build wrapper: mount OIDC p12 keystore to mimoto
├── deployments/
│   ├── configs/, properties/, secrets/  - Helm values, .properties, and key material
├── postman-collections/    - API collections for registry/eSignet/DID setup
└── assets/                  - architecture diagrams
```

Note: the README's "Workspace - Folder structure" section also describes a
`builds/infra` step as doing "end to end Infrastructure deployment" and a
separate `terraform-scripts` folder for "end to end Infrastructure" — in
the actual `develop` tree, `terraform-scripts/` currently contains only the
`pre-config` stage; the Cloud Build YAML in `builds/infra/` is the layer
that actually drives it end to end. Confirm against the live tree before
assuming other stages exist.

## Development Workflow

1. Terraform changes: work through `terraform-scripts/pre-config/*.tf` and
   its matching entries in `terraform-variables/dev/pre-config/pre-config.tfvars`
   together — the tfvars file's keys must match `variables.tf`.
2. Cloud Build YAML changes (`builds/*/deploy-script.yaml`): these are
   thin wrappers that invoke Terraform/Helm/kubectl steps with
   `${_SUBSTITUTION}` variables — check every substitution used in the
   step is also passed on the `gcloud builds submit` command line in
   `README.md`, and update the README if you add or rename one.
3. Config edits under `deployments/configs` or `deployments/properties`
   are applied via the `config-update` Cloud Build step, not just by
   editing the file — re-run that step after changing a properties file.

## Pull Request Guidelines

- State whether the change is to Terraform, a Cloud Build YAML wrapper, or
  Helm values/properties config.
- If a Terraform or `pre-config.tfvars` change alters an existing
  resource's identity (name, region, machine type, network CIDR), call
  this out — it may force a destroy/recreate of a live resource.
- Do not include a real GCP project ID, service account email, or key
  material in the PR description.

## Repository-Specific Considerations

- **The `deploy-script.yaml`/`destroy-script.yaml` Cloud Build steps under
  `builds/infra/` and `builds/apps/` provision and delete real GCP
  resources** (GKE cluster, Cloud SQL, networking, service accounts).
  Never run a `gcloud builds submit ... destroy-script.yaml` or
  `deploy-script.yaml` command without the user's explicit request, and
  confirm the target `$PROJECT_ID` first.
- `deployments/secrets/key.jwk` is tracked in git with real-shaped RSA key
  material (see Configuration above) — this is an existing condition of
  the repository, not something to silently "fix" as a drive-by change;
  raise it explicitly if asked to review secret handling, and never add a
  second real key alongside it.
- `terraform-variables/dev/pre-config/pre-config.tfvars` uses permissive
  demo firewall rules (SSH and HTTP/S open to `0.0.0.0/0`) — do not treat
  this as a secure default to replicate elsewhere without the user
  confirming that's intended.

## Agent rules

### Do

1. Keep `pre-config.tfvars` keys in sync with `variables.tf` when editing
   either.
2. Check that every `${_SUBSTITUTION}` used in a Cloud Build YAML step is
   documented in `README.md`'s `gcloud builds submit` example.
3. Flag Terraform/tfvars changes that could force replacement of a live
   resource.
4. Call out `deployments/secrets/key.jwk` explicitly if asked to review or
   report on secret handling in this folder.

### Do not

1. Do not run any `gcloud builds submit --config=./builds/.../deploy-script.yaml`
   or `.../destroy-script.yaml` command unless the user has explicitly
   asked to provision or tear down GCP infrastructure.
2. Do not put a real GCP project ID, service account email, or private key
   into a `.tfvars`/`.env` file, commit, or PR description.
3. Do not copy the open (`0.0.0.0/0`) firewall rules from
   `pre-config.tfvars` into a new environment without the user confirming
   that's intended.
