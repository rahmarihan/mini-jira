const region = process.env.AWS_REGION || 'eu-north-1';
const userPoolId =
  process.env.COGNITO_USER_POOL_ID || 'eu-north-1_7kSYxgEr6';

export const cognitoConfig = () => ({
  cognito: {
    userPoolId,
    clientId:
      process.env.COGNITO_CLIENT_ID || 'mu4hog4jim74lhah2s4svbv41',
    issuer:
      process.env.COGNITO_ISSUER ||
      `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
  },
});
