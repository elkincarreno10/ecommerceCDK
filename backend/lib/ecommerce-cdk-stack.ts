import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path'


export class EcommerceCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //! Creamos la tabla de DynamoDB
    const users = new dynamodb.Table(this, 'Users', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
    });
    //! Agregamos un índice global secundario para el token
    users.addGlobalSecondaryIndex({
      indexName: 'token-index',
      partitionKey: { name: 'token', type: dynamodb.AttributeType.STRING},
      projectionType: dynamodb.ProjectionType.ALL // Proyectamos todas las columnas en el índice
    });


    //? Lambda Functions 
    const createUser = new lambda.Function(this, "CreateUser", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.createUser',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        USERS_TABLE: users.tableName
      }
    })
    const getUsers = new lambda.Function(this, "GetUsers", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.getUsers',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        USERS_TABLE: users.tableName
      }
    })
    const updateUser = new lambda.Function(this, "UpdateUser", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.updateUser',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        USERS_TABLE: users.tableName
      }
    })
    const deleteUser = new lambda.Function(this, "DeleteUser", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.deleteUser',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')), 
      environment: {
        USERS_TABLE: users.tableName
      }
    })
    //? Permissions to lambda to dynamo table
    users.grantReadWriteData(createUser)
    users.grantReadData(getUsers)
    users.grantReadWriteData(updateUser)
    users.grantReadWriteData(deleteUser)

    //* Create the API Gateway with one method and path
    const usersAPI = new apigateway.RestApi(this, "crudUsersEcommerce")

    usersAPI.root
      .resourceForPath("createUser")
      .addMethod("POST", new apigateway.LambdaIntegration(createUser))

      usersAPI.root
      .resourceForPath("getUsers")
      .addMethod("GET", new apigateway.LambdaIntegration(getUsers))

      usersAPI.root
      .resourceForPath("updateUser")
      .addMethod("POST", new apigateway.LambdaIntegration(updateUser))

      usersAPI.root
      .resourceForPath("deleteUser")
      .addMethod("GET", new apigateway.LambdaIntegration(deleteUser))
      
  }
}
