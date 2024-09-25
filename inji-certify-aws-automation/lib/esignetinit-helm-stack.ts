import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface esignetinithelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
    rdsHost: string;
    RDS_PASSWORD: string;
    RDS_USER: string;

}

// provision ESignet Init Helm
export class esignetinithelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: esignetinithelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const RDS_PASSWORD = props.RDS_PASSWORD;
       
        const repository = props.config.REPOSITORY;
        const rdsHost = props.rdsHost;
        const rdsuser = props.RDS_USER;

        // esignet-init
        new helm.HelmChart(this, "cdkesignet-inithelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.esignetInit.chartName,
            namespace: props.config.CHART_MAP.esignetInit.namespace,
            createNamespace: true,
            release: "esignet-init",
            wait: true,
            repository: repository,
            values:{
                image:{
                    envVars:{
                        DB_HOSTNAME: rdsHost,
                        DB_USERNAME: rdsuser,
                        DB_PASSWORD: RDS_PASSWORD,
                        DB_PORT: 5432,
                        AWS_KAFKA_ARN: "kafka-0.kafka-headless.${kafka.profile}:${kafka.port}",
			            SBRC_RELEASE: props.config.SBRC_RELEASE,
			            SBRC_NAMESPACE: props.config.SBRC_NAMESPACE,
		                SBRC_DID: props.config.SBRC_DID,
			            SBRC_SCHEMA_ID:	props.config.SBRC_SCHEMA_ID
                    }
                }
            }
        });


    }

}
