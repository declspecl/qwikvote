export const AWS_ACCOUNT_ID: string = process.env.AWS_ACCOUNT_ID!;
if (!AWS_ACCOUNT_ID) {
    throw new Error("AWS_ACCOUNT_ID is not set");
}

export const AWS_REGION: string = process.env.AWS_REGION ?? "us-east-1";
