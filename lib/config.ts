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
  INJI_WEB_LOADBALANCER: loadbalancer;
  INJI_VERIFY_LOADBALANCER: loadbalancer;
  S3_BUCKET_NAME: string;
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
  RELEASE: "inji",
  //ROLE_ARN: process.env.ROLE_ARN || "",
  EKS_CLUSTER_NAME: process.env.EKS_CLUSTER_NAME || "ekscluster-inji",
  CHART_MAP: {
    mimoto : { chartName: "mimoto", namespace: "mimoto" },
    injiweb : { chartName: "inji-web", namespace: "mimoto" },
    injiverify : { chartName: "inji-verify", namespace: "mimoto" },
    //esignet-config
    softhsm : { chartName: "softhsm", namespace: "softhsm" },
    artifactory : { chartName: "artifactory", namespace: "artifactory" },
    kafka : { chartName: "kafka", namespace: "kafka" },
    kafkaUI : { chartName: "kafka-ui", namespace: "kafka" },
    keycloak : { chartName: "keycloak", namespace: "keycloak" },
    keycloakInit : { chartName: "keycloak-init", namespace: "keycloak" },
    postgresInit : { chartName: "postgres-init", namespace: "esignet" },
    esignetBootstrap : { chartName: "esignet-preinit", namespace: "esignet" },
    esignetInit : { chartName: "esignet-init-inji", namespace: "esignet" },
    esignet : { chartName: "esignet", namespace: "esignet" },
    oidcUI : { chartName: "oidc-ui", namespace: "esignet" }
  },
  DOMAIN: process.env.DOMAIN || "sandbox.demodpgs.net",
  AWS_CERTIFICATE_ARN: process.env.CERTIFICATE_ARN || "arn:aws:acm:ap-south-1:370803901956:certificate/6064b56f-1367-4dc4-9a42-290bd724479a",
  INJI_WEB_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "inji-demo",
    domain: "inji-web." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  },
  INJI_VERIFY_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "inji-demo",
    domain: "inji-verify." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  },
  S3_BUCKET_NAME: "inji-resources"
  
});
