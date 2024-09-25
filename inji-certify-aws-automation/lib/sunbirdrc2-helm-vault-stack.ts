import * as cdk from "aws-cdk-lib";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface helmvaultStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
    
}

export class helmvaultStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: helmvaultStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const vaultRepository = "https://helm.releases.hashicorp.com/";
        const vaultVersion = "0.24.0";
        const namespace = props.config.NAMESPACE;
        const vaultReleaseName = props.config.VAULT_RELEASE_NAME;

        //create vault
        new helm.HelmChart(this, "cdkhelm", {
            cluster: eksCluster,
            chart: "vault",
            namespace: namespace,
            createNamespace: true,
            release: vaultReleaseName,
            version: vaultVersion,
            wait: false,
            repository: vaultRepository,
            values: {
                global: {
                    enabled: true,
                    namespace: namespace
                },
                server: {
                    affinity: "",
                    ha: {
                        enabled: false,
                        raft: {
                            enabled: false,
                            setNodeId: true,
                            config: "cluster_name = \"vault-integrated-storage\"\nstorage \"raft\" {\n   path    = \"/vault/data/\"\n}\n\nlistener \"tcp\" {\n   address = \"[::]:8200\"\n   cluster_address = \"[::]:8201\"\n   tls_disable = \"true\"\n}\nservice_registration \"kubernetes\" {}\n"
                        }
                    }
                },
            },
            // values: {
            //     global: {
            //         namespace: namespace
            //     },
            //     server: {
            //         affinity: "",
            //         ha: {
            //             enabled: true,
            //             raft: {
            //                 enabled: true,
            //                 setNodeId: true,
            //                 config: "cluster_name = \"vault-integrated-storage\"\nstorage \"raft\" {\n   path    = \"/vault/data/\"\n}\n\nlistener \"tcp\" {\n   address = \"[::]:8200\"\n   cluster_address = \"[::]:8201\"\n   tls_disable = \"true\"\n}\nservice_registration \"kubernetes\" {}\n"
            //             }
            //         }
            //     },
            // },
        });
    }

}