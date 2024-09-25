# INJI Certify Helm Charts
INJI Certify enables an issuer to connect with an existing database in order to issue verifiable credentials. It assumes the source database has a primary key for each data record and information required to authenticate a user (e.g. phone, email, or other personal information). Issuer can configure their respective credential schema for various types of certificates they wish to issue. Certificates are generated in JSON-LD as per W3C VC v1.1.


# Installation Guide
The following steps will help you to setup Sunbird RC and Esignet services using Kubernetes Helm charts. The Helm charts provides a convenient way to deploy the INJI's dependent services such as **eSignet** and **sunbird-rc** specifically automated for INJI.

## AWS CDK One Click Deployment ##

### CDK Stack Overview
The CDK comprises stacks designed to perform unique provisioning steps, making the overall automation modular.

  1. CDK Stacks provisioning AWS Resources
  2. CDK Stacks provisioning HELM execution charts
  3. CDK Configuration files

#### 1. CDK Stacks provisioning AWS Resources
Designed and implemented Infrastructure as Code (IaC) using AWS CDK to automate and consistently provision AWS resources. The table below lists the stacks and their corresponding default provisioned AWS resources.

| CDK Stack   name   | File name/path   | Description                                                                                       | Default AWS Resources                                                                                                                                  |
|--------------------|------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| vpcstackesignet    | lib/vpc-stack.ts     | Foundation stack creation including VPC,   Subnets, Route   tables, Internet Gateway, NAT Gateway | One VPC with 6 subnets, divided into 2 public subnets, 2   private subnets, and 2 database subnets across two availability zones.                      |
| rdsstackesignet    | lib/rds-stack.ts     | Creates RDS Aurora Postgresql                                                                     | Aurora PostgreSQL Serverless v2 with provisioned capacity, deployed in   the database subnets.                                                         |
| eksec2stackesignet | lib/eks-ec2-stack.ts | Creates EKS EC2 Cluster                                                                           | An Amazon EKS cluster   provisioned with on-demand EC2 instances of the t2.medium instance class. All   EC2 instances are deployed in private subnets. |
| s3stackinji      | lib/inji-aws-s3-stack.ts      | Creates AWS S3 bucket                                                                                             | Provisioned Amazon S3 bucket with the region specified and enabled public access  |


#### 2. CDK Stacks provisioning HELM execution charts
Helm charts were implemented using AWS CDK to automate and consistently deploy eSignet services. The table below lists the stacks and their corresponding EKS pod names.

**Sunbird RC CDK stacks**
| CDK   Stack name                 | File name/path                     | Description                                                                                                                                                                                | Pods Deployed                                              |
|----------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
 | vaulthelmstacksbrc2      | lib/sunbirdrc2-helm-vault-stack.ts      | Deploys Vault services with single node.                                                                                                     | vault-0, vault-injector |
 | vaultinithelmstacksbrc2      | lib/sunbirdrc2-helm-vaultInit-stack.ts      | Initialize and Unseal Vault service and stores the vault token and unseal token in kubernetes secrets for further usage                                                                                                      | vault-init |
 | sunbirdrc2helmStacksbrc2      | lib/sunbirdrc2-helm-stack.ts      | Deploys sunbird rc helm chart with limited services such as registry, identity service, credential service and credentials-schema service.                                                                                                      | registry, identity-service, credential-service, credentials-schema |
 
 **eSignet CDK stacks**

 | CDK   Stack name                 | File name/path                     | Description                                                                                                                                                                                | Pods Deployed                                              |
|----------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------| 
 | mosipcommonhelmStackesignet      | lib/mosipcommon-helm-stack.ts      | Deploys esignet dependent services such as  softhsm, artifactory, kafka and kafka UI.                                                                                                      | softhsm, kafka-0, kafka-zookeeper-0, kafka-ui, artifactory |
| esignetbootstraphelmStackesignet | lib/esignetbootstrap-helm-stack.ts | Creates esignet and keycloak databases in Amazon RDS and   creates  global configmap                                                                                                       | esignet-bootstrap-job                                      |
| keycloakhelmStackesignet         | lib/keycloak-helm-stack.ts         | Deploys keycloak service to provide authentication for eSignet   APIs                                                                                                                      | keycloak-0                                                 |
| keycloakinithelmStackesignet     | lib/keycloakinit-helm-stack.ts     | Initialize keycloak services by creating roles and clients in   keycloak                                                                                                                   | keycloak-init                                              |
| postgresinithelmStackesignet     | lib/postgresinit-helm-stack.ts     | Run DB scripts for esignet    services                                                                                                                                                     | db-esignet-init-job                                        |
| esignetinithelmStackesignet      | lib/esignetinit-helm-stack.ts      | Create esignet springboot property file as config map by   substituting all required values from dependent services such as keycloak,   softhsm and artifactory and kafka                  | esignet-init-job                                           |
| esignethelmStackesignet          | lib/esignet-helm-stack.ts          | Deploys eSignet core service                                                                                                                                                               | esignet                                                    |
| oidcuihelmStackesignet           | lib/oidcui-helm-stack.ts           | Deploys eSignet UI(OIDC) service.                                                                                                                                                          | oidc-ui                                                    |

#### 3. CDK Config Files
CDK configuration files for inputs to AWS services and Helm charts and CDK executions. The table below lists the filename and description

