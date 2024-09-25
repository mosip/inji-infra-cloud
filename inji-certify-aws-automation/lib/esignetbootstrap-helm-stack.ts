import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface esignetbootstraphelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
    rdsHost: string;
    RDS_PASSWORD: string;
    RDS_USER: string;

}

// provision Esignet Bootstrap Helm
export class esignetbootstraphelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: esignetbootstraphelmStackProps) {
        super(scope, id, props);

        const eksCluster = props.eksCluster;
        const RDS_PASSWORD = props.RDS_PASSWORD;
        const base64encodedDBpass = cdk.Fn.base64(RDS_PASSWORD);

        const repository = props.config.REPOSITORY;
        const rdsHost = props.rdsHost;
        const rdsuser = props.RDS_USER;
       
        // esignet-preinit
        new helm.HelmChart(this, "cdkesignet-preinithelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.esignetBootstrap.chartName,
            namespace: props.config.CHART_MAP.esignetBootstrap.namespace,
            createNamespace: true,
            release: "esignet-preinit",
            wait: true,
            repository: repository,
            values: {
                image: {
                    envVars: {
                        HOST: rdsHost,
                        USERNAME: rdsuser,
                        PASSWORD: RDS_PASSWORD,
                        NEW_DB: "esignet_keycloak"
                    }
                },
                dbPassword: base64encodedDBpass,
                domain:{
                    name: props.config.DOMAIN,
                    mosipApiHost:  "api",
                    mosipMinioHost: "minio",
                    mosipApiInternalHost: "api-internal",
                    mosipIamExternalHost: "iamesignet",
                    mosipEsignetHost: "oidc"

                }
            }

        });


    }

}