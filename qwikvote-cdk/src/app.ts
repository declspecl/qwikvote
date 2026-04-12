#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { AWS_ACCOUNT_ID, AWS_REGION } from "./configuration/application";
import { GitHubActionsStack } from "./stacks/github-actions-stack";
import { VotingServiceStack } from "./stacks/voting-service-stack";
import { WebsiteStack } from "./stacks/website-stack";

const app = new cdk.App();

const env = {
    account: AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
    region: AWS_REGION,
};

new GitHubActionsStack(app, "qwikvote-github-actions", { env });

new VotingServiceStack(app, "qwikvote-alpha", { env });

new WebsiteStack(app, "qwikvote-website-alpha", { env });
