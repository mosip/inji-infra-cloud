import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface esignethelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision eSignet Helm
export class esignethelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: esignethelmStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;
        
        // esignet
        new helm.HelmChart(this, "cdkesignetthelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.esignet.chartName,
            namespace: props.config.CHART_MAP.esignet.namespace,
            createNamespace: true,
            release: "esignet",
            wait: true,
            repository: repository,
            values: {}
        });


    }

}