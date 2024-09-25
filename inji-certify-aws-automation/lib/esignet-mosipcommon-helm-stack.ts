import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as helm from "aws-cdk-lib/aws-eks";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface mosipcommonhelmStackProps extends cdk.StackProps {
    config: ConfigProps;
    eksCluster: eks.Cluster;
}

// provision Mosip Common Helm
export class mosipcommonhelmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: mosipcommonhelmStackProps) {
        super(scope, id, props);
        const eksCluster = props.eksCluster;
        const repository = props.config.REPOSITORY;
        
        // softhsm
        new helm.HelmChart(this, "cdksofthsmhelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.softhsm.chartName,
            namespace: props.config.CHART_MAP.softhsm.namespace,
            createNamespace: true,
            release: "softhsm",
            wait: true,
            repository: repository,
            values: {

            }

        });

        // artifactory server
        new helm.HelmChart(this, "cdkartifactoryserverhelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.artifactory.chartName,
            namespace: props.config.CHART_MAP.artifactory.namespace,
            createNamespace: true,
            release: "artifactory",
            wait: true,
            repository: repository,
            values: {
		    inji:{
			    enabled: true
		    }
		
		  
//		assets: {
//		  url: "https://raw.githubusercontent.com/tejash-jl/DID-Resolve/main/esignet-i18n-bundle.zip"
//		 }
            }

        });

         // kafka server
         new helm.HelmChart(this, "cdkkafkaserverhelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.kafka.chartName,
            namespace: props.config.CHART_MAP.kafka.namespace,
            createNamespace: true,
            release: "kafka",
            wait: true,
            repository: repository,
            values: {

            }

        });

          // kafka UI
          new helm.HelmChart(this, "cdkkafkauihelm", {
            cluster: eksCluster,
            chart: props.config.CHART_MAP.kafkaUI.chartName,
            namespace: props.config.CHART_MAP.kafkaUI.namespace,
            createNamespace: true,
            release: "kafka-ui",
            wait: true,
            repository: repository,
            values: {

            }

        });
    }

}
