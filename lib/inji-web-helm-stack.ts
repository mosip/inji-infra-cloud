import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface injiwebhelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision INJI Web Helm
export class injiwebhelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: injiwebhelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;

        // injiweb
        new helm.HelmChart(this, "cdkinjiwebhelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.injiweb.chartName,
            namespace: props.config.CHART_MAP.injiweb.namespace,
            createNamespace: true,
            release: "injiweb",
            wait: true,
            repository: repository,
            values: {
                alb: {
                    enabled: true,
                    name: props.config.INJI_WEB_LOADBALANCER.name,
                    host: props.config.INJI_WEB_LOADBALANCER.domain,
                    path: "/",
                    certificateArn: props.config.AWS_CERTIFICATE_ARN
                }


            }
        });


    }

}
