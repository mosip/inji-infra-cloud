import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface keycloakhelmStackProps extends cdk.StackProps {
    config: ConfigProps;   
    eksCluster: eks.Cluster;
    rdsHost: string;
    RDS_PASSWORD: string;
    RDS_USER: string;

}

// provision Keycloak Helm
export class keycloakhelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: keycloakhelmStackProps) {
        super(scope, id, props);
        
        const eksCluster = props.eksCluster;
        const RDS_PASSWORD = props.RDS_PASSWORD;
        const repository = props.config.REPOSITORY;
        const rdsHost = props.rdsHost;
        const rdsuser = props.RDS_USER;

       // keycloak
       new helm.HelmChart(this, "cdkkeycloakhelm", {
        cluster: eksCluster,
        chart: props.config.CHART_MAP.keycloak.chartName,
        namespace: props.config.CHART_MAP.keycloak.namespace,
        createNamespace: true,
        release: "keycloak",
        wait: true,
        repository: repository,
        values: {
            alb: {
                enabled: true,
                name: props.config.KEYCLOAK_LOADBALANCER.name,
                host: props.config.KEYCLOAK_LOADBALANCER.domain,
                path: "/auth",
                certificateArn: props.config.AWS_CERTIFICATE_ARN
            },
            externalDatabase: {
                host: rdsHost,
                port: 5432,
                user: rdsuser,
                database: "esignet_keycloak",
                password: RDS_PASSWORD
            }

        }

    });

    }

}
