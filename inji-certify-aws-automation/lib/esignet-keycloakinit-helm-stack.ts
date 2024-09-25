import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface keycloakinithelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision Keycloak Init Helm
export class keycloakinithelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: keycloakinithelmStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;

        //Keycloak Init
        new helm.HelmChart(this, "cdkkeycloak-inithelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.keycloakInit.chartName,
            namespace: props.config.CHART_MAP.keycloakInit.namespace,
            createNamespace: true,
            release: "keycloak-init",
            wait: true,
            repository: repository,
            values: {}
        });


    }

}