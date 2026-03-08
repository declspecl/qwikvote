import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WebsiteStackProps extends cdk.StackProps {
}

export class WebsiteStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: WebsiteStackProps) {
        super(scope, id, props);

        const websiteBucket = new s3.Bucket(this, "QwikvoteWebsiteBucket", {
            bucketName: `qwikvote-website-${id}`.toLowerCase(),
            websiteIndexDocument: "index.html",
            websiteErrorDocument: "index.html",
            publicReadAccess: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                ignorePublicAcls: false,
                blockPublicPolicy: false,
                restrictPublicBuckets: false,
            }),
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        const websiteRoot = path.resolve(__dirname, "../../../qwikvote-website/dist");

        new s3deploy.BucketDeployment(this, "QwikvoteWebsiteDeployment", {
            sources: [s3deploy.Source.asset(websiteRoot)],
            destinationBucket: websiteBucket,
        });

        new cdk.CfnOutput(this, "WebsiteUrl", {
            value: websiteBucket.bucketWebsiteUrl,
            description: "QwikVote website URL",
            exportName: `${id}-WebsiteUrl`,
        });
    }
}
