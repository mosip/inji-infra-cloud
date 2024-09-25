import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface ChartMap {
  chartName: string;
  namespace: string;
}

interface MapCollection {
  [key: string]: ChartMap;
}
interface loadbalancer{
  name: string;
  domain: string;
}

export type ConfigProps = {
  REGION: string;
  ACCOUNT: string;
  CIDR: string;
  MAX_AZS: number;
 // CHART: string;
  REPOSITORY: string;
  //NAMESPACE: string;
  RDS_USER: string;
  RDS_PASSWORD: string;
  RDS_SEC_GRP_INGRESS: string;
  RELEASE: string;  
  //ROLE_ARN: string;
  EKS_CLUSTER_NAME: string;
  CHART_MAP: MapCollection;
  DOMAIN: String;
  AWS_CERTIFICATE_ARN: string; 
  S3_BUCKET_NAME: string;
  //esignet config
  KEYCLOAK_LOADBALANCER: loadbalancer;
  OIDC_LOADBALANCER: loadbalancer;
  SBRC_RELEASE: string;
  SBRC_NAMESPACE: string;
  SBRC_DID: string;
  SBRC_SCHEMA_ID: string;
  //sunbird rc config
  CHART: string,
  NAMESPACE: string;
  VAULT_RELEASE_NAME: string,
  VAULTINIT_RELEASE_NAME: string,
  RC_RELEASE_NAME: string;
  SBRC_LOADBALANCER: loadbalancer;
  REGISTRY_HOST_NAME: string;
  CREDENTIAL_HOST_NAME: string;
  SCHEMA_HOST_NAME: string;
  IDENTITY_HOST_NAME: string;
};

// configuration values 
export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "ap-south-1",
  ACCOUNT: process.env.ACCOUNT || "",
  CIDR: process.env.CIDR || "",
  MAX_AZS: Number(process.env.MAZ_AZs) || 2,
 // CHART: "sunbird_rc_charts",
  REPOSITORY: "https://dpgonaws.github.io/dpg-helm",
 // NAMESPACE: "mimoto",
  RDS_USER: process.env.RDS_USER || "postgres",
  RDS_PASSWORD: process.env.RDS_PASSWORD || "",
  RDS_SEC_GRP_INGRESS: process.env.CIDR || "",
  RELEASE: "inji-certify",
  //ROLE_ARN: process.env.ROLE_ARN || "",
  EKS_CLUSTER_NAME: process.env.EKS_CLUSTER_NAME || "ekscluster-inji",
  CHART_MAP: {
   //esignet-config
    softhsm : { chartName: "softhsm", namespace: "softhsm" },
    artifactory : { chartName: "artifactory", namespace: "artifactory" },
    kafka : { chartName: "kafka", namespace: "kafka" },
    kafkaUI : { chartName: "kafka-ui", namespace: "kafka" },
    keycloak : { chartName: "keycloak", namespace: "keycloak" },
    keycloakInit : { chartName: "keycloak-init", namespace: "keycloak" },
    postgresInit : { chartName: "postgres-init", namespace: "esignet" },
    esignetBootstrap : { chartName: "esignet-boostrap", namespace: "esignet" },
    esignetInit : { chartName: "esignet-init-inji", namespace: "esignet" },
    esignet : { chartName: "esignet", namespace: "esignet" },
    oidcUI : { chartName: "oidc-ui", namespace: "esignet" }
  },
  DOMAIN: process.env.DOMAIN || "sandbox.demodpgs.net",
  AWS_CERTIFICATE_ARN: process.env.CERTIFICATE_ARN || "arn:aws:acm:ap-south-1:370803901956:certificate/6064b56f-1367-4dc4-9a42-290bd724479a",
 
  S3_BUCKET_NAME: "inji-resources",
  //esignet config
  KEYCLOAK_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "inji-ceritfy-alb",
    domain: "iamesignet." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  },
  OIDC_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "inji-ceritfy-alb",
    domain: "oidc." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  },
  SBRC_RELEASE: process.env.SBRC_RELEASE || "sbrc",
  SBRC_NAMESPACE: process.env.SBRC_NAMESPACE || "sbrc",
  SBRC_DID: process.env.SBRC_DID || "",
  SBRC_SCHEMA_ID: process.env.SBRC_SCHEMA_ID || "",
  //sunbird rc config
  CHART: "inji_sunbird_rc_charts",
  NAMESPACE: "sbrc",
  VAULT_RELEASE_NAME: "vault",
  VAULTINIT_RELEASE_NAME: "vault-init",
  RC_RELEASE_NAME: "sunbird-rc",
  SBRC_LOADBALANCER:{
    name: process.env.LOADBALANCER_NAME || "inji-ceritfy-alb",
    domain: ""
  },
  REGISTRY_HOST_NAME: "registry." +  process.env.DOMAIN || "sandbox.demodpgs.net",
  CREDENTIAL_HOST_NAME: "credentials." +  process.env.DOMAIN || "sandbox.demodpgs.net",
  SCHEMA_HOST_NAME: "schema." +  process.env.DOMAIN || "sandbox.demodpgs.net",
  IDENTITY_HOST_NAME: "identity." +  process.env.DOMAIN || "sandbox.demodpgs.net"
});
