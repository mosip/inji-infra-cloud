import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface sunbirdrc2helmStackProps extends cdk.StackProps {
    config: ConfigProps;
    vpc: ec2.Vpc;
    rdssecret: string;
    eksCluster: eks.Cluster;
    rdsHost: string;
    RDS_PASSWORD: string;
    RDS_USER: string;
    moduleChoice: string;
    chartName: string;
    signatureProviderName: string;
}

// provision SunBird RC Helm
export class sunbirdrc2helmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: sunbirdrc2helmStackProps) {
        super(scope, id, props);

        const vpc = props.vpc;
        const eksCluster = props.eksCluster;
        const rdssecretARN = props.rdssecret;
        const RDS_PASSWORD = props.RDS_PASSWORD;
        const chartNmae = props.chartName;
        const signatureProviderName = props.signatureProviderName;
        const releaseName = props.config.RC_RELEASE_NAME;
        const credentialingVaultReleaseName = props.config.VAULT_RELEASE_NAME;

        const secretName = sm.Secret.fromSecretAttributes(this, "ImportedSecret", {
            secretCompleteArn: rdssecretARN,
        });
        const getValueFromSecret = (secret: ISecret, key: string): string => {
            return secret.secretValueFromJson(key).unsafeUnwrap();
        };
        const dbPass = getValueFromSecret(secretName, "password");

        const base64encodedDBpass = cdk.Fn.base64(RDS_PASSWORD);

        const chart = props.config.CHART;
        const repository = props.config.REPOSITORY;
        const namespace = props.config.NAMESPACE;
        const rdsHost = props.rdsHost;
        const rdsuser = props.RDS_USER;
        const dbName = "registry";
        const logLevel = "DEBUG";
        const credentialDBName = "sunbirdrc";

        const dbURL = `postgres://${rdsuser}:${RDS_PASSWORD}@${rdsHost}:5432/${credentialDBName}`;
        const base64encodedDBURL = cdk.Fn.base64(dbURL);

        const s3BucketName = props.config.S3_BUCKET_NAME;

        new helm.HelmChart(this, "cdksbrc2helm", {
            cluster: eksCluster,
            chart: chart,
            namespace: namespace,
            createNamespace: true,
            release: releaseName,
            wait: true,
            repository: repository,
            values: {
                global: {
                    alb:
                    {
                        name: props.config.SBRC_LOADBALANCER.name,
                        certificateArn: props.config.AWS_CERTIFICATE_ARN,
                        registryHost: props.config.REGISTRY_HOST_NAME,
                        credentialHost: props.config.CREDENTIAL_HOST_NAME,
                        schemaHost: props.config.SCHEMA_HOST_NAME,
                        identityHost: props.config.IDENTITY_HOST_NAME,
			            health: "/health" 
                    },
                    database:
                    {
                        host: rdsHost,
                        user: rdsuser
                    },
                    vault:
                    {
                        address: `http://${credentialingVaultReleaseName}:8200`, //TBC post deployment
                        base_url: `http://${credentialingVaultReleaseName}:8200/v1`,
                        root_path: `http://${credentialingVaultReleaseName}:8200/v1/kv`                       
                    },
                    secrets:
                    {
                        DB_PASSWORD: base64encodedDBpass,
                        DB_URL: base64encodedDBURL
                    }
                },
                "identity-service" : {
                    web_did_base_url: `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/`

                }
            }
        });




    }


}