| File   name/path              | Description                                                                                                                                                    |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| bin/inji-certify-aws-automation.ts | Entrypoint of the CDK application                                                                                                                              |
| lib/config.ts                 | Input file for CDK Deployment including defaults ( AWS   Account Number,   Region, AWS services, Helm chart details and eSignet configurations etc) |


### Prerequisties:

Before deploying CDK stacks, ensure you have the following prerequisites in place:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. [Node.js](https://nodejs.org/en/download/package-manager)
3. Access to AWS account


### Prepare your environment
```
# Install TypeScript globally for CDK
npm i -g typescript

# Install aws cdk
npm i -g aws-cdk

# Clone the repository
git clone <repo_url>
cd inji-certify-aws-automation

# Install the CDK application
npm i

# cdk bootstrap [aws://<ACCOUNT-NUMBER>/<REGION>]
cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>
```

#### Update environment variables, with your preferred editor. Open '.env' file in the CDK app.

**Mandatory environment variables**
| ENVIRONMENT VARIABLES | EXAMPLE VALUE      | DESCRIPTION                                                                                                                                                                                                                                                                                                              |
|-----------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| REGION                | ap-south-1         | AWS region                                                                                                                                                                                                                                                                                                               |
| ACCOUNT               | 1234567890         | AWS 12 digit account number                                                                                                                                                                                                                                                                                              |
| CIDR                  | 10.20.0.0/16       | VPC CIDR, change it as per your environment                                                                                                                                                                                                                                                                              |
| MAX_AZS               | 2                  | AWS Availability Zone count, default 2                                                                                                                                                                                                                                                                                   |
| RDS_USER              | postgres           | Database user name for core registory service, default 'postgres'                                                                                                                                                                                                                                                        |
| RDS_PASSWORD          | xxxxxxxx           | Database password, used while DB creation and passed down to Esignet services helm chart                                                                                                                                                                                                                                 |
| EKS_CLUSTER_NAME      | ekscluster-inji-certify | AWS EKS Cluster name                                                                                                                                                                                                                                                                                                     |
| LOADBALANCER_NAME     | inji-certify-alb        | Amazon Application Load balancer name for esignet and sunbird rc and keycloak. All the  services uses the same loadbalancer and routes the application through   granular rules                                                                                                                                                        |
| DOMAIN                  | sandbox.demodpgs.net                                                                | Specify the domain name to be used by esignet and Keycloak services. If you have a custom domain, enter it here.                                                                                                                                                                                  |
| CERTIFICATE_ARN       | xxxxxxxxxx         | The Amazon certificate ARN is essential for enabling HTTPS on the AWS Load Balancer. If you have your own domain,  can generate an SSL certificate yourself and upload it to the Amazon Certificate Manager. Afterward, create the certificate. Keycloak service operates exclusively over HTTPS, making it mandatory.    |
| SBRC_RELEASE       | sunbird-rc         | Sunbird RC helm release name used in the CDK config. This variable is required for esignet CDK stacks. Pass this value after sunbird rc CDK stack is deployed.    |
| SBRC_NAMESPACE       | sbrc         | Sunbird RC kubernetes namespace name used in the CDK config.  This variable is required for esignet CDK stacks. Pass this value after sunbird rc CDK stack is deployed.    |
| SBRC_DID       | did:web:<S3_BUCKET_NAME>.s3.ap-south-1.amazonaws.com::XXX         | Sunbird RC's DID generated during sunbird rc post installation setup.  This variable is required for esignet CDK stacks. Pass this value after sunbird rc CDK stack is deployed.    |
| SBRC_SCHEMA_ID       | did:schema:zzzz         | Sunbird RC's schema ID generated during post installation setup. This variable is required for esignet CDK stacks. Pass this value after sunbird rc CDK stack is deployed.    |

**Deploy CDK**
```
# After updating the .env file, run AWS CDK commands to begin with deploy

# Emits the synthesized CloudFormation template
cdk synth

# List CDK stack
cdk list

# Deploy single stack  - vpcstackinjicertify, rdsstackinjicertify, eksec2stackinjicertify, sunbirdrc2helmStacksbrc2,oidcuihelmStackesignet
# sunbirdrc2helmStacksbrc2  will deploy the stack in defined order mentioned CDK app. It deploys the stacks in the following order: vaulthelmstacksbrc2, vaultinithelmstacksbrc2, sunbirdrc2helmStacksbrc2

# COMPLETE THE POST INSTALLATION STEPS FOR SUNBIRD RC  UPDATE .ENV VALUES BEFORE EXECUTING THE ESIGNET CDK STACKS

# oidcuihelmStackesignet will deploy the stack in defined order mentioned CDK app. It deploys the stacks in the following order: mosipcommonhelmStackesignet, esignetbootstraphelmStackesignet, keycloakhelmStackesignet, keycloakinithelmStackesignet, postgresinithelmStackesignet, esignetinithelmStackesignet, esignethelmStackesignet and oidcuihelmStackesignet

cdk deploy <stack_name>

# Alternatively you could also deploy all stacks and CDK would handle the sequence
cdk deploy --all
```

After installing all the CDK stacks, verify the AWS services in the AWS web console. It is recommended to review the [Deployment through Helm](documentation/02-Deployment-Helm.md) guide to become familiar with Helm charts, services, and parameters.

Follow the post installation steps to start using eSignet services

* [Post Installation Procedure](documentation/03-Post-Installation-Procedure.md)

**Lastly, if you wish to clean up, run 'AWS CDK destroy' to remove all AWS resources that were created by it.**
```
cdk destroy [STACKS..]
```
