import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface oidcuihelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision OIDC UI Helm
export class oidcuihelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: oidcuihelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;

        // oidcui
        new helm.HelmChart(this, "cdkoidcuithelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.oidcUI.chartName,
            namespace: props.config.CHART_MAP.oidcUI.namespace,
            createNamespace: true,
            release: "oidc-ui",
            wait: true,
            repository: repository,
            //oidc-ui
            values: {
                alb: {
                    enabled: true,
                    name: props.config.OIDC_LOADBALANCER.name,
                    host: props.config.OIDC_LOADBALANCER.domain,
                    path: "/",
                    certificateArn: props.config.AWS_CERTIFICATE_ARN
                }


            }
        });


    }

}
