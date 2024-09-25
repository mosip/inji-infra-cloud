#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { StackProps } from "aws-cdk-lib";
import { ConfigProps, getConfig } from "../lib/config";

import { vpcStack } from "../lib/vpc-stack";
import { eksec2Stack } from "../lib/eks-ec2-stack";

import { mimotohelmStack } from "../lib/mimoto-helm-stack";
import { injiwebhelmStack } from "../lib/inji-web-helm-stack";
import { injiverifyhelmStack } from "../lib/inji-verify-helm-stack";


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
const infra = new vpcStack(app, "vpcstackinji", MY_AWS_ENV_STACK_PROPS);

// Provision target EKS with Fargate Cluster within the VPC
const eksCluster = new eksec2Stack(app, "eksec2stackinji", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra.vpc,
});


const mimotohelm = new mimotohelmStack(app, "mimotohelmStackinji", {
  env: {
   region: config.REGION,
   account: config.ACCOUNT,
 },

 config: config,
 eksCluster: eksCluster.eksCluster

});

const injiwebhelm = new injiwebhelmStack(app, "injiwebhelmStackinji", {
  env: {
   region: config.REGION,
   account: config.ACCOUNT,
 },

 config: config,
 eksCluster: eksCluster.eksCluster

});

injiwebhelm.addDependency(mimotohelm);


const injiverifyhelm = new injiverifyhelmStack(app, "injiverifyhelmStackinji", {
  env: {
   region: config.REGION,
   account: config.ACCOUNT,
 },

 config: config,
 eksCluster: eksCluster.eksCluster

});

injiverifyhelm.addDependency(injiwebhelm);
//new InjiAwsAutomationStack(app, 'InjiAwsAutomationStack');
