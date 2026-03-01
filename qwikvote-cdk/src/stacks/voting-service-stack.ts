import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RANDOM_ORG_API_KEY } from "../configuration/application";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface VotingServiceStackProps extends cdk.StackProps {
}

export class VotingServiceStack extends cdk.Stack {
    readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: VotingServiceStackProps) {
        super(scope, id, props);

        const pollsTable = new dynamodb.TableV2(this, "QwikvotePollsTable", {
            tableName: `qwikvote-polls-${id}`,
            partitionKey: {
                name: "PK",
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: "SK",
                type: dynamodb.AttributeType.STRING
            },
            billing: dynamodb.Billing.provisioned({
                readCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 10 }),
                writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 10 }),
            }),
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        const apiRoot = path.resolve(__dirname, "../../../qwikvote-api");

        const votingFunction = new PythonFunction(this, "VotingFunction", {
            functionName: `qwikvote-voting-${id}`,
            entry: apiRoot,
            runtime: lambda.Runtime.PYTHON_3_13,
            index: "main.py",
            handler: "handler",
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                DYNAMODB_TABLE_NAME: pollsTable.tableName,
                RANDOM_ORG_API_KEY: RANDOM_ORG_API_KEY,
            },
            bundling: {
                assetExcludes: [".venv", "__pycache__", "*.pyc", ".git", ".mypy_cache", ".pytest_cache"],
            },
        });

        pollsTable.grantReadWriteData(votingFunction);

        const votingApi = new apigateway.RestApi(this, "VotingApi", {
            restApiName: `qwikvote-api-${id}`,
            description: "QwikVote Voting Service REST API",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["Content-Type", "Authorization"],
            },
            deployOptions: {
                stageName: "v1",
            },
        });

        const integration = new apigateway.LambdaIntegration(votingFunction, {
            proxy: true,
        });

        votingApi.root.addResource("health").addMethod("GET", integration);

        const polls = votingApi.root.addResource("polls");
        polls.addMethod("POST", integration);

        const poll = polls.addResource("{poll_id}");
        poll.addMethod("GET", integration);

        poll.addResource("vote").addMethod("POST", integration);

        poll.addResource("close").addMethod("POST", integration);

        this.apiUrl = votingApi.url;

        new cdk.CfnOutput(this, "ApiUrl", {
            value: votingApi.url,
            description: "QwikVote API Gateway base URL",
            exportName: `${id}-ApiUrl`,
        });

        new cdk.CfnOutput(this, "TableName", {
            value: pollsTable.tableName,
            description: "DynamoDB table name",
            exportName: `${id}-TableName`,
        });
    }
}
