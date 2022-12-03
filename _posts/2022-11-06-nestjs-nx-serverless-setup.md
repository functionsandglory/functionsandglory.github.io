---
layout: single
title: "Tutorial: NestJS, NX, and Serverless Framework Setup"
description: "How to get an NX integrated monorepo with NestJS in TypeScript deployed via Serverless Framework working."
date: 2022-11-06s
header:
    image: /assets/posts/nestjs-nx-serverless/nestjs-nx-serverless-header.png
categories:
    - tutorials
---
I wanted a cheap, quick, and easy way to deploy backend apis in a monorepo setup.

This post explains the technology chosen and how I wired it all together.

# TLDR;

Here is a [repo](https://github.com/functionsandglory/nestjs-nx-serverless-example) with examples of everything I will be describing below.

# Overview

My requirements were basically this:

- I wanted to use the [NX's integrated style monorepo](https://nx.dev/getting-started/integrated-repo-tutorial).
- I wanted to build my API with [NestJS](https://docs.nestjs.com/) in TypeScript.
- I also wanted to deploy to AWS via the [Serverless Framework](https://www.serverless.com/framework/docs).

A couple of other requirements were:

- I wanted to have a local hot reload development server.
- I wanted to run the local server and deploy to AWS via NX's task runner system.
- I wanted a quick and repeatable flow to bootstrap and deploy an API to rapidly prototype ideas.

One great thing about NX is their wide array of 1st and 3rd party code generators. For example, NX's first party NestJS generator bootstraps a new app quickly. There is also a [3rd party serverless plugin]((https://github.com/Bielik20/nx-plugins/tree/master/packages/nx-serverless)) that generates an empty Serverless Framework app.

The problem? Both those plugins assume a brand new empty state. I can not use one to amend the other.

My core focus was using NestJS and I thought of deployment more as a detail. So I opted to just use the NestJS code generator and manually amend it to be deployable via Serverless Framework rather than the inverse.

# Problem

A key aspect of an NX integrated repo is that all projects within it share the same top level dependencies. So `package.json` and `node_modules` live at the root of the repo and not within the child projects' directories.

_This [page](https://nx.dev/concepts/integrated-vs-package-based) explains the differences between integrated and package based repos._

Serverless Framework is a bit naive out of the box. It expects to be executed in the repo's root where `package.json`, `node_modules`, and `serverless.yml` live. It will simply package all the repo's code, including the entire `node_modules`directory and irrelevant projects, in its generated bundle.

You can see that there is some friction between the monorepo style I want and how Serverless Framework works.

The rest of this post explains the steps I took to get it all working together.

# Solution

## Configuring NestJS

The NestJS app needs a Serverless Framework handler. I took the [example](https://docs.nestjs.com/faq/serverless#example-integration) from NestJS' docs and made a few minor tweaks.

Internally NestJS uses Express. This handler simply exposes the internal Express server and supplies it to the `@vendia/serverless-express` package.

`@vendia/serverless-express` is a utility package that maps serverless events into HTTP requests that Express understands.

What's nice about a setup like this is that you can have a single serverless function run an entire app. This simplifies development and deployment, but at the cost of a potentially larger serverless function that could incur the classic serverless ["cold start"](https://www.serverless.com/blog/keep-your-lambdas-warm/) price.

### Handler Example
```ts
/* Serverless Framework handler */

import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler, } from 'aws-lambda';

import { AppModule } from './app/app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any, // eslint-disable-line
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};

```

## Configuring Serverless Framework

### Plugins
We need to use two Serverless plugins to give Serverless Framework a little more smarts.

* [Serverless Offline](https://www.npmjs.com/package/serverless-offline)
* [Serverless Bundle](https://www.npmjs.com/package/serverless-bundle)

Serverless Offline is for local development. It spins up a local dev server that mimics the AWS Lambda environment it will be deployed in. It also supports hot reloading with a configuration change (see `custom.serverless-offline.reloadHandler` [here](#serverlessbaseyml-example)).

Serverless Bundle will bundle only the code your project needs including dependencies. This resolves the problem of Serverless Framework bundling all of your `node_modules` instead of just the ones your specific project uses.

This plugin is also smart and is able to handle the location of the `node_modules` directory at the repo root instead of the project root with no configuration changes.

Serverless Bundle advertises a low-config "just works" experience. For the simple projects in my example repo, this proved to be true. Internally it uses [Serverless Webpack](https://www.npmjs.com/package/serverless-webpack), so you could opt to use that directly if you end up needing more advanced configs.

### serverless.yml

Since we are operating in the context of a monorepo, we assume there will other projects that also deploy via Serverless Framework.

While we want each project to have flexibility with their own configuration, there will likely be common configuration between projects as well.

To handle this case, we will introduce a `serverless.base.yml` file at the root of the repo.

#### serverless.base.yml Example
```yaml
provider:
  name: aws
  profile: default
  runtime: nodejs14.x

plugins:
  - serverless-bundle
  - serverless-offline

custom:
  serverless-offline:
    reloadHandler: true
  bundle:
    tsConfig: ./tsconfig.app.json
    ignorePackages:
      - 'cache-manager'
      - 'class-transformer'
      - 'class-validator'
      - '@nestjs/websockets/socket-module'
      - '@nestjs/microservices/microservices-module'
      - '@nestjs/microservices'
```

*(You probably noticed the scary looking* `ignorePackages` *block. Basically, packages that are either native to Node.js or incompatible with Webpack should be ignored. This Github [issue](https://github.com/nestjs/nest/issues/1706) explains why these specific packages were ignored.)*

Then in each respective project, we would have a `serverless.yml` file.

#### serverless.yml Example
```yaml
service: example-api-1

provider: ${file(../../serverless.base.yml):provider}
plugins: ${file(../../serverless.base.yml):plugins}

custom:
  serverless-offline:
    httpPort: 3000
    lambdaPort: 4000
    reloadHandler: ${file(../../serverless.base.yml):custom.serverless-offline.reloadHandler}
  bundle: ${file(../../serverless.base.yml):custom.bundle}

functions:
  main:
    handler: src/handler.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

In the example above we are using the ability to reference external YAML files documented [here](https://www.serverless.com/framework/docs/providers/aws/guide/variables#reference-properties-in-other-files).

## Configuring NX

Now that we have Serverless Framework configured with our NestJS handlers, we need to wire up some NX targets to actually run our Serverless Framework commands in NX's task runner system.

We will replace the `serve` target that was generated with NestJS and introduce a new `deploy` target in each project's `project.json`.

### project.json Example
```json
{
 ...
  "targets": {
    ...
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "packages/api1",
        "commands": [
          "serverless offline"
        ],
        "parallel": false
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "packages/api1",
        "commands": [
          "serverless deploy"
        ],
        "parallel": false
      }
    },
  },
  ...
}
```
Notice the `cwd` value in the `options` object. This option is set because we need to make sure NX runs the Serverless Framework commands in the root of each project instead of the repo's root.

Now that each `project.json` has updated, we can run our Serverless Framework commands via NX's task runner system.

Examples:

* `nx serve api1`
* `nx deploy api1`

There is nothing stopping us from going into each project's directory and running Server Framework CLI commands manually.

However, we want to take advantage of NX's robust task runner system. Especially if our projects becomes large.

# Conclusion

That's it! In the end, it turned out to be relatively simple.

While I did run into a few snags trying out different plugins and packages and configuring Serverless Framework for the integrated monorepo context, they were ultimately minor.

I know that this tutorial is ultimately a niche solution to a niche problem, but maybe it will help someone someday.

# Notes
Please be aware of all the pros and cons when working with Serverless/AWS Lambda.

I do not know how the solution proposed here will scale both in performance and codebase size. I will update this post as I find out.

# Future work
Someday, I may try and convert what I did here into a NX code generator.