import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface injiverifyhelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision INJI verify Helm
export class injiverifyhelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: injiverifyhelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;

        // injiverify
        new helm.HelmChart(this, "cdkinjiverifyhelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.injiverify.chartName,
            namespace: props.config.CHART_MAP.injiverify.namespace,
            createNamespace: true,
            release: "injiverify",
            wait: true,
            repository: repository,
            values: {
                alb: {
                    enabled: true,
                    name: props.config.INJI_VERIFY_LOADBALANCER.name,
                    host: props.config.INJI_VERIFY_LOADBALANCER.domain,
                    path: "/",
                    certificateArn: props.config.AWS_CERTIFICATE_ARN
                }
            }
        });


    }

}
