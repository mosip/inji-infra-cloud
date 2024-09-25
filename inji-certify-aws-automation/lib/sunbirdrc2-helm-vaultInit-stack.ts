import * as cdk from "aws-cdk-lib";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface helmvaultinitStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

export class helmvaultinitStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: helmvaultinitStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const vaultInitRepository = "https://dpgonaws.github.io/dpg-helm";
        const vaulInitVersion = "0.1.0";
        const namespace = props.config.NAMESPACE;
        const release = props.config.VAULTINIT_RELEASE_NAME;
        const chart = "vault-init";
        //const vaultName = `${props.config.VAULT_RELEASE_NAME}-vault`;
        const vaultName =props.config.VAULT_RELEASE_NAME;

        //perform vault init
        new helm.HelmChart(this, "cdkhelm", {
            cluster: eksCluster,
            chart: chart,
            namespace: namespace,
            createNamespace: true,
            release: release,
            version: vaulInitVersion,
            wait: true,
            repository: vaultInitRepository,
            values: {
                envVars: {
                    NAMESPACE: namespace,
                    VAULT_NAME: vaultName
                }
            },
        });
    }
}

