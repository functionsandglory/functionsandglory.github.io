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

# Solution

A key aspect of an NX integrated repo is that all projects within it share the same top level dependencies. So `package.json` and `node_modules` live at the root of the repo and not within the child projects.

This fact is important to understand because the Serverless Framework CLI expects to be executed in the project root and expects a `serverless.yml` file to be there as well by default.

Since this is a monorepo, we may have a different project that also wants to deploy via Serverless Framework with its own config. For that reason, I initially tried to put the `serverless.yml` in the project's own directory and run the Serverless Framework CLI from there. But, for the reasons described previously, it did not work. So I had to abandon that strategy.

