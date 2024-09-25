
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29'
import { CfnAutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";



export interface EksEC2StackProps extends cdk.StackProps {
    config: ConfigProps;
    vpc: ec2.Vpc;
}

export class eksec2Stack extends cdk.Stack {
    public readonly eksCluster: eks.Cluster;
    constructor(scope: Construct, id: string, props: EksEC2StackProps) {
        super(scope, id, props);
        const vpc = props.vpc;
        const cidr = props.config.CIDR;
        //const ROLE_ARN = props.config.ROLE_ARN;
        const EKS_CLUSTER_NAME = props.config.EKS_CLUSTER_NAME;

        const securityGroupEKS = new ec2.SecurityGroup(this, "EKSSecurityGroup", {
            vpc: vpc,
            allowAllOutbound: true,
            description: "Security group for EKS",
        });

        securityGroupEKS.addIngressRule(
            ec2.Peer.ipv4(cidr),
            ec2.Port.allTraffic(),
            "Allow EKS traffic"
        );


        const principal = new iam.WebIdentityPrincipal('cognito-identity.amazonaws.com', {
            'StringEquals': { 'cognito-identity.amazonaws.com:aud': 'us-east-2:12345678-abcd-abcd-abcd-123456' },
            'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'unauthenticated' },
        });

        const iamRole = iam.Role.fromRoleArn(this, "MyIAMRole", ROLE_ARN);

        const readonlyRole = new iam.Role(this, "ReadOnlyRole", {
            assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        });

        readonlyRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess")
        );


        this.eksCluster = new eks.Cluster(this, "eksec2Cluster", {
            vpc: vpc,
            vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
            defaultCapacity: 10,
            defaultCapacityInstance: new ec2.InstanceType("t2.medium"),
            kubectlLayer: new KubectlV29Layer(this, "kubectl"),
            version: eks.KubernetesVersion.V1_29,
            securityGroup: securityGroupEKS,
            endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            ipFamily: eks.IpFamily.IP_V4,
            clusterName: EKS_CLUSTER_NAME,
            mastersRole: iamRole,
            outputClusterName: true,
            outputConfigCommand: true,

            albController: {
                version: eks.AlbControllerVersion.V2_5_1,
                repository: "public.ecr.aws/eks/aws-load-balancer-controller",
            },

        });

        const key1 = this.eksCluster.openIdConnectProvider.openIdConnectProviderIssuer;

        const stringEquals = new cdk.CfnJson(this, 'ConditionJson', {
            value: {
                [`${key1}:sub`]: `system:serviceaccount:kube-system:ebs-csi-controller-sa`,
                [`${key1}:aud`]: `sts.amazonaws.com`
            },
        });

        // Define an IAM Role
        const oidcEKSCSIRole = new iam.Role(this, "OIDCRole", {
            assumedBy: new iam.FederatedPrincipal(
                `arn:aws:iam::${this.account}:oidc-provider/${this.eksCluster.clusterOpenIdConnectIssuer}`,
                {
                    StringEquals: stringEquals,

                },
                "sts:AssumeRoleWithWebIdentity"
            ),
        });

        // Attach a managed policy to the role
        oidcEKSCSIRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonEBSCSIDriverPolicy"))
        //ebs_csi_addon_role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonEBSCSIDriverPolicy"))

        const ebscsi = new eks.CfnAddon(this, "addonEbsCsi",
            {
                addonName: "aws-ebs-csi-driver",
                clusterName: this.eksCluster.clusterName,
                serviceAccountRoleArn: oidcEKSCSIRole.roleArn
            }
        );

        /*
                // Define the service account
                const serviceAccount = this.eksCluster.addServiceAccount('ebscsiServiceAccount', {
                    name: "ebs-csi-controller-sa-rc2",
                    namespace: "kube-system",
                    annotations: {
                        "eks.amazonaws.com/role-arn": oidcEKSCSIRole.roleArn,
                    }
                });*/

        /*
        this.eksCluster.addNodegroupCapacity("custom-node-group", {
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            instanceTypes: [new ec2.InstanceType("t2.small")],
            desiredSize: 3,
            diskSize: 20,
            nodeRole: new iam.Role(this, "eksClusterNodeGroupRole", {
                roleName: "eksClusterNodeGroupRole",
                assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
                    iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
                    iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy"),
                ],
            }),
        });
*/

        /*
                // Managed Addon: kube-proxy
                const kubeProxy = new eks.CfnAddon(this, "addonKubeProxy", {
                    addonName: "kube-proxy",
                    clusterName: this.eksCluster.clusterName,
                });
        
                // Managed Addon: coredns
                const coreDns = new eks.CfnAddon(this, "addonCoreDns", {
                    addonName: "coredns",
                    clusterName: this.eksCluster.clusterName,
                });
        
                // Managed Addon: vpc-cni
                const vpcCni = new eks.CfnAddon(this, "addonVpcCni", {
                    addonName: "vpc-cni",
                    clusterName: this.eksCluster.clusterName,
                });
        */




        /*
                      
        ebs_csi_addon_role = iam.Role(
            self,
            'EbsCsiAddonRole',
            # for Role's Trust relationships
            assumed_by=iam.FederatedPrincipal(
                federated=oidc_provider_arn,
                conditions={
                    'StringEquals': {
                        f'{oidc_provider_url.replace("https://", "")}:sub': 'system:serviceaccount:kube-system:ebs-csi-controller-sa-rc2'
                    }
                },
                assume_role_action='sts:AssumeRoleWithWebIdentity'
            )
        )*/





        new cdk.CfnOutput(this, String("OIDC-issuer"), {
            value: this.eksCluster.clusterOpenIdConnectIssuer,
        });

        new cdk.CfnOutput(this, String("OIDC-issuerURL"), {
            value: this.eksCluster.clusterOpenIdConnectIssuerUrl,
        });


        new cdk.CfnOutput(this, "EKS Cluster Name", {
            value: this.eksCluster.clusterName,
        });
        new cdk.CfnOutput(this, "EKS Cluster Arn", {
            value: this.eksCluster.clusterArn,
        });


    }
}