import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface mimotohelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision mimoto Helm
export class mimotohelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: mimotohelmStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;

        const s3BucketName = props.config.S3_BUCKET_NAME;
        // mimoto
        new helm.HelmChart(this, "cdkmimotohelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.mimoto.chartName,
            namespace: props.config.CHART_MAP.mimoto.namespace,
            createNamespace: true,
            release: "mimoto",
            wait: true,
            repository: repository,
            values: {
                config:
                {
                    mimotoConfigUrl: `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/mimoto-issuers-config.json`,
                    credentialTemplateUrl: `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/CredentialTemplate.html`,
                    keyFileUrl: `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/client-identity.p12`

                } 

            }
        });


    }

}