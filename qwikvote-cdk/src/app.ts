#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { AWS_ACCOUNT_ID, AWS_REGION } from "./configuration/application";
import { VotingServiceStack } from "./stacks/voting-service-stack";

const app = new cdk.App();

new VotingServiceStack(app, "qwikvote-alpha", {
    env: {
        account: AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
        region: AWS_REGION,
    },
});
