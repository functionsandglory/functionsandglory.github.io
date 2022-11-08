---
layout: single
title: "Tutorial: NX Integrated Monorepo, NestJS in TypeScript, and Serverless Framework Setup"
description: "How to get an NX integrated monorepo with NestJS in TypeScript deployed via Serverless Framework working."
date: 2022-11-06
categories:
- Tutorials
---
I do realize that this tutorial may not be very useful to a very many people as the problem only occurs when combined with a very specific set of technologies.

But for that maybe 1 person, this is for you!

#TLDR;

Here is a sample app of everything I will be describing below.

# Overview

My requirements were basically this:

- I wanted to use the [NX's integrated style monorepo](https://nx.dev/getting-started/integrated-repo-tutorial).
- I wanted to build my API with NestJS in TypeScript.
- I also wanted to deploy this NestJS API to AWS via the [Serverless Framework](https://www.serverless.com/framework/docs).

A couple of other requirements were:

- I wanted to have a local hot reload development server.
- I wanted to run the local server and deploy to AWS via NX's standard `serve` and `build` commands.
- I wanted a quick and repeatable flow to bootstrap and deploy an API quickly to prototype ideas.

One great thing about NX is their wide array of 1st and 3rd party code generators. For example, NX's first party NestJS generator bootstraps a new app quickly. There is also a 3rd party Serverless plugin that generates an empty [Serverless](https://github.com/Bielik20/nx-plugins/tree/master/packages/nx-serverless) Framework app.

The problem? Both those packages assume a brand new empty state. I can not use one to amend the other.

My core focus was using NestJS and I thought of deployment more as a detail. So I opted to just use the NestJS code generator and manually amend it to be deployable via Serverless Framework rather than the inverse.

# Problem

A key aspect of an NX integrated repo is that all projects within it share the same top level dependencies. So `package.json` and `node_modules` live at the root of the repo and not within the child projects.

This fact is important to understand because the Serverless Framework CLI expects to be executed in the project root and expects a `serverless.yml` file to be there as well by default.

Since this is a monorepo, we may have a different project that also wants to deploy via Serverless Framework with its own config. For that reason, I initially tried to put the `serverless.yml` in the project's own directory and run the Serverless Framework CLI from there. But, for the reasons described previously, it did not work. So I had to abandon that strategy.

# Solution

The solution is don't fight the Serverless Framework (why do I keep learning this lesson?). Just put the `serverless.yml` in the root of the repo.

To support multiple Serverless Framework apps, I named each YAML config like: `serverless-[project name].yml`.

Then in each project's `project.json` I updated the `build` and `serve` commands to reference each project's own YAML config.

`packages/[project name]/project.json`
```json
{
    ...
    "serve": {
        "executor": "nx:run-commands",
            "options": {
            "commands": [
                "serverless offline --config serverless-api.yml"
            ],
                "parallel": false
        }
    },
    "deploy": {
        "executor": "nx:run-commands",
            "options": {
            "commands": [
                "serverless deploy --config serverless-api.yml"
            ],
                "parallel": false
        }
    }
}
```

I would have preferred to keep each YAML config with the project's code, but this compromise is acceptable to me.

There are a few other tasks we must do before we are up and running.

First, there are several dependencies we will need to add to our repo:

**Dependencies**
- [@vendia/serverless-express](https://www.npmjs.com/package/@vendia/serverless-express)
- [aws-lambda](https://www.npmjs.com/package/aws-lambda)

These two dependencies are for using the Express server api, which NestJS uses under the hood, in a compatible way for AWS Lambda.

**Dev Dependencies**
- [serverless-offline](https://www.npmjs.com/package/serverless-offline)
- [serverless-plugin-typescript](https://www.npmjs.com/package/serverless-plugin-typescript)

These two dependencies are for being able to run our Serverless code locally and for compiling and packaging our TypeScript code. 

Second, we need to add a serverless handler in our NestJS apps. I took what NestJS provides [here](https://docs.nestjs.com/faq/serverless#example-integration) with a couple minor tweaks and added it to the projects:

`packages/[project name]/src/handler.ts`
```ts
import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app/app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

Lastly, we need to make a few tweaks to each project's Serverless config:

```yaml
service: [project name]

plugins:
  - serverless-offline
  - serverless-plugin-typescript

custom:
  serverlessPluginTypescript:
    # The TS config automatically generated by the NestJS generator.
    tsConfigFileLocation: './packages/[project name]/tsconfig.app.json' 
    # Customize the ports for each project, so you can run them concurrently if needed.
    serverless-offline:
      httpPort: 4000
      websocketPort: 4001
      lambdaPort: 4002

provider:
  name: aws
  profile: '[your AWS CLI profile]'
  runtime: nodejs14.x

functions:
  main:
    handler: packages/[project name]/src/handler.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

That's it!

Then you can simply run: `nx run-many --target=server` to run both NestJS apis locally

Or ` nx run-many --target=deploy` to deploy both apis in AWS.

# Notes about the serverless bundle size

I had a concern that the serverless bundle would include all of NX's dependencies and not just the ones used by the NestJS app.

But it appears that is not the case. I inspected the `node_modules` size in the bundled code, and it is smaller than the `node_modules` in the repo's root.

However, NestJS does appear to have some decent size to it out of the box and the resulting serverless bundle is large.

So use this tutorial at your own risk and evaluate your needs. For my purposes of rapid prototyping and low production usage, this is an acceptable tradeoff.

# Future work
Someday, I may try and convert what I did here into a NX code generator