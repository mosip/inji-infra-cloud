import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface postgresinithelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
    rdsHost: string;
    RDS_PASSWORD: string;

}

// provision Postgres Init Helm
export class postgresinithelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: postgresinithelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const RDS_PASSWORD = props.RDS_PASSWORD;
        const repository = props.config.REPOSITORY;
        const rdsHost = props.rdsHost;

        // postgres-init
        new helm.HelmChart(this, "cdkpostgre-inithelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.postgresInit.chartName,
            namespace: props.config.CHART_MAP.postgresInit.namespace,
            createNamespace: true,
            release: "postgres-init",
            wait: true,
            repository: repository,
            values: {
                dbUserPasswords: {
                    dbuserPassword: RDS_PASSWORD
                },
                databases: {
                    mosip_esignet: {
                        enabled: true,
                        host: rdsHost,
                        port: 5432
                    }
                }
            }
        });


    }

}
