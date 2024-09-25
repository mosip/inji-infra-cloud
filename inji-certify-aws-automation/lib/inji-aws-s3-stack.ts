import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
//import * as cdk from '@aws-cdk/core';
//import * as s3 from '@aws-cdk/aws-s3';
import { Construct } from "constructs";
import { ConfigProps } from "./config";

export interface S3StackProps extends cdk.StackProps {
    config: ConfigProps;
   
}




export class BucketResourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const { config } = props;

    //The code that defines your stack goes here
    new s3.Bucket(this, 'inji-resource-bucket', {
      bucketName: config.S3_BUCKET_NAME,
      publicReadAccess: true,
       blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }
     // blockPublicAccess: BlockPublicAccess.BLOCK_ACLS
      //removalPolicy: cdk.RemovalPolicy.DESTROY

    });
 }
}
