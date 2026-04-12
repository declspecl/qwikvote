import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

const GITHUB_REPOSITORY = "declspecl/qwikvote";
const GITHUB_BRANCH = "main";

export class GitHubActionsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const provider = new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
            url: "https://token.actions.githubusercontent.com",
            clientIds: ["sts.amazonaws.com"],
        });

        const deployRole = new iam.Role(this, "GitHubActionsDeployRole", {
            roleName: "qwikvote-github-actions-deploy",
            description: `GitHub Actions deploy role for ${GITHUB_REPOSITORY} on ${GITHUB_BRANCH}`,
            assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
                StringEquals: {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                },
                StringLike: {
                    "token.actions.githubusercontent.com:sub":
                        `repo:${GITHUB_REPOSITORY}:ref:refs/heads/${GITHUB_BRANCH}`,
                },
            }),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
            ],
        });

        new cdk.CfnOutput(this, "GitHubActionsDeployRoleArn", {
            value: deployRole.roleArn,
            description: "IAM role ARN for the GitHub Actions deploy workflow",
            exportName: `${id}-GitHubActionsDeployRoleArn`,
        });

        new cdk.CfnOutput(this, "GitHubOidcProviderArn", {
            value: provider.openIdConnectProviderArn,
            description: "OIDC provider ARN for GitHub Actions",
            exportName: `${id}-GitHubOidcProviderArn`,
        });
    }
}
