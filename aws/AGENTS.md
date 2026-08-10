# AGENTS.md

Scope: this file covers the `aws/` folder only. See the [root
AGENTS.md](../AGENTS.md) for how this folder relates to `azure/` and
`gcp/`.

## Repository Overview

One-click deployment of the INJI stack (mimoto, inji-web, inji-verify) onto
AWS. It uses **AWS CDK (TypeScript)** to provision infrastructure (VPC, EKS
cluster) and **Helm** (invoked from within the CDK stacks, or standalone)
to deploy the application services. A companion CDK app,
`inji-certify-aws-automation/`, provisions the eSignet/Sunbird RC/certify
side of the stack separately (see its own README under
`inji-certify-aws-automation/documentation/`).

Two supported deployment modes, per `aws/README.md`:

- **Mode 1**: CDK provisions AWS infra and installs the Helm chart in one
  pass (`documentation/01-Deployment-CDK-INJI.md`).
- **Mode 2**: Helm chart installed directly against existing AWS
  infrastructure (RDS, EKS) without running CDK
  (`documentation/02-Deployment-Helm-INJI.md`).

## Technology Stack

- AWS CDK v2 (`aws-cdk-lib` 2.138.0, `aws-cdk` CLI 2.138.0)
- TypeScript ~5.4.5, compiled with `tsc`
- Jest + ts-jest for tests
- Helm charts (vendored under `helm/`) for in-cluster deployment
- Node.js/npm (version not pinned in `package.json` — use whatever the CDK
  v2.138 toolchain supports)

## Build & Test Commands

Run these from inside `aws/`:

```bash
npm install
npm run build      # tsc compile
npm test           # jest, runs test/inji-aws-automation.test.ts
npx cdk synth       # render the CloudFormation template without deploying
npx cdk diff        # compare against the deployed stack
npx cdk deploy       # provision AWS resources — see caution below
```

The same commands apply inside `inji-certify-aws-automation/`, which is a
separate CDK app with its own `package.json`.

## Configuration

- `aws/.env` holds the mandatory inputs read by the CDK app: AWS
  `ACCOUNT`, `REGION`, `CIDR`, `EKS_CLUSTER_NAME`, `DOMAIN`,
  `CERTIFICATE_ARN` (an ACM certificate ARN), `LOADBALANCER_NAME`,
  `S3_BUCKET_NAME`. The account ID and certificate ARN checked into this
  file on `develop` are example/demo values — replace them with your own
  before deploying, and never commit real ones back.
- `aws/inji-certify-aws-automation/.env` is a separate env file for that
  sub-app; check its own README before editing.
- `cdk.json` fixes the CDK app entrypoint and a long list of CDK feature
  flags (`context`) — do not remove entries from `context` without
  understanding which CDK behavior each flag controls, since several
  affect IAM policy generation and default removal policies.

## Project Structure Notes

```text
aws/
├── bin/inji-aws-automation.ts   - CDK app entrypoint
├── lib/                          - CDK stack definitions
│   ├── vpc-stack.ts
│   ├── eks-ec2-stack.ts
│   ├── mimoto-helm-stack.ts
│   ├── inji-web-helm-stack.ts
│   ├── inji-verify-helm-stack.ts
│   └── config.ts
├── test/                         - Jest tests
├── helm/                         - Vendored Helm charts (inji-esignet, inji-sunbird-rc-charts)
├── packages/                     - additional packaged assets
├── documentation/                - step-by-step deployment guides + images
└── inji-certify-aws-automation/  - separate CDK app for certify/eSignet/Sunbird RC infra
```

`helm/` contains full vendored chart trees (including third-party Bitnami
`common` library templates under `charts/common/`) — these are dependency
code, not something to hand-edit as part of a feature change.

## Development Workflow

1. Install dependencies and run `npm run build` before touching stacks —
   catches TypeScript errors early.
2. Use `npx cdk synth` / `npx cdk diff` to check the effect of a stack
   change before running `npx cdk deploy`.
3. Run `npm test` for any change to `lib/*.ts`.
4. Follow whichever of the two deployment-mode docs
   (`documentation/01-*.md` or `documentation/02-*.md`) matches the change
   you're making — they describe different entry points into the same
   Helm charts.

## Pull Request Guidelines

- State which CDK stack(s) (`vpc-stack`, `eks-ec2-stack`,
  `mimoto-helm-stack`, `inji-web-helm-stack`, `inji-verify-helm-stack`) are
  affected.
- If a change alters IAM policies, security groups, or the VPC CIDR,
  mention that explicitly — these directly affect deployed AWS
  permissions/networking.
- Do not include a real AWS account ID, ACM certificate ARN, or S3 bucket
  name from a live deployment in the PR description.

## Repository-Specific Considerations

- `npx cdk deploy` and `npx cdk destroy` provision/tear down real AWS
  resources against whatever `ACCOUNT`/`REGION` is set in `.env` or your
  AWS CLI profile. Never run them without the user's explicit request, and
  confirm the target account first.
- `inji-certify-aws-automation/` is a nested, independent CDK app (its own
  `.env`, `cdk.json`, `package.json`) — changes to `aws/` top-level stacks
  do not automatically apply to it and vice versa.

## Agent rules

### Do

1. Run `npm run build` and `npm test` before proposing a change to
   `lib/*.ts`.
2. Use `npx cdk diff` to review the effect of a stack change before
   suggesting `cdk deploy`.
3. Treat `helm/**` vendored chart trees as read-only unless the task
   specifically requires editing them.
4. Point out IAM, security-group, or CIDR changes explicitly when they
   occur.

### Do not

1. Do not run `npx cdk deploy` or `npx cdk destroy` unless the user has
   explicitly asked to provision or tear down AWS infrastructure.
2. Do not put a real AWS account ID, ACM certificate ARN, or other live
   value into `.env`, a commit, or a PR description.
3. Do not edit vendored chart files under `helm/**/charts/common/` as
   part of an unrelated feature change.
