import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as msk from 'aws-cdk-lib/aws-msk';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';

interface MskStackProps extends cdk.StackProps {
  vpcId: string;
  publicSubnetIds: string[];
}

export class MskServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MskStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      vpcId: props.vpcId,
    });

    const publicSubnets = props.publicSubnetIds.map(subnetId =>
      ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
    );


    const mskSecurityGroup = new ec2.SecurityGroup(this, 'MSKSecurityGroup', {
      vpc,
      description: 'Security group for MSK Serverless cluster with ports 9092 and 9093 open to the world',
      allowAllOutbound: true,
    });

    mskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9092), 'Allow Kafka TCP traffic on port 9092');
    mskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9093), 'Allow Kafka TCP traffic on port 9093');

    const kmsKey = new kms.Key(this, 'MskKmsKey', {
      description: 'KMS key for encrypting MSK data at rest',
    });

    const cluster = new msk.CfnServerlessCluster(this, 'MyMskServerlessCluster', {
      clusterName: 'my-msk-serverless-cluster',
      vpcConfigs: [{
        subnetIds: publicSubnets.map(subnet => subnet.subnetId),
        securityGroups: [mskSecurityGroup.securityGroupId],
      }],
      clientAuthentication: {
        sasl: {
          iam: {
            enabled: true,
          },
        },
      },
      encryptionInfo: {
        encryptionInTransit: {
          clientBroker: 'PLAINTEXT',
          inCluster: true,
        },
        encryptionAtRest: {
          dataVolumeKmsKeyId: kmsKey.keyId,
        },
      },
    });

    new cdk.CfnOutput(this, 'MskServerlessClusterArn', {
      value: cluster.attrArn,
    });
  }
}

const app = new cdk.App();
new MskServerlessStack(app, 'MskServerlessStack', {
  vpcId: 'vpc-xxxxxxxx',
  publicSubnetIds: ['subnet-xxxxxxx1', 'subnet-xxxxxxx2'],
});
app.synth();
