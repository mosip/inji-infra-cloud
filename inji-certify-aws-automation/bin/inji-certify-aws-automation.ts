#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InjiAwsAutomationStack } from '../lib/inji-aws-automation-stack';


import { StackProps } from "aws-cdk-lib";
import { ConfigProps, getConfig } from "../lib/config";

//AWS Stacks
import { BucketResourceStack } from "../lib/inji-aws-s3-stack";
import { vpcStack } from "../lib/vpc-stack";
import { rdsStack } from "../lib/rds-stack";
import { eksec2Stack } from "../lib/eks-ec2-stack";

import { helmvaultStack } from "../lib/sunbirdrc2-helm-vault-stack";
import { sunbirdrc2helmStack } from "../lib/sunbirdrc2-helm-stack";
import { helmvaultinitStack } from "../lib/sunbirdrc2-helm-vaultInit-stack";

import { mosipcommonhelmStack } from '../lib/esignet-mosipcommon-helm-stack';
import { esignetbootstraphelmStack } from '../lib/esignetbootstrap-helm-stack';
import { keycloakhelmStack } from '../lib/esignet-keycloak-helm-stack';
import { keycloakinithelmStack } from '../lib/esignet-keycloakinit-helm-stack';
import { postgresinithelmStack } from '../lib/esignet-postgresinit-helm-stack';
import { esignetinithelmStack } from '../lib/esignetinit-helm-stack';
import { esignethelmStack } from '../lib/esignet-helm-stack';
import { oidcuihelmStack } from '../lib/esignet-oidcui-helm-stack';

const config = getConfig();
const app = new cdk.App();

type AwsEnvStackProps = StackProps & {
  config: ConfigProps;
};

const MY_AWS_ENV_STACK_PROPS: AwsEnvStackProps = {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
};

// Provision required VPC network & subnets
const storage = new BucketResourceStack(app, "s3stackinji", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT
  },
  config: config
});

// Provision target RDS data store
// const rds = new rdsStack(app, "rdsstackinji", {
//   env: {
//     region: config.REGION,
//     account: config.ACCOUNT,
//   },
//   config: config,
//   vpc: infra.vpc,
//   rdsuser: config.RDS_USER,
//   rdspassword: config.RDS_PASSWORD,
// });





// Provision required VPC network & subnets
const infra = new vpcStack(app, "vpcstackinji", MY_AWS_ENV_STACK_PROPS);

// // Provision target RDS data store
 const rds = new rdsStack(app, "rdsstackinji", {
   env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
   config: config,
   vpc: infra.vpc,
   rdsuser: config.RDS_USER,
   rdspassword: config.RDS_PASSWORD,
 });

// Provision target EKS with Fargate Cluster within the VPC
const eksCluster = new eksec2Stack(app, "eksec2stackinji", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra.vpc,
});

/* SUNBIRD RC HELM STACK*/

const vaultHHelm = new helmvaultStack(app, "vaulthelmstacksbrc2", {
  env: {
      region: config.REGION,
      account: config.ACCOUNT,
  },
  config: config,
  eksCluster: eksCluster.eksCluster

});

// Run HELM charts for the Vault init applications in the provisioned EKS cluster
const vaultInitHelm = new helmvaultinitStack(app, "vaultinithelmstacksbrc2", {
  env: {
      region: config.REGION,
      account: config.ACCOUNT,
  },
  config: config,
  eksCluster: eksCluster.eksCluster

});


//add dependency on Vault Helm
vaultInitHelm.addDependency(vaultHHelm);


// Run HELM charts for the RC2 applications in the provisioned EKS cluster
const sunbirdRCHelm = new sunbirdrc2helmStack(app, "sunbirdrc2helmStacksbrc2", {
  env: {
      region: config.REGION,
      account: config.ACCOUNT,
  },
  config: config,
  vpc: infra.vpc,
  rdssecret: rds.rdsSecret,
  rdsHost: rds.rdsHost,
  RDS_PASSWORD: config.RDS_PASSWORD,
  RDS_USER: config.RDS_USER,
  eksCluster: eksCluster.eksCluster,
  moduleChoice: 'RC',
  chartName: "sunbird_rc_charts",
  signatureProviderName: "dev.sunbirdrc.registry.service.impl.SignatureV2ServiceImpl",

});


//add dependency on Vault Helm
sunbirdRCHelm.addDependency(vaultInitHelm);

/* ESIGNET HELM STACK */

// Run HELM charts for the RC2 applications in the provisioned EKS cluster
const mosipCommonHelm = new mosipcommonhelmStack(app, "mosipcommonhelmStackesignetdemo", {
  env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
   config: config,
   eksCluster: eksCluster.eksCluster
 
 });
 
 
 const esignetbootstraphelm = new esignetbootstraphelmStack(app, "esignetbootstraphelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   rdsHost: rds.rdsHost,
   RDS_PASSWORD: config.RDS_PASSWORD,
   RDS_USER: config.RDS_USER,
   eksCluster: eksCluster.eksCluster
 
 });
 
 esignetbootstraphelm.addDependency(mosipCommonHelm);
 
 const keycloakhelm = new keycloakhelmStack(app, "keycloakhelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   rdsHost: rds.rdsHost,
   RDS_PASSWORD: config.RDS_PASSWORD,
   RDS_USER: config.RDS_USER,
   eksCluster: eksCluster.eksCluster
 
 });
 
 keycloakhelm.addDependency(esignetbootstraphelm);
 
 
 const keycloakinithelm = new keycloakinithelmStack(app, "keycloakinithelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   eksCluster: eksCluster.eksCluster
 
 });
 
 keycloakinithelm.addDependency(keycloakhelm);
 
 const postgresinithelm = new postgresinithelmStack(app, "postgresinithelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   rdsHost: rds.rdsHost,
   RDS_PASSWORD: config.RDS_PASSWORD,
   eksCluster: eksCluster.eksCluster
 
 });
 
 postgresinithelm.addDependency(keycloakinithelm);
 
 const esignetinithelm = new esignetinithelmStack(app, "esignetinithelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   rdsHost: rds.rdsHost,
   RDS_PASSWORD: config.RDS_PASSWORD,
   RDS_USER: config.RDS_USER,
   eksCluster: eksCluster.eksCluster
 
 });
 
 esignetinithelm.addDependency(postgresinithelm);
 
 const esignetthelm = new esignethelmStack(app, "esignethelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   eksCluster: eksCluster.eksCluster
 
 });
 
 esignetthelm.addDependency(esignetinithelm);
 
 const oidcuihelm = new oidcuihelmStack(app, "oidcuihelmStackesignetdemo", {
    env: {
     region: config.REGION,
     account: config.ACCOUNT,
   },
 
   config: config,
   eksCluster: eksCluster.eksCluster
 
 });
 
 oidcuihelm.addDependency(esignetthelm);
 
