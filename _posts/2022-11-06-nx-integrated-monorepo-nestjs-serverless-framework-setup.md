---
layout: single
title: "Tutorial: NX Integrated Monorepo, NestJS in TypeScript, and Serverless Framework Setup"
description: "How to get an NX integrated monorepo with NestJS in TypeScript deployed via Serverless Framework working."
date: 2022-11-06
categories:
    - tutorials
---
I wanted a quick, easy, and cheap way to deploy back-end apis in my monorepo setup. I decided to use NestJS for the backend api and Serverless Framework for deployment.

This post explains how I got all the technology working together.

# TLDR;

Here is a [repo](https://github.com/functionsandglory/nestjs-serverless-monorepo-example) with examples of everything I will be describing below.

# Overview

My requirements were basically this:

- I wanted to use the [NX's integrated style monorepo](https://nx.dev/getting-started/integrated-repo-tutorial).
- I wanted to build my API with [NestJS](https://docs.nestjs.com/) in TypeScript.
- I also wanted to deploy to AWS via the [Serverless Framework](https://www.serverless.com/framework/docs).

A couple of other requirements were:

- I wanted to have a local hot reload development server.
- I wanted to run the local server and deploy to AWS via NX's task execution system.
- I wanted a quick and repeatable flow to bootstrap and deploy an API quickly to prototype ideas.

One great thing about NX is their wide array of 1st and 3rd party code generators. For example, NX's first party NestJS generator bootstraps a new app quickly. There is also a [3rd party Serverless plugin]((https://github.com/Bielik20/nx-plugins/tree/master/packages/nx-serverless)) that generates an empty Serverless Framework app.

The problem? Both those packages assume a brand new empty state. I can not use one to amend the other.

My core focus was using NestJS and I thought of deployment more as a detail. So I opted to just use the NestJS code generator and manually amend it to be deployable via Serverless Framework rather than the inverse.

# Problem

A key aspect of an NX integrated repo is that all projects within it share the same top level dependencies. So `package.json` and `node_modules` live at the root of the repo and not within the child projects.

_This [page](https://nx.dev/concepts/integrated-vs-package-based) explains the differences between integrated and package based repos._

Serverless Framework is a bit naive out of the box. It expects to be executed in the repo's root where `package.json`, `node_modules`, and `serverless.yml` live. It will simply package all the repo's code, including `node_modules`, in its generated bundle.

You can see that there is some friction between the monorepo style I want and how Serverless Framework works.

The rest of this post explains the steps I took to get it all working together.

# Solution

## Plugins

We need to use two Serverless plugins to give Serverless Framework a little more smarts.

* [Serverless Offline](https://www.npmjs.com/package/serverless-offline)
* [Serverless Bundle](https://www.npmjs.com/package/serverless-bundle)

Serverless Offline is for local development. It spins up a local dev server that mimics the Lambda environment it will be deployed in. It also supports hot reloading.

Serverless Bundle will bundle only the code your project needs including dependencies. This resolves the problem of Serverless bundling all your `node_modules` instead of just the ones your app uses.

Serverless Bundle advertises a low-config "just works" experience. For the simple projects in my example repo, this proved to be true. Internally it uses [Serverless Webpack](https://www.npmjs.com/package/serverless-webpack), so you could opt to use that directly if you end up needing more advanced configs.

After installing the plugins we need, we can begin configuring our projects.

## Configuring NestJS

## Configuring Serverless Framework

## Configuring NX

# Notes
My primary goal was to find a quick, cheap, and easy way to rapidly prototype and deploy a NestJS + NextJS stack, specifically in an integrated monorepo context.

I do not know if the steps taken in this post will work for your needs. Please be aware of all the pros and cons when working with Serverless/AWS Lambda.

# Future work
Someday, I may try and convert what I did here into a NX code generator.