# CranL Documentation (Scraped Archive)

> Source: https://docs.cranl.com/  
> Scraped: 2026-05-18T20:55:26.179Z


---


## Table of Contents

1. [CranL Documentation](#cranl-documentation)
2. [Sign Up](#sign-up)
3. [Dashboard Overview](#dashboard-overview)
4. [Quickstart](#quickstart)
5. [Platform Guide](#platform-guide)
6. [Projects](#projects)
7. [GitHub Integration](#github-integration)
8. [Applications](#applications)
9. [Deployments](#deployments)
10. [Environment Variables](#environment-variables)
11. [Domains & SSL](#domains-ssl)
12. [Databases](#databases)
13. [Monitoring](#monitoring)
14. [Analytics](#analytics)
15. [Schedules (Cron Jobs)](#schedules-cron-jobs)
16. [Storage](#storage)
17. [Team Members](#team-members)
18. [Billing](#billing)
19. [Settings](#settings)
20. [CLI Reference](#cli-reference)
21. [Authentication](#authentication)
22. [Projects](#projects)
23. [Applications](#applications)
24. [Databases](#databases)
25. [Domains](#domains)
26. [GitHub](#github)
27. [Regions](#regions)
28. [API Reference](#api-reference)
29. [Authentication](#authentication)
30. [Applications API](#applications-api)
31. [Databases API](#databases-api)
32. [Projects API](#projects-api)
33. [MCP Integration](#mcp-integration)
34. [IDE Setup](#ide-setup)
35. [MCP Tools Reference](#mcp-tools-reference)
36. [OpenAPI Specification](#openapi-specification)

---



<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/index.html -->

<!-- ============================================ -->


## CranL Documentation

_Source: https://docs.cranl.com/index.html_


# CranL Documentation

**CranL** is a cloud platform for deploying applications and managing databases across global regions. Deploy from GitHub with automatic builds, managed databases, CDN, SSL, and custom domains — all from the dashboard, CLI, or your AI coding assistant.

```
 _____                 _
/  __ \               | |
| /  \/_ __ __ _ _ __ | |
| |   | '__/ _` | '_ \| |
| \__/\ | | (_| | | | | |____
 \____/_|  \__,_|_| |_\_____/

 CranL Cloud Platform  v1.5
```

## Quick Links

- **New to CranL?** Start with [Sign Up](getting-started/sign-up.html)
- **Deploy your first app:** [Quickstart](getting-started/quickstart.html)
- **CLI Reference:** [CLI Reference](cli/index.html)
- **API Reference:** [API Reference](api/index.html)
- **AI IDE Integration:** [MCP Integration](mcp/index.html)

## Features

- **Git-based deployments** — Push to GitHub, CranL builds and deploys automatically
- **Managed databases** — PostgreSQL, MySQL, MariaDB, MongoDB, Redis
- **Global regions** — Europe, USA, MENA, Asia
- **Built-in CDN & SSL** — Every app gets HTTPS and edge caching out of the box
- **Custom domains** — Point your domain, SSL provisioned automatically
- **Object storage** — S3-compatible buckets with file manager and credentials
- **Traffic analytics** — Requests, bandwidth, geographic breakdown, error rates
- **Cron jobs** — Schedule recurring tasks inside your applications
- **Team collaboration** — Invite members with role-based access
- **CLI & MCP** — Manage everything from the terminal or let your AI assistant do it

- [Sign Up](getting-started/sign-up.html)
    - [Create an Account](getting-started/sign-up.html#create-an-account)
    - [Set Your Password](getting-started/sign-up.html#set-your-password)
    - [Choose a Plan](getting-started/sign-up.html#choose-a-plan)
    - [Password Reset](getting-started/sign-up.html#password-reset)
    - [What’s Next?](getting-started/sign-up.html#what-s-next)
- [Dashboard Overview](getting-started/dashboard-overview.html)
    - [Welcome Screen](getting-started/dashboard-overview.html#welcome-screen)
    - [Traffic Overview](getting-started/dashboard-overview.html#traffic-overview)
    - [Recent Activity](getting-started/dashboard-overview.html#recent-activity)
    - [Quick Actions](getting-started/dashboard-overview.html#quick-actions)
    - [Sidebar Navigation](getting-started/dashboard-overview.html#sidebar-navigation)
    - [What’s Next?](getting-started/dashboard-overview.html#what-s-next)
- [Quickstart](getting-started/quickstart.html)
    - [Prerequisites](getting-started/quickstart.html#prerequisites)
    - [Step 1: Connect GitHub](getting-started/quickstart.html#step-1-connect-github)
    - [Step 2: Create a Project](getting-started/quickstart.html#step-2-create-a-project)
    - [Step 3: Deploy an Application](getting-started/quickstart.html#step-3-deploy-an-application)
    - [Step 4: Check the Deployment](getting-started/quickstart.html#step-4-check-the-deployment)
    - [Step 5: Add a Database (Optional)](getting-started/quickstart.html#step-5-add-a-database-optional)
    - [Step 6: Add a Custom Domain (Optional)](getting-started/quickstart.html#step-6-add-a-custom-domain-optional)
    - [What’s Next?](getting-started/quickstart.html#what-s-next)

- [Platform Guide](platform/index.html)
- [Projects](platform/projects.html)
    - [Creating a Project](platform/projects.html#creating-a-project)
    - [Switching Projects](platform/projects.html#switching-projects)
    - [Project Settings](platform/projects.html#project-settings)
    - [Deleting a Project](platform/projects.html#deleting-a-project)
- [GitHub Integration](platform/github-integration.html)
    - [Connecting GitHub](platform/github-integration.html#connecting-github)
    - [Multiple Accounts](platform/github-integration.html#multiple-accounts)
    - [Viewing Repositories](platform/github-integration.html#viewing-repositories)
    - [Disconnecting](platform/github-integration.html#disconnecting)
- [Applications](platform/applications.html)
    - [Creating an Application](platform/applications.html#creating-an-application)
    - [Plan Resources](platform/applications.html#plan-resources)
    - [Application Status](platform/applications.html#application-status)
    - [Application Settings](platform/applications.html#application-settings)
    - [Configuring a Dockerfile](platform/applications.html#configuring-a-dockerfile)
    - [Deleting an Application](platform/applications.html#deleting-an-application)
    - [See Also](platform/applications.html#see-also)
- [Deployments](platform/deployments.html)
    - [Triggering a Deployment](platform/deployments.html#triggering-a-deployment)
    - [Deployment History](platform/deployments.html#deployment-history)
    - [Build Logs](platform/deployments.html#build-logs)
    - [AI Build Fix](platform/deployments.html#ai-build-fix)
- [Environment Variables](platform/environment-variables.html)
    - [Viewing Variables](platform/environment-variables.html#viewing-variables)
    - [Adding Variables](platform/environment-variables.html#adding-variables)
    - [Editing Variables](platform/environment-variables.html#editing-variables)
    - [Injected Variables](platform/environment-variables.html#injected-variables)
- [Domains & SSL](platform/domains-ssl.html)
    - [Default Domain](platform/domains-ssl.html#default-domain)
    - [Custom Domains](platform/domains-ssl.html#custom-domains)
    - [Plan Limits](platform/domains-ssl.html#plan-limits)
- [Databases](platform/databases.html)
    - [Supported Types](platform/databases.html#supported-types)
    - [Creating a Database](platform/databases.html#creating-a-database)
    - [Database Status](platform/databases.html#database-status)
    - [Managing Databases](platform/databases.html#managing-databases)
    - [Connection Information](platform/databases.html#connection-information)
- [Monitoring](platform/monitoring.html)
    - [Viewing Metrics](platform/monitoring.html#viewing-metrics)
    - [Available Metrics](platform/monitoring.html#available-metrics)
    - [Runtime Logs](platform/monitoring.html#runtime-logs)
- [Analytics](platform/analytics.html)
    - [Viewing Analytics](platform/analytics.html#viewing-analytics)
    - [Traffic Overview](platform/analytics.html#traffic-overview)
    - [Request Chart](platform/analytics.html#request-chart)
    - [Error Breakdown](platform/analytics.html#error-breakdown)
    - [Geographic Data](platform/analytics.html#geographic-data)
    - [Top Paths](platform/analytics.html#top-paths)
    - [Refreshing Data](platform/analytics.html#refreshing-data)
- [Schedules (Cron Jobs)](platform/schedules.html)
    - [Viewing Schedules](platform/schedules.html#viewing-schedules)
    - [Creating a Schedule](platform/schedules.html#creating-a-schedule)
    - [Managing Schedules](platform/schedules.html#managing-schedules)
- [Storage](platform/storage.html)
    - [Creating a Bucket](platform/storage.html#creating-a-bucket)
    - [File Manager](platform/storage.html#file-manager)
    - [S3 Credentials](platform/storage.html#s3-credentials)
    - [Bucket Information](platform/storage.html#bucket-information)
- [Team Members](platform/team-members.html)
    - [Roles](platform/team-members.html#roles)
    - [Inviting Members](platform/team-members.html#inviting-members)
    - [Accepting an Invitation](platform/team-members.html#accepting-an-invitation)
    - [Managing Members](platform/team-members.html#managing-members)
    - [Locked Accounts](platform/team-members.html#locked-accounts)
- [Billing](platform/billing.html)
    - [Viewing Your Plan](platform/billing.html#viewing-your-plan)
    - [Plans](platform/billing.html#plans)
    - [Upgrading](platform/billing.html#upgrading)
    - [Downgrading](platform/billing.html#downgrading)
    - [Managing Payment](platform/billing.html#managing-payment)
    - [Subscription Status](platform/billing.html#subscription-status)
    - [Canceled Accounts](platform/billing.html#canceled-accounts)
    - [Coupons](platform/billing.html#coupons)
- [Settings](platform/settings.html)
    - [Profile](platform/settings.html#profile)
    - [Organization](platform/settings.html#organization)
    - [API Keys](platform/settings.html#api-keys)

- [CLI Reference](cli/index.html)
    - [Installation](cli/index.html#installation)
    - [Commands Overview](cli/index.html#commands-overview)
    - [Configuration](cli/index.html#configuration)
    - [Global Behavior](cli/index.html#global-behavior)
- [Authentication](cli/authentication.html)
    - [cranl login](cli/authentication.html#cranl-login)
    - [cranl logout](cli/authentication.html#cranl-logout)
    - [cranl whoami](cli/authentication.html#cranl-whoami)
- [Projects](cli/projects.html)
    - [cranl projects list](cli/projects.html#cranl-projects-list)
    - [cranl projects create](cli/projects.html#cranl-projects-create)
    - [cranl projects select](cli/projects.html#cranl-projects-select)
- [Applications](cli/applications.html)
    - [cranl apps list](cli/applications.html#cranl-apps-list)
    - [cranl apps create](cli/applications.html#cranl-apps-create)
    - [cranl apps info](cli/applications.html#cranl-apps-info)
    - [cranl apps delete](cli/applications.html#cranl-apps-delete)
    - [cranl apps deploy](cli/applications.html#cranl-apps-deploy)
    - [cranl apps logs](cli/applications.html#cranl-apps-logs)
    - [cranl apps monitoring](cli/applications.html#cranl-apps-monitoring)
    - [Lifecycle Commands](cli/applications.html#lifecycle-commands)
    - [Environment Variables](cli/applications.html#environment-variables)
    - [Deployment History](cli/applications.html#deployment-history)
- [Databases](cli/databases.html)
    - [Supported Types](cli/databases.html#supported-types)
    - [cranl db list](cli/databases.html#cranl-db-list)
    - [cranl db create](cli/databases.html#cranl-db-create)
    - [cranl db info](cli/databases.html#cranl-db-info)
    - [cranl db delete](cli/databases.html#cranl-db-delete)
    - [cranl db start](cli/databases.html#cranl-db-start)
    - [cranl db stop](cli/databases.html#cranl-db-stop)
- [Domains](cli/domains.html)
    - [cranl apps domains list](cli/domains.html#cranl-apps-domains-list)
    - [cranl apps domains add](cli/domains.html#cranl-apps-domains-add)
    - [DNS Configuration](cli/domains.html#dns-configuration)
- [GitHub](cli/github.html)
    - [cranl github status](cli/github.html#cranl-github-status)
    - [cranl github connect](cli/github.html#cranl-github-connect)
    - [cranl github repos](cli/github.html#cranl-github-repos)
- [Regions](cli/regions.html)
    - [cranl regions](cli/regions.html#cranl-regions)
    - [Region Selection](cli/regions.html#region-selection)

- [API Reference](api/index.html)
    - [Base URL](api/index.html#base-url)
    - [Authentication](api/index.html#authentication)
    - [Response Format](api/index.html#response-format)
    - [HTTP Status Codes](api/index.html#http-status-codes)
    - [Rate Limits](api/index.html#rate-limits)
- [Authentication](api/authentication.html)
    - [API Key Format](api/authentication.html#api-key-format)
    - [Creating API Keys](api/authentication.html#creating-api-keys)
    - [Using API Keys](api/authentication.html#using-api-keys)
    - [Verify API Key](api/authentication.html#verify-api-key)
    - [Revoking API Keys](api/authentication.html#revoking-api-keys)
    - [Security Best Practices](api/authentication.html#security-best-practices)
- [Applications API](api/applications.html)
    - [List Applications](api/applications.html#list-applications)
    - [Create Application](api/applications.html#create-application)
    - [Get Application](api/applications.html#get-application)
    - [Delete Application](api/applications.html#delete-application)
    - [Deploy Application](api/applications.html#deploy-application)
    - [Lifecycle](api/applications.html#lifecycle)
    - [Environment Variables](api/applications.html#environment-variables)
    - [Deployments](api/applications.html#deployments)
    - [AI Fix](api/applications.html#ai-fix)
    - [Domains](api/applications.html#domains)
    - [Monitoring](api/applications.html#monitoring)
    - [Analytics](api/applications.html#analytics)
    - [Purge Cache](api/applications.html#purge-cache)
- [Databases API](api/databases.html)
    - [List Databases](api/databases.html#list-databases)
    - [Create Database](api/databases.html#create-database)
    - [Get Database](api/databases.html#get-database)
    - [Update Database](api/databases.html#update-database)
    - [Delete Database](api/databases.html#delete-database)
    - [Database Lifecycle](api/databases.html#database-lifecycle)
- [Projects API](api/projects.html)
    - [List Projects](api/projects.html#list-projects)
    - [Create Project](api/projects.html#create-project)
    - [Get Project](api/projects.html#get-project)
    - [Update Project](api/projects.html#update-project)
    - [Delete Project](api/projects.html#delete-project)
    - [Project Members](api/projects.html#project-members)

- [MCP Integration](mcp/index.html)
    - [Supported IDEs](mcp/index.html#supported-ides)
    - [Quick Start](mcp/index.html#quick-start)
    - [How It Works](mcp/index.html#how-it-works)
- [IDE Setup](mcp/setup.html)
    - [Prerequisites](mcp/setup.html#prerequisites)
    - [Claude Code](mcp/setup.html#claude-code)
    - [Cursor](mcp/setup.html#cursor)
    - [VS Code](mcp/setup.html#vs-code)
    - [Antigravity](mcp/setup.html#antigravity)
    - [Windsurf](mcp/setup.html#windsurf)
    - [Verification](mcp/setup.html#verification)
    - [Troubleshooting](mcp/setup.html#troubleshooting)
- [MCP Tools Reference](mcp/tools.html)
    - [Projects](mcp/tools.html#projects)
    - [Apps](mcp/tools.html#apps)
    - [Logs & Monitoring](mcp/tools.html#logs-monitoring)
    - [Environment Variables](mcp/tools.html#environment-variables)
    - [Databases](mcp/tools.html#databases)
    - [Regions & Domains](mcp/tools.html#regions-domains)
    - [AI Fix](mcp/tools.html#ai-fix)
    - [MCP Resource](mcp/tools.html#mcp-resource)

- [OpenAPI Specification](openapi.html)




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/getting-started/sign-up.html -->

<!-- ============================================ -->


## Sign Up

_Source: https://docs.cranl.com/getting-started/sign-up.html_


# Sign Up

Create your CranL account and choose a plan to start deploying.

## Create an Account

1. Go to [app.cranl.com](https://app.cranl.com)
2. Enter your email address
3. Click **Send Magic Link** — a verification link is sent to your inbox
4. Open the email and click the link to verify your address

## Set Your Password

After verifying your email, you’ll be prompted to:

1. Set a password for your account
2. Enter your first and last name
3. Add your phone number
4. Select your country

## Choose a Plan

After completing your profile, select a subscription plan:

| Feature | Basic | Pro | Enterprise |
| --- | --- | --- | --- |
| **Price** | Free | $9/mo | $29/mo |
| **Projects** | 2 | 10 | Unlimited |
| **Apps & Databases** | 3 combined | 20 combined | Unlimited |
| **Custom Domains** | 1 | 10 | Unlimited |
| **Storage Buckets** | — | 1 | 5 |
| **MENA Regions** | — | Yes | Yes |

Payment is handled securely through Stripe. You can upgrade or downgrade at any time from the [Billing](../platform/billing.html) page.

## Password Reset

If you forget your password:

1. Go to the login page
2. Click **Forgot password?**
3. Enter your email address
4. Check your inbox for a reset link
5. Set a new password

## What’s Next?

- [Dashboard Overview](dashboard-overview.html) — Tour of the dashboard
- [Quickstart](quickstart.html) — Deploy your first application




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/getting-started/dashboard-overview.html -->

<!-- ============================================ -->


## Dashboard Overview

_Source: https://docs.cranl.com/getting-started/dashboard-overview.html_


# Dashboard Overview

After logging in, you land on the main dashboard at `app.cranl.com/dashboard`. Here’s what you’ll see.

## Welcome Screen

The dashboard greets you by name and shows a summary of your account:

- **Total Applications** — Number of deployed apps
- **Databases** — Number of managed databases
- **Active Deployments** — Currently running deployments
- **Connected Repos** — GitHub repositories synced
- **Projects** — Total projects in your organization

## Traffic Overview

A chart showing request traffic across your applications over the selected time period.

## Recent Activity

The latest deployments and database changes, showing:

- Application or database name
- Status (running, error, done)
- Timestamp

## Quick Actions

Buttons to jump to common tasks:

- **New Application** — Create and deploy an app
- **New Database** — Provision a managed database
- **Connect GitHub** — Link your GitHub account

## Sidebar Navigation

The left sidebar provides access to all sections:

| Section | Description |
| --- | --- |
| **Dashboard** | Overview and stats (this page) |
| **Applications** | All your apps and databases |
| **Projects** | Project management |
| **Storage** | S3-compatible object storage |
| **GitHub** | Repository connections |
| **Billing** | Subscription and payment |
| **Settings** | Profile, API keys, organization |

### Project Selector

At the top of the sidebar, a dropdown lets you switch between projects. All resources shown in the dashboard are scoped to the selected project. Your selection is saved between sessions.

## What’s Next?

- [Quickstart](quickstart.html) — Deploy your first app
- [Projects](../platform/projects.html) — Create and organize projects




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/getting-started/quickstart.html -->

<!-- ============================================ -->


## Quickstart

_Source: https://docs.cranl.com/getting-started/quickstart.html_


# Quickstart

Deploy your first application on CranL in under 5 minutes.

## Prerequisites

- A CranL account ([sign up](https://app.cranl.com) if you haven’t)
- A GitHub repository with your application code

## Step 1: Connect GitHub

1. Go to **GitHub** in the sidebar
2. Click **Connect GitHub**
3. Authorize the CranL GitHub App and grant access to your repositories
4. Your repositories will sync automatically

## Step 2: Create a Project

If you don’t have a project yet:

1. Go to **Projects** in the sidebar
2. Click **New Project**
3. Enter a name (e.g., “Production”) and confirm

## Step 3: Deploy an Application

1. Go to **Applications** in the sidebar
2. Click **New Application**
3. Select a GitHub repository from the list
4. Configure your app:
     - **Name** — A name for your application
     - **Branch** — The Git branch to deploy (defaults to `main`)
     - **Build Type** — `Railpack` (auto-detect) or `Dockerfile`
     - **Region** — Where to deploy (see [Regions](../cli/regions.html))
5. Click **Create** — your app starts building immediately

## Step 4: Check the Deployment

On the application detail page you can:

- Watch the **build logs** in real time
- See the deployment status change from `queued` → `running` → `done`
- Click the generated URL (`*.cranl.net`) to visit your live app

## Step 5: Add a Database (Optional)

1. On the **Applications** page, click **New Database**
2. Choose a type: PostgreSQL, MySQL, MariaDB, MongoDB, or Redis
3. Give it a name and select a region
4. To inject the connection string into your app, select the target application during creation

The `DATABASE_URL` environment variable is added to your app automatically.

## Step 6: Add a Custom Domain (Optional)

1. Open your application’s detail page
2. Go to the **Domains** tab
3. Click **Add Domain** and enter your domain (e.g., `api.example.com`)
4. Point a **CNAME** record from your domain to the provided `*.cranl.net` address
5. SSL is provisioned automatically once DNS propagates

## What’s Next?

- [Applications](../platform/applications.html) — Application settings and management
- [Deployments](../platform/deployments.html) — Deployment history and build logs
- [Environment Variables](../platform/environment-variables.html) — Manage environment variables
- [Billing](../platform/billing.html) — Upgrade your plan for more resources
- [CLI Reference](../cli/index.html) — Manage CranL from the command line




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/index.html -->

<!-- ============================================ -->


## Platform Guide

_Source: https://docs.cranl.com/platform/index.html_


# Platform Guide

This section covers everything you can do from the CranL dashboard at [app.cranl.com](https://app.cranl.com).

The dashboard is organized around **projects** — each project groups related applications, databases, and team members together.

| Feature | Description |
| --- | --- |
| [Projects](projects.html) | Create and manage projects |
| [GitHub Integration](github-integration.html) | Connect GitHub and sync repositories |
| [Applications](applications.html) | Create and configure applications |
| [Deployments](deployments.html) | Deploy, view build logs, AI fix |
| [Environment Variables](environment-variables.html) | Manage app environment variables |
| [Domains & SSL](domains-ssl.html) | Custom domains and SSL certificates |
| [Databases](databases.html) | Provision managed databases |
| [Monitoring](monitoring.html) | CPU, memory, and disk usage |
| [Analytics](analytics.html) | Traffic analytics and insights |
| [Schedules (Cron Jobs)](schedules.html) | Cron jobs for recurring tasks |
| [Storage](storage.html) | S3-compatible object storage |
| [Team Members](team-members.html) | Invite members and manage roles |
| [Billing](billing.html) | Subscription plans and payments |
| [Settings](settings.html) | Profile, API keys, organization |




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/projects.html -->

<!-- ============================================ -->


## Projects

_Source: https://docs.cranl.com/platform/projects.html_


# Projects

Projects are containers that group related applications and databases together. Every resource in CranL belongs to a project.

## Creating a Project

1. Go to **Projects** in the sidebar
2. Click **New Project**
3. Enter a project name and confirm

## Switching Projects

Use the **project selector** dropdown at the top of the sidebar to switch between projects. The dashboard, applications list, and all other views are scoped to the selected project.

Your selection is saved and persists between sessions.

## Project Settings

Click on a project from the **Projects** page to access its settings.

### General

- View the project name (editable by the owner)
- See the organization it belongs to
- View the creation date

### Team Members

Manage who has access to this project. See [Team Members](team-members.html) for details.

## Deleting a Project

Projects can only be deleted if they contain **no applications**. Remove all apps and databases first, then delete the project from its settings page.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/github-integration.html -->

<!-- ============================================ -->


## GitHub Integration

_Source: https://docs.cranl.com/platform/github-integration.html_


# GitHub Integration

CranL deploys applications directly from GitHub repositories. You need to connect at least one GitHub account per project before creating applications.

## Connecting GitHub

1. Go to **GitHub** in the sidebar
2. Click **Connect GitHub**
3. You’ll be redirected to GitHub to authorize the CranL GitHub App
4. Grant access to the repositories you want to deploy
5. After authorization, your repositories sync automatically

## Multiple Accounts

You can connect multiple GitHub accounts to a single project. This is useful if your repositories are spread across personal accounts and organizations.

- Each connected account shows its avatar and username
- Use the account switcher to view repositories per account
- Connect additional accounts by clicking **Connect GitHub** again

## Viewing Repositories

After connecting, your synced repositories appear in a list showing:

- Repository name
- Description
- Public or private visibility
- Primary language
- Last push date

Repositories are sorted by last pushed date, so your most active repos appear first.

## Disconnecting

To remove a GitHub account from a project:

1. Go to **GitHub** in the sidebar
2. Find the account you want to disconnect
3. Click **Disconnect**

Warning

Disconnecting a GitHub account does not delete applications already created from its repositories. Existing apps continue to work, but you won’t be able to create new apps from that account’s repositories.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/applications.html -->

<!-- ============================================ -->


## Applications

_Source: https://docs.cranl.com/platform/applications.html_


# Applications

Applications are the core of CranL — each one is a deployed service built from a GitHub repository.

## Creating an Application

1. Go to **Applications** in the sidebar
2. Click **New Application**
3. Select a GitHub repository from your synced repos
4. Configure the application:

| Field | Description |
| --- | --- |
| **Name** | A name for your app (defaults to the repository name) |
| **Branch** | The Git branch to deploy (defaults to `main`) |
| **Build Type** | `Railpack` (auto-detect) or `Dockerfile` |
| **Region** | Where to deploy your app (see [Regions](../cli/regions.html) for available regions) |

1. Click **Create** — the app deploys immediately

Note

The total number of applications and databases combined is limited by your plan. Basic allows 3, Pro allows 20, Enterprise is unlimited.

The number of Applications you can create depends on your plan:

- **Basic:** 2 Applications
- **Pro:** 10 Applications
- **Enterprise:** Unlimited Applications

## Plan Resources

Each Application comes with dedicated resources based on your plan:

- **Basic:** 2GB RAM DDR5, 2 vCPU Cores
- **Pro:** 4GB RAM DDR5, 4 vCPU Cores

All CPU cores are sourced from the following processors:

- AMD Ryzen 9 5950X
- AMD Ryzen 9 7950X3D
- AMD Ryzen 9 3900

## Application Status

Each application shows a status indicator:

- **Running** — App is live and serving traffic
- **Done** — Last deployment completed successfully
- **Error** — Last deployment failed
- **Idle** — App is stopped
- **Pending** — Deployment in progress

## Application Settings

Open an application to access its detail page. From here you can manage:

### Port

Edit the port your application listens on. This must match the port your app binds to internally.

### Default Domain

Every application gets a free `*.cranl.net` subdomain with SSL. The URL is shown in the settings and can be copied to your clipboard.

### Connected Repository

View which GitHub repository and branch the application is built from.

## Configuring a Dockerfile

If you select `Dockerfile` as the **Build Type**, CranL will use the `Dockerfile` found in the root of your repository to build and deploy your application.

Your `Dockerfile` must follow these requirements to work correctly on CranL:

- It must be named exactly `Dockerfile` (case-sensitive) and placed in the **root** of your repository.
- Your application must bind to the port you configured in the **Port** setting.
- The final image must have a defined `CMD` or `ENTRYPOINT` instruction to start the application.

### Basic Dockerfile Structure

A minimal working `Dockerfile` looks like this:

```
# 1. Choose a base image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy dependency files first (for better layer caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --production

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port your app listens on (must match Port setting)
EXPOSE 3000

# 7. Define the command to start the application
CMD ["node", "server.js"]
```

### Common Examples

**Python (Flask / FastAPI)**

```
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Go**

```
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

**PHP (Laravel / Symfony)**

```
FROM php:8.2-fpm-alpine
WORKDIR /var/www
COPY . .
RUN docker-php-ext-install pdo pdo_mysql
EXPOSE 9000
CMD ["php-fpm"]
```

### Best Practices

- Use a **slim or alpine** base image to reduce image size and build time.
- Copy dependency files (`package.json`, `requirements.txt`, etc.) **before** copying the rest of your code to take advantage of Docker layer caching.
- Always bind your application to `0.0.0.0` and not `localhost` or `127.0.0.1`, otherwise CranL cannot route traffic to it.
- Avoid storing secrets in the `Dockerfile`. Use [Environment Variables](environment-variables.html) instead.
- Use a **multi-stage build** (as shown in the Go example) for compiled languages to keep the final image small.

Warning

If your application binds to `localhost` or `127.0.0.1` instead of `0.0.0.0`, it will not be reachable and will show an **Error** status after deployment.

## Deleting an Application

1. Open the application detail page
2. Scroll to the bottom
3. Click **Delete Application**
4. Confirm the deletion

Warning

Deleting an application removes it permanently along with its DNS records and CDN configuration. This cannot be undone.

## See Also

- [Deployments](deployments.html) — Deploy and view build logs
- [Environment Variables](environment-variables.html) — Set environment variables
- [Domains & SSL](domains-ssl.html) — Add custom domains
- [Monitoring](monitoring.html) — Resource usage metrics




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/deployments.html -->

<!-- ============================================ -->


## Deployments

_Source: https://docs.cranl.com/platform/deployments.html_


# Deployments

Every time you deploy an application, CranL builds it from source and rolls out the new version.

## Triggering a Deployment

From the application detail page, click the **Deploy** button. You can also:

- **Stop** — Stop the running application
- **Start** — Start a stopped application
- **Reload** — Soft restart without rebuilding
- **Rebuild** — Full rebuild from source

These options are available in the dropdown next to the Deploy button.

## Deployment History

The deployment history shows all past deployments with:

- **Status** — `done`, `error`, `running`, or `queued`
- **Commit** — The Git commit SHA and message
- **Duration** — How long the build took
- **Timestamp** — When the deployment was triggered

Click any deployment to view its build logs.

## Build Logs

Build logs show the full output of the build process in real time:

- For **in-progress** deployments, logs stream live as the build runs
- For **completed** deployments, the full log is shown with line numbers

Logs include every step: dependency installation, compilation, container creation, and deployment.

## AI Build Fix

When a deployment fails, CranL can analyze the error and suggest fixes:

1. Open a failed deployment from the history
2. Click **AI Fix**
3. CranL analyzes the build logs and provides:
     - **Error summary** — What went wrong
     - **Root cause** — Why it happened
     - **Suggested fixes** — Specific code or configuration changes

The AI fix can suggest environment variable changes, missing dependencies, configuration fixes, and more. Suggested environment variable fixes can be applied with one click.

Note

AI Fix is available only for Git-based applications with failed deployments.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/environment-variables.html -->

<!-- ============================================ -->


## Environment Variables

_Source: https://docs.cranl.com/platform/environment-variables.html_


# Environment Variables

Environment variables let you pass configuration to your application without hardcoding values in your source code. Common uses include database URLs, API keys, and feature flags.

## Viewing Variables

1. Open your application’s detail page
2. Go to the **Environment** tab
3. All variables are listed with their values hidden by default

Click the eye icon to reveal a value.

## Adding Variables

1. Click **Add Variable**
2. Enter the key and value
3. Click **Save**

The application is not restarted automatically — deploy or reload to apply changes.

## Editing Variables

You can edit variables in two modes:

### Form Mode

Edit individual key-value pairs in a table. Each row has fields for the key and value, plus a delete button.

### Raw Mode

Switch to raw text mode to bulk-edit all variables at once. Variables are formatted as `KEY=VALUE`, one per line:

```
DATABASE_URL=postgresql://user:pass@host:5432/mydb
NODE_ENV=production
PORT=3000
```

## Injected Variables

When you create a database with the **inject** option, CranL automatically adds the connection string as an environment variable:

- **PostgreSQL/MySQL/MariaDB:** `DATABASE_URL`
- **MongoDB:** `DATABASE_URL`
- **Redis:** `REDIS_URL`

These variables are managed like any other — you can view, edit, or delete them.

Tip

Never commit secrets to your Git repository. Use environment variables for API keys, database passwords, and other sensitive configuration.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/domains-ssl.html -->

<!-- ============================================ -->


## Domains & SSL

_Source: https://docs.cranl.com/platform/domains-ssl.html_


# Domains & SSL

Every CranL application gets a free subdomain with SSL. You can also add your own custom domains.

## Default Domain

When you create an application, it’s automatically assigned a subdomain:

```
https://<app-name>-<id>.cranl.net
```

This domain has:

- **HTTPS** enabled with a wildcard SSL certificate
- **CDN** caching via BunnyCDN for all regions, LightCDN for egypt region
- **No configuration required** — it works immediately after deployment

## Custom Domains

### Adding a Domain

1. Open your application’s detail page
2. Go to the **Domains** tab
3. Click **Add Domain**
4. Enter your domain (e.g., `api.example.com`)
5. Click **Add**

### DNS Configuration

After adding a custom domain, you need to create a DNS record with your DNS provider:

**For subdomains** (e.g., `api.example.com`):

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `api` | `<app-name>-<id>.cranl.net` |

**For root domains** (e.g., `example.com`):

Use an **A** record, **ALIAS**, or **ANAME** record if your DNS provider supports it. Not all providers support CNAME at the root level.

### SSL Certificates

SSL certificates are provisioned automatically once your DNS record is active. No manual steps required.

- Certificate issuance typically takes 1–5 minutes after DNS propagation
- The **Domains** tab shows the SSL status: `active` or `pending`
- Certificates are renewed automatically before expiration

### Removing a Domain

Click the delete button next to any custom domain in the **Domains** tab. The default `*.cranl.net` domain cannot be removed.

## Plan Limits

The number of custom domains is limited by your plan:

- **Basic:** 1 custom domain
- **Pro:** 10 custom domains
- **Enterprise:** Unlimited

See [Billing](billing.html) to upgrade your plan.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/databases.html -->

<!-- ============================================ -->


## Databases

_Source: https://docs.cranl.com/platform/databases.html_


# Databases

CranL provides managed databases with automatic provisioning and connection string management.

## Supported Types

| Database | Description |
| --- | --- |
| **PostgreSQL** | Relational database, most popular choice |
| **MySQL** | Widely used relational database |
| **MariaDB** | MySQL-compatible open source database |
| **MongoDB** | Document database for flexible schemas |
| **Redis** | In-memory key-value store for caching and sessions |

## Creating a Database

1. Go to **Applications** in the sidebar
2. Click **New Database**
3. Configure:
     - **Name** — A name for your database
     - **Type** — Select from the supported types above
     - **Region** — Where to deploy (same options as applications)
     - **Inject into App** (optional) — Select an application to automatically add the connection string as an environment variable
4. Click **Create**

Credentials (username, password, connection string) are generated automatically.

Note

Applications and databases share the same plan limit. Basic allows 3 combined, Pro allows 20, Enterprise is unlimited.

## Database Status

- **Running** — Database is online and accepting connections
- **Pending** — Database is being provisioned
- **Stopped** — Database is offline
- **Failed** — Provisioning failed

## Managing Databases

From the database detail page you can:

- **Start** — Bring a stopped database back online
- **Stop** — Take the database offline (data is preserved)
- **Delete** — Permanently remove the database and all its data

Warning

Deleting a database is permanent and cannot be undone. All data stored in the database is lost.

## Connection Information

The database detail page shows connection details including:

- Database name
- Username
- Host address
- Connection string

Use the connection string in your application’s environment variables to connect. If you used the **inject** option during creation, this is done automatically.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/monitoring.html -->

<!-- ============================================ -->


## Monitoring

_Source: https://docs.cranl.com/platform/monitoring.html_


# Monitoring

Monitor your application’s resource usage in real time from the dashboard.

## Viewing Metrics

1. Open your application’s detail page
2. Go to the **Monitoring** tab

## Available Metrics

### CPU Usage

Shows the current CPU utilization as a percentage. Helps identify if your application is compute-bound or needs optimization.

### Memory Usage

Displays current memory consumption versus the allocated limit:

```
Memory: 256.0 / 512.0 MB
```

If your application consistently uses memory close to the limit, it may experience out-of-memory errors.

### Disk Usage

Shows disk space consumed by your application’s container:

```
Disk: 128.0 / 1024.0 MB
```

This includes your application files, dependencies, build artifacts, and any data written to the local filesystem.

Tip

For persistent data storage, use a managed [Databases](databases.html) or [Storage](storage.html) bucket instead of the local filesystem. Container disk is ephemeral and resets on each deployment.

## Runtime Logs

View your application’s stdout and stderr output from the **Logs** section on the application detail page. Logs show the latest output from your running application.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/analytics.html -->

<!-- ============================================ -->


## Analytics

_Source: https://docs.cranl.com/platform/analytics.html_


# Analytics

CranL provides traffic analytics for every application, showing how your app is being used.

## Viewing Analytics

1. Open your application’s detail page
2. Go to the **Analytics** tab
3. Select a time range: **24 hours**, **7 days**, or **30 days**

## Traffic Overview

The analytics dashboard shows:

- **Total Requests** — Number of HTTP requests received
- **Total Bandwidth** — Data transferred (shown in TB, GB, or MB)
- **Average Response Time** — Mean response time in milliseconds
- **Unique Visitors** — Distinct visitors based on IP

## Request Chart

A time-series chart showing request volume over the selected period. Granularity adjusts automatically:

- **24 hours** — Hourly data points
- **7 / 30 days** — Daily data points

## Error Breakdown

See how many responses fell into each category:

- **3xx** — Redirects
- **4xx** — Client errors (not found, unauthorized, etc.)
- **5xx** — Server errors

## Geographic Data

A breakdown of traffic by country, showing:

- Country name and flag
- Request count per country

This helps you understand where your users are located and whether your chosen [Regions](../cli/regions.html) is optimal for your audience.

## Top Paths

The most requested URL paths in your application, ranked by request count. Useful for identifying your busiest endpoints.

## Refreshing Data

Click the refresh button to fetch the latest analytics data. Analytics data may have a short delay (a few minutes) from real-time traffic.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/schedules.html -->

<!-- ============================================ -->


## Schedules (Cron Jobs)

_Source: https://docs.cranl.com/platform/schedules.html_


# Schedules (Cron Jobs)

Run recurring tasks inside your application on a schedule using cron expressions.

## Viewing Schedules

1. Open your application’s detail page
2. Go to the **Schedule** tab

All configured cron jobs are listed with their name, expression, and status.

## Creating a Schedule

1. Click **New Schedule**
2. Fill in the fields:
     - **Name** — A descriptive name for the job
     - **Cron Expression** — When to run (see presets below)
     - **Command** — The shell command to execute inside your application container
3. Click **Create**

### Cron Presets

Common schedules you can select from:

| Preset | Expression |
| --- | --- |
| Every minute | `* * * * *` |
| Every 5 minutes | `*/5 * * * *` |
| Every hour | `0 * * * *` |
| Every day (midnight) | `0 0 * * *` |
| Every week (Sunday midnight) | `0 0 * * 0` |
| Every month (1st, midnight) | `0 0 1 * *` |

You can also enter a custom cron expression. The dashboard shows a human-readable description next to the expression.

## Managing Schedules

### Enable / Disable

Toggle a schedule on or off without deleting it. Disabled schedules show a **Paused** badge.

### Run Now

Click the **Run** button to execute a schedule immediately, without waiting for the next scheduled time. Useful for testing.

### Edit

Update the name, cron expression, or command of an existing schedule.

### Delete

Remove a schedule permanently.

Note

Schedules run inside your application’s container using bash. The command has access to the same environment variables and filesystem as your application. The default timezone is **UTC**.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/storage.html -->

<!-- ============================================ -->


## Storage

_Source: https://docs.cranl.com/platform/storage.html_


# Storage

CranL provides S3-compatible object storage for files, assets, backups, and any other data your application needs.

Note

Storage is available on **Pro** and **Enterprise** plans. Pro allows 1 bucket, Enterprise allows up to 5.

## Creating a Bucket

1. Go to **Storage** in the sidebar
2. Click **New Bucket**
3. Enter a bucket name
4. Click **Create**

The bucket is provisioned instantly and ready to use.

## File Manager

Each bucket has a built-in file manager accessible from the dashboard.

### Uploading Files

- Click **Upload** and select files from your computer
- A progress bar shows upload status
- Files appear in the list immediately after upload

### Creating Folders

- Click **New Folder**
- Enter a folder name
- Navigate into folders using the breadcrumb navigation

### Downloading Files

Click the download button next to any file to download it directly.

### Deleting Files

Select files and click **Delete**, or use the context menu (right-click) on individual files. A confirmation dialog appears before deletion.

### View Modes

Switch between **grid** and **list** view using the toggle in the toolbar.

## S3 Credentials

To access your bucket programmatically (from your application or external tools), create S3 credentials.

### Creating Credentials

1. Open the bucket detail page
2. Go to the **Credentials** section
3. Click **Create Credentials**
4. Copy the **Access Key** and **Secret Key** — they are shown only once

Warning

The secret key is displayed only at creation time. Store it securely. If you lose it, delete the credential and create a new one.

### Using Credentials

Use any S3-compatible SDK or tool with your credentials. The endpoint URL is shown on the bucket detail page.

Example with AWS CLI:

```
aws s3 ls s3://your-bucket-name \
  --endpoint-url https://your-endpoint-url \
  --region auto
```

### Deleting Credentials

Click the delete button next to a credential to revoke it immediately. Applications using that credential will lose access.

## Bucket Information

The bucket detail page shows:

- Bucket name
- Storage usage and quota
- Object count
- CDN URL (if configured)




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/team-members.html -->

<!-- ============================================ -->


## Team Members

_Source: https://docs.cranl.com/platform/team-members.html_


# Team Members

Invite team members to collaborate on projects. Each project has its own member list with role-based access.

## Roles

| Role | Permissions |
| --- | --- |
| **Admin** | Full access — create, edit, delete applications, databases, and settings |
| **Viewer** | Read-only access to analytics and monitoring |

The **organization owner** has admin access to all projects and can manage members across the organization.

## Inviting Members

1. Go to **Projects** in the sidebar
2. Click on the project you want to add members to
3. Go to the **Team** section
4. Enter the member’s email address
5. Select a role: **Admin** or **Viewer**
6. Click **Invite**

The invited person receives an email with a link to accept the invitation.

### Invitation Details

- Invitations expire after **24 hours**
- The invite shows a countdown until expiration
- Pending invitations appear in the member list with a **Pending** badge
- The invitee must accept with the same email address the invitation was sent to

## Accepting an Invitation

1. Click the invitation link in the email
2. Log in to CranL (or create an account if you don’t have one)
3. Review the invitation details: project name, role, who invited you
4. Click **Accept**

After accepting, the project appears in your sidebar and you can access it based on your assigned role.

## Managing Members

### Changing Roles

Click on a member’s role to change it between **Admin** and **Viewer**. Only the project owner or organization owner can change roles.

### Removing Members

Click the remove button next to a member to revoke their access. This takes effect immediately.

## Locked Accounts

If an organization’s subscription is canceled or overdue, the account is **locked**. In this state:

- All resources become read-only
- No new applications, databases, or projects can be created
- Existing applications and databases are stopped
- Reactivate the subscription from [Billing](billing.html) to restore access




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/billing.html -->

<!-- ============================================ -->


## Billing

_Source: https://docs.cranl.com/platform/billing.html_


# Billing

Manage your subscription, view plan limits, and handle payments from the Billing page.

## Viewing Your Plan

Go to **Billing** in the sidebar to see:

- Your current plan (Basic, Pro, or Enterprise)
- Monthly price
- Subscription status
- Next billing date

## Plans

| Feature | Basic (4.99$) | Pro ($9/mo) | Enterprise ($14.99/mo) |
| --- | --- | --- | --- |
| **Projects** | 2 | 10 | Unlimited |
| **Apps & Databases** | 3 combined | 20 combined | Unlimited |
| **Custom Domains** | 1 | 10 | Unlimited |
| **Storage Buckets** | — | 1 | 5 |
| **MENA Regions** | — | Yes | Yes |

## Upgrading

1. Go to **Billing**
2. Review the plan comparison
3. Click **Upgrade** on the plan you want
4. Complete payment through Stripe

Upgrades take effect immediately. You’re charged a prorated amount for the remainder of the billing cycle.

## Downgrading

You can switch to a lower plan at any time. If your current resource usage exceeds the new plan’s limits, you’ll need to remove resources before the downgrade takes effect.

## Managing Payment

Click **Manage Billing** to open the Stripe billing portal where you can:

- Update your payment method
- View past invoices
- Download receipts
- Cancel your subscription

## Subscription Status

| Status | Description |
| --- | --- |
| **Active** | Subscription is current and paid |
| **Canceling** | Subscription will end at the next billing date |
| **Past Due** | Payment failed — update your payment method to avoid suspension |
| **Canceled** | Subscription ended — account is locked |

## Canceled Accounts

When a subscription is canceled:

- All applications and databases are stopped
- The account is locked (read-only mode)
- A banner appears across the dashboard
- Resubscribe to restore full access

Your data is preserved for a grace period, but resources remain offline until you reactivate.

## Coupons

If you have a coupon or promotion code, contact support to have it applied to your account.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/platform/settings.html -->

<!-- ============================================ -->


## Settings

_Source: https://docs.cranl.com/platform/settings.html_


# Settings

The Settings page lets you view your profile, manage API keys, and see organization details.

Go to **Settings** in the sidebar to access this page.

## Profile

View your account information:

- **Name** — First and last name
- **Email** — Your login email
- **Phone** — Phone number set during registration

## Organization

View your organization details:

- **Organization Name** — The name of your organization
- **Your Role** — Your role within the organization (Owner, Admin)

## API Keys

API keys are used to authenticate with the CranL CLI and API.

### Creating a Key

1. Scroll to the **API Keys** section
2. Click **Create API Key**
3. Enter a descriptive name (e.g., “CI/CD Pipeline”, “Local Development”)
4. Click **Create**
5. Copy the key immediately — it is shown **only once**

Warning

The full API key is displayed only at creation time. If you lose it, revoke the key and create a new one.

API keys use the format `cranl_sk_<random characters>`.

### Viewing Keys

The API keys table shows:

- Key name
- Key prefix (last 4 characters for identification)
- Last used date
- Creation date

### Revoking a Key

Click **Revoke** next to any key to disable it immediately. Any CLI sessions or API integrations using that key will stop working.

You can have up to **10 active API keys**.

### Using API Keys

API keys are used for:

- **CLI authentication:** `cranl login <api-key>`
- **API requests:** `Authorization: Bearer <api-key>`
- **MCP connections:** Configure your AI IDE with the key (see [IDE Setup](../mcp/setup.html))




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/index.html -->

<!-- ============================================ -->


## CLI Reference

_Source: https://docs.cranl.com/cli/index.html_


# CLI Reference

The CranL CLI lets you manage applications, databases, and infrastructure from the terminal.

```
cranl <command> [subcommand] [arguments] [flags]
```

## Installation

### macOS & Linux

```
curl -fsSL https://cranl.com/install.sh | bash
```

This detects your OS and architecture, downloads the correct binary, verifies the checksum, and installs to `/usr/local/bin/cranl`.

### Windows

```
powershell -NoExit -c "irm https://cranl.com/install.ps1 | iex"
```

Installs to `%LOCALAPPDATA%\cranl\cranl.exe` and adds it to your user PATH.

### Manual Download

Download from `https://cli.cranl.com/`:

| Platform | Binary |
| --- | --- |
| Linux x64 | `cranl-linux-x64` |
| Linux ARM64 | `cranl-linux-arm64` |
| macOS x64 (Intel) | `cranl-darwin-x64` |
| macOS ARM64 (Apple Silicon) | `cranl-darwin-arm64` |
| Windows x64 | `cranl-windows-x64.exe` |

After downloading:

```
chmod +x cranl-linux-x64
sudo mv cranl-linux-x64 /usr/local/bin/cranl
```

Verify with `cranl version`. Update with `cranl update`. Uninstall by removing the binary and `~/.cranl`.

## Commands Overview

| Command | Description |
| --- | --- |
| `cranl login` | Authenticate with an API key |
| `cranl logout` | Remove stored credentials |
| `cranl whoami` | Show current user info |
| `cranl projects list` | List projects |
| `cranl projects create` | Create a project |
| `cranl projects select` | Set default project |
| `cranl apps list` | List applications |
| `cranl apps create` | Create application from GitHub |
| `cranl apps deploy` | Trigger deployment |
| `cranl apps logs` | View runtime logs |
| `cranl apps env set` | Set environment variables |
| `cranl db list` | List databases |
| `cranl db create` | Create managed database |
| `cranl regions` | List deploy regions |
| `cranl mcp` | Start MCP server for AI IDEs |
| `cranl update` | Self-update the CLI |
| `cranl version` | Print version |

## Configuration

The CLI stores configuration in `~/.cranl/config.json` with `0600` permissions (owner-only read/write).

```
{
  "api_key": "cranl_sk_...",
  "api_url": "https://app.cranl.com",
  "default_project_id": "uuid"
}
```

## Global Behavior

- All API communication is over **HTTPS** (HTTP is rejected)
- Authentication uses **Bearer token** in the `Authorization` header
- The CLI never echoes your API key after initial login
- Commands that require a project use the default project set by `cranl projects select`




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/authentication.html -->

<!-- ============================================ -->


## Authentication

_Source: https://docs.cranl.com/cli/authentication.html_


# Authentication

## cranl login

Authenticate with CranL using an API key.

```
cranl login <api-key>
```

**Flow:**

1. Validates the key format (must start with `cranl_sk_`)
2. Verifies the key against the CranL API
3. Stores the key in `~/.cranl/config.json`

**Example:**

```
$ cranl login cranl_sk_abc12345...
✓ Authenticated as [email protected] (My Organization)
```

Getting an API Key

Generate API keys from your [dashboard settings](https://app.cranl.com/dashboard/settings)
under the **API Keys** section. The full key is shown only once at creation time.

## cranl logout

Remove stored credentials.

```
cranl logout
```

Deletes the API key and default project ID from the local config file.

**Example:**

```
$ cranl logout
✓ Logged out successfully.
```

## cranl whoami

Display current user and organization information.

```
cranl whoami
```

**Example:**

```
$ cranl whoami
  Email:        [email protected]
  Name:         Alice Smith
  Organization: My Organization
  Org ID:       550e8400-e29b-41d4-a716-446655440000
  Project:      Production
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/projects.html -->

<!-- ============================================ -->


## Projects

_Source: https://docs.cranl.com/cli/projects.html_


# Projects

Projects are containers for applications and databases. Every resource belongs to a project.

## cranl projects list

List all projects you have access to.

```
cranl projects list
```

Alias: `cranl projects` (without subcommand)

**Example:**

```
$ cranl projects list
Name          ID                                    Default
Production    550e8400-e29b-41d4-a716-446655440000  ✓
Staging       660e8400-e29b-41d4-a716-446655440001
```

## cranl projects create

Create a new project.

```
cranl projects create <name>
```

**Arguments:**

| Argument | Required | Description |
| --- | --- | --- |
| `name` | Yes | Project name |

If this is your first project, it is automatically set as the default.

**Example:**

```
$ cranl projects create "Staging"
✓ Project "Staging" created (660e8400-e29b-41d4-a716-446655440001)
```

## cranl projects select

Set a default project. Many commands (like `cranl apps create`) require a default project.

```
cranl projects select <project-id>
```

**Example:**

```
$ cranl projects select 660e8400-e29b-41d4-a716-446655440001
✓ Default project set to "Staging"
```

Run `cranl projects list` first to find the project ID.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/applications.html -->

<!-- ============================================ -->


## Applications

_Source: https://docs.cranl.com/cli/applications.html_


# Applications

Commands for creating, deploying, and managing applications.

## cranl apps list

List all applications you have access to.

```
cranl apps list
```

Alias: `cranl apps` (without subcommand)

**Example:**

```
$ cranl apps list
Name        Status    Branch  Project      ID
my-api      running   main    Production   a1b2c3d4
frontend    error     main    Production   e5f6g7h8
staging-app idle      dev     Staging      i9j0k1l2
```

Status is color-coded: **green** (running/done), **red** (error), **yellow** (idle).

## cranl apps create

Create a new application from a GitHub repository.

```
cranl apps create --repo <repository-id> [--name NAME] [--branch BRANCH] [--build-type TYPE] [--region REGION]
```

**Prerequisites:**

- Default project must be set (`cranl projects select <project-id>`)
- GitHub must be connected (`cranl github connect`)

**Flags:**

| Flag | Required | Description |
| --- | --- | --- |
| `--repo <id>` | Yes | GitHub repository ID (from `cranl github repos`) |
| `--name <name>` | No | Application name (defaults to repo name) |
| `--branch <branch>` | No | Git branch to deploy (defaults to `main`) |
| `--build-type <type>` | No | `nixpacks` or `dockerfile` (defaults to `nixpacks`) |
| `--region <region>` | No | Deploy region (see [Regions](regions.html), defaults to `germany-1`) |

The application deploys automatically after creation.

**Example:**

```
$ cranl apps create --repo 12345 --name my-api --region us-east-1
✓ Application "my-api" created (a1b2c3d4-...)
```

## cranl apps info

Show details for an application.

```
cranl apps info <app-id>
```

**Example:**

```
$ cranl apps info a1b2c3d4
  Name:     my-api
  ID:       a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Status:   running
  Branch:   main
  URL:      https://my-api-abc123.cranl.net
  Created:  2025-01-15T10:30:00Z
```

## cranl apps delete

Delete an application. Requires the `--yes` flag to confirm.

```
cranl apps delete <app-id> --yes
```

**Example:**

```
$ cranl apps delete a1b2c3d4 --yes
✓ Application deleted.
```

## cranl apps deploy

Trigger a new deployment.

```
cranl apps deploy <app-id>
```

**Example:**

```
$ cranl apps deploy a1b2c3d4
✓ Deployment triggered.
View logs: cranl apps deployments logs a1b2c3d4 <deployment-id>
```

## cranl apps logs

View runtime logs for an application.

```
cranl apps logs <app-id>
```

## cranl apps monitoring

View CPU, memory, and disk usage.

```
cranl apps monitoring <app-id>
```

**Example:**

```
$ cranl apps monitoring a1b2c3d4
  CPU:    12.5%
  Memory: 256.0 / 512.0 MB
  Disk:   128.0 / 1024.0 MB
```

## Lifecycle Commands

### cranl apps start

Start a stopped application.

```
cranl apps start <app-id>
```

### cranl apps stop

Stop a running application.

```
cranl apps stop <app-id>
```

### cranl apps restart

Restart an application (soft reload).

```
cranl apps restart <app-id>
```

### cranl apps rebuild

Rebuild an application from source.

```
cranl apps rebuild <app-id>
```

## Environment Variables

See Applications subsection or use these commands directly:

### cranl apps env list

List environment variables.

```
cranl apps env list <app-id>
```

**Example:**

```
$ cranl apps env list a1b2c3d4
Key             Value
DATABASE_URL    postgresql://admin:pass@host:5432/mydb
NODE_ENV        production
PORT            3000
```

### cranl apps env set

Set one or more environment variables. Merges with existing variables.

```
cranl apps env set <app-id> KEY=VALUE [KEY2=VALUE2 ...]
```

**Example:**

```
$ cranl apps env set a1b2c3d4 NODE_ENV=production PORT=3000
✓ Updated 2 environment variable(s).
```

### cranl apps env unset

Remove one or more environment variables.

```
cranl apps env unset <app-id> KEY [KEY2 ...]
```

**Example:**

```
$ cranl apps env unset a1b2c3d4 DEBUG
✓ Removed 1 environment variable(s).
```

### cranl apps env push

Upload a `.env` file to an application. Merges with existing variables.

```
cranl apps env push <app-id> [file]
```

**Arguments:**

| Argument | Required | Description |
| --- | --- | --- |
| `app-id` | Yes | Application ID |
| `file` | No | Path to env file (defaults to `.env`) |

**Example:**

```
$ cranl apps env push a1b2c3d4
✓ Pushed 8 variable(s) from .env.
```

## Deployment History

### cranl apps deployments list

View deployment history.

```
cranl apps deployments list <app-id>
```

**Example:**

```
$ cranl apps deployments list a1b2c3d4
Status  Commit   Message                   Date                  ID
done    abc1234  fix: update config         2025-01-15 10:30:00   dep-001
error   def5678  feat: add new endpoint     2025-01-14 09:00:00   dep-002
done    ghi9012  initial commit             2025-01-13 08:00:00   dep-003
```

### cranl apps deployments logs

View build logs for a specific deployment.

```
cranl apps deployments logs <app-id> <deployment-id>
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/databases.html -->

<!-- ============================================ -->


## Databases

_Source: https://docs.cranl.com/cli/databases.html_


# Databases

CranL provides managed databases with automatic provisioning, backups, and connection string management.

## Supported Types

| Type | Value | Aliases |
| --- | --- | --- |
| PostgreSQL | `postgresql` | `pg`, `postgres` |
| MySQL | `mysql` | — |
| MariaDB | `mariadb` | — |
| MongoDB | `mongodb` | `mongo` |
| Redis | `redis` | — |

## cranl db list

List all databases.

```
cranl db list
```

Alias: `cranl db` (without subcommand)

**Example:**

```
$ cranl db list
Name      Type         Status    Project      ID
mydb      postgresql   running   Production   db-001
cache     redis        running   Production   db-002
analytics mongodb      idle      Staging      db-003
```

## cranl db create

Create a managed database.

```
cranl db create --name <name> --type <type> [--region REGION] [--inject APP-ID]
```

**Flags:**

| Flag | Required | Description |
| --- | --- | --- |
| `--name <name>` | Yes | Database name |
| `--type <type>` | Yes | Database type (`postgresql`, `mysql`, `mariadb`, `mongodb`, `redis`). Aliases: `pg`, `postgres`, `mongo` |
| `--region <region>` | No | Deploy region alias (`eu`, `us`, `mena`, `egypt`, `asia`). Defaults to `eu` |
| `--inject <app-id>` | No | Inject `DATABASE_URL` into an application |

**Region aliases:**

| Alias | Region |
| --- | --- |
| `eu`, `europe` | Germany 1 |
| `us`, `usa` | US East 1 |
| `mena`, `sa` | Saudi Arabia 1 |
| `egypt`, `eg` | Egypt 1 |
| `asia`, `india` | India 1 |

**Example:**

```
$ cranl db create --name mydb --type pg --region eu --inject a1b2c3d4
✓ Database "mydb" (postgresql) created. ID: db-001
✓ Injected DATABASE_URL into app a1b2c3d4
```

## cranl db info

Show database details including connection string.

```
cranl db info <db-id>
```

**Example:**

```
$ cranl db info db-001
  Name:       mydb
  ID:         db-001
  Type:       postgresql
  Status:     running
  Database:   mydb
  User:       admin
  Host:       mydb-abc123.internal
  Connection: postgresql://admin:pass@host:5432/mydb
  Created:    2025-01-15T10:30:00Z
```

## cranl db delete

Delete a database. Requires the `--yes` flag to confirm.

```
cranl db delete <db-id> --yes
```

Warning

This permanently deletes the database and all its data. This action cannot be undone.

## cranl db start

Start a stopped database.

```
cranl db start <db-id>
```

## cranl db stop

Stop a running database.

```
cranl db stop <db-id>
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/domains.html -->

<!-- ============================================ -->


## Domains

_Source: https://docs.cranl.com/cli/domains.html_


# Domains

Every application gets a free `*.cranl.net` subdomain with SSL. You can also add custom domains.

## cranl apps domains list

List all domains configured for an application.

```
cranl apps domains list <app-id>
```

**Example:**

```
$ cranl apps domains list a1b2c3d4
Domain                       HTTPS  Port
my-api-abc123.cranl.net      true   443
api.example.com              true   443
```

## cranl apps domains add

Add a custom domain to an application.

```
cranl apps domains add <app-id> <domain>
```

**Example:**

```
$ cranl apps domains add a1b2c3d4 api.example.com
✓ Domain "api.example.com" added.
Point a CNAME record to: my-api-abc123.cranl.net
```

## DNS Configuration

After adding a custom domain, create a **CNAME** record with your DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `api.example.com` | `my-api-abc123.cranl.net` |

For root domains (`example.com`), use an **A** record or ALIAS/ANAME if your DNS provider supports it.

SSL is provisioned automatically once the DNS record is active. No action required.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/github.html -->

<!-- ============================================ -->


## GitHub

_Source: https://docs.cranl.com/cli/github.html_


# GitHub

CranL connects to GitHub via the CranL GitHub App. Once connected, you can deploy from any repository the app has access to.

## cranl github status

Check if GitHub is connected for the current project.

```
cranl github status
```

**Example:**

```
$ cranl github status
✓ GitHub is connected. 12 repositories synced.
```

## cranl github connect

Open the dashboard in your browser to connect the CranL GitHub App.

```
cranl github connect
```

This opens `https://app.cranl.com/dashboard` where you can install the GitHub App and grant repository access.

## cranl github repos

List synced GitHub repositories. Syncs with GitHub first to pick up any new repos.

```
cranl github repos
```

**Example:**

```
$ cranl github repos
Repository              Branch  Language    Private
my-org/api-server       main    TypeScript  No
my-org/frontend         main    JavaScript  No
my-org/internal-tool    main    Python      Yes
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/cli/regions.html -->

<!-- ============================================ -->


## Regions

_Source: https://docs.cranl.com/cli/regions.html_


# Regions

CranL deploys to servers across multiple global regions.

## cranl regions

List all available deploy regions.

```
cranl regions
```

**Example:**

```
$ cranl regions
Region    Server           Location          Status
Europe    Germany 1        Germany (DE)      Available
Europe    Turkey 1         Turkey (TR)       Coming Soon
USA       US East 1        United States (US) Available
MENA      Saudi Arabia 1   Saudi Arabia (SA)  Available
MENA      Egypt 1          Egypt (EG)        Available
MENA      UAE 1            UAE (AE)          Coming Soon
Asia      India 1          India (IN)        Available
Asia      Singapore 1      Singapore (SG)    Coming Soon
Asia      Japan 1          Japan (JP)        Coming Soon
```

Note

**MENA regions** (Saudi Arabia, Egypt, UAE) require a **Pro** or **Enterprise** plan.

## Region Selection

You select a region when creating an application or database:

```
# Interactive — prompts for region
cranl apps create

# Database with region flag
cranl db create --region eu
```

**CLI region aliases:**

| Alias | Region |
| --- | --- |
| `eu`, `europe` | Germany 1 |
| `us`, `usa` | US East 1 |
| `mena`, `sa` | Saudi Arabia 1 |
| `egypt`, `eg` | Egypt 1 |
| `asia`, `india` | India 1 |




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/api/index.html -->

<!-- ============================================ -->


## API Reference

_Source: https://docs.cranl.com/api/index.html_


# API Reference

The CranL REST API lets you manage applications, databases, and projects programmatically.

## Base URL

```
https://app.cranl.com/api
```

## Authentication

All API requests require authentication via an API key sent as a Bearer token:

```
curl -H "Authorization: Bearer cranl_sk_..." https://app.cranl.com/api/applications
```

See [Authentication](authentication.html) for details on creating and managing API keys.

## Response Format

All responses are JSON. Successful responses return the requested data directly. Error responses have this shape:

```
{
  "error": "Description of the error"
}
```

## HTTP Status Codes

| Code | Description |
| --- | --- |
| `200` | Success |
| `400` | Bad request (invalid parameters) |
| `401` | Unauthorized (invalid or missing API key) |
| `403` | Forbidden (insufficient permissions or suspended account) |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

## Rate Limits

API key requests are limited to **120 requests per minute**. When exceeded, the API returns `429 Too Many Requests`.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/api/authentication.html -->

<!-- ============================================ -->


## Authentication

_Source: https://docs.cranl.com/api/authentication.html_


# Authentication

CranL uses API keys for programmatic access. API keys provide the same access as your user account.

## API Key Format

API keys use the format:

```
cranl_sk_<32 random characters>
```

Example: `cranl_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Creating API Keys

1. Go to [Dashboard Settings](https://app.cranl.com/dashboard/settings)
2. Scroll to the **API Keys** section
3. Click **Create API Key**
4. Enter a descriptive name
5. Copy the key — it is shown **only once**

You can have up to **10 active API keys**.

## Using API Keys

Send the API key as a Bearer token in the `Authorization` header:

```
curl -X GET \
  -H "Authorization: Bearer cranl_sk_..." \
  -H "Content-Type: application/json" \
  https://app.cranl.com/api/applications
```

## Verify API Key

**POST /api/cli/auth/verify**

Verify an API key and return user and organization information.

**Request Headers:**

- `Authorization: Bearer cranl_sk_...`

**Response:**

```
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "[email protected]",
    "firstName": "Alice",
    "lastName": "Smith"
  },
  "organization": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "My Organization"
  }
}
```

## Revoking API Keys

Revoke a key from the dashboard settings page. Revoked keys stop working immediately.

## Security Best Practices

- **Never commit API keys** to version control
- **Use environment variables** to store keys in CI/CD
- **Rotate keys regularly** — create a new key, update your systems, then revoke the old one
- **Use descriptive names** so you know which key is used where (e.g., “CI/CD Pipeline”, “Local Development”)
- Keys are stored as **bcrypt hashes** on the server — a database breach does not expose your keys




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/api/applications.html -->

<!-- ============================================ -->


## Applications API

_Source: https://docs.cranl.com/api/applications.html_


# Applications API

Endpoints for managing applications, deployments, environment variables, domains, and lifecycle operations.

## List Applications

**GET /api/applications**

List all applications the authenticated user has access to.

**Response:**

```
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-api",
    "description": "Backend API",
    "status": "running",
    "branch": "main",
    "project_id": "660e8400-...",
    "project_name": "Production",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

**Status values:** `running`, `done`, `error`, `idle`, `pending`

## Create Application

**POST /api/applications**

Create a new application from a GitHub repository.

**Request Body:**

```
{
  "name": "my-api",
  "projectId": "660e8400-...",
  "repositoryId": "repo-id",
  "branch": "main",
  "buildType": "nixpacks",
  "serverId": "jAVVJm91DTLB7gzdQvukC",
  "buildPath": "/",
  "description": "My backend API"
}
```

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Application name |
| `projectId` | Yes | Project ID |
| `repositoryId` | Yes | GitHub repository ID |
| `branch` | No | Git branch (default: `main`) |
| `buildType` | No | `nixpacks` or `dockerfile` (default: `nixpacks`) |
| `serverId` | No | Deploy region server ID (see [Regions](../cli/regions.html)) |
| `buildPath` | No | Path to build from (default: `/`) |
| `description` | No | Application description |

**Response:**

```
{
  "id": "550e8400-...",
  "name": "my-api",
  "status": "pending"
}
```

## Get Application

**GET /api/applications/(*id*)**

Get details for a specific application.

**Parameters:**

- **id** – Application ID

**Response:**

```
{
  "id": "550e8400-...",
  "name": "my-api",
  "description": "Backend API",
  "status": "running",
  "branch": "main",
  "project_id": "660e8400-...",
  "cranl_back_application_id": "internal-id",
  "created_at": "2025-01-15T10:30:00Z"
}
```

## Delete Application

**DELETE /api/applications/(*id*)**

Delete an application. Removes the app, its DNS records, and CDN configuration.

**Parameters:**

- **id** – Application ID

**Permissions:** Admin or owner role required.

**Response:**

```
{
  "success": true
}
```

## Deploy Application

**POST /api/applications/(*id*)/deploy**

Trigger a new deployment from the configured branch.

**Parameters:**

- **id** – Application ID

**Permissions:** Admin or owner role required.

**Response:**

```
{
  "id": "550e8400-...",
  "status": "deploying"
}
```

## Lifecycle

**POST /api/applications/(*id*)/lifecycle**

Perform a lifecycle action on an application.

**Parameters:**

- **id** – Application ID

**Request Body:**

```
{
  "action": "start"
}
```

**Actions:**

| Action | Description |
| --- | --- |
| `start` | Start a stopped application |
| `stop` | Stop a running application |
| `reload` | Soft restart |
| `rebuild` | Full rebuild from source |

**Permissions:** Admin or owner role required. Fails if the organization subscription is suspended.

**Response:**

```
{
  "success": true,
  "action": "start"
}
```

## Environment Variables

**GET /api/applications/(*id*)/environment**

Get environment variables for an application.

**Parameters:**

- **id** – Application ID

**Response:**

```
{
  "env": "DATABASE_URL=postgresql://...\nNODE_ENV=production\nPORT=3000"
}
```

Environment variables are returned as a newline-separated string of `KEY=VALUE` pairs.

**PUT /api/applications/(*id*)/environment**

Update environment variables. Replaces all variables with the provided set.

**Parameters:**

- **id** – Application ID

**Request Body:**

```
{
  "env": "DATABASE_URL=postgresql://...\nNODE_ENV=production\nPORT=3000"
}
```

**Response:**

```
{
  "success": true
}
```

## Deployments

**GET /api/applications/(*id*)/deployments**

List deployment history for an application.

**Parameters:**

- **id** – Application ID

**Response:**

```
{
  "deployments": [
    {
      "deploymentId": "dep-001",
      "title": "abc1234",
      "description": "fix: update config",
      "status": "done",
      "createdAt": "2025-01-15T10:30:00Z",
      "startedAt": "2025-01-15T10:30:05Z",
      "finishedAt": "2025-01-15T10:32:00Z"
    }
  ]
}
```

**Deployment status values:** `done`, `error`, `running`, `queued`

**GET /api/applications/(*id*)/deployments/(*deploymentId*)/logs**

Get build logs for a specific deployment.

**Parameters:**

- **id** – Application ID
- **deploymentId** – Deployment ID

**Response (completed deployment):**

```
{
  "lines": [
    "[2025-01-15 10:30:05] Building...",
    "[2025-01-15 10:31:00] Build complete",
    "[2025-01-15 10:31:30] Deploying..."
  ]
}
```

For in-progress deployments, the response is a **Server-Sent Events (SSE)** stream.

## AI Fix

**GET /api/applications/(*id*)/deployments/(*deploymentId*)/ai-fix**

Get AI-generated fix suggestions for a failed deployment.

**Parameters:**

- **id** – Application ID
- **deploymentId** – Deployment ID (must have status `error`)

**Restrictions:** Only works for git-based applications with failed deployments.

**Response:**

```
{
  "status": "errors_found",
  "app_name": "my-api",
  "error_summary": "Build failed: missing dependency",
  "root_cause": "Package 'xyz' is listed in imports but not in package.json",
  "suggested_fixes": [
    {
      "file_path": "package.json",
      "action": "modify",
      "description": "Add missing dependency",
      "search_replace": [
        {
          "search": "\"dependencies\": {",
          "replace": "\"dependencies\": {\n    \"xyz\": \"^1.0.0\","
        }
      ]
    }
  ],
  "ai_explanation": "The build failed because..."
}
```

## Domains

**GET /api/applications/(*id*)/domains**

List all domains configured for an application.

**Parameters:**

- **id** – Application ID

**Response:**

```
{
  "domains": [
    {
      "domainId": "dom-001",
      "host": "my-api-abc123.cranl.net",
      "https": true,
      "certificateType": "wildcard",
      "sslStatus": "active"
    },
    {
      "domainId": "dom-002",
      "host": "api.example.com",
      "https": true,
      "certificateType": "free",
      "sslStatus": "active"
    }
  ],
  "defaultDomain": "my-api-abc123.cranl.net"
}
```

**POST /api/applications/(*id*)/domains/custom**

Add a custom domain to an application.

**Parameters:**

- **id** – Application ID

**Permissions:** Admin or owner role required.

**Request Body:**

```
{
  "host": "api.example.com"
}
```

**Response:**

```
{
  "success": true,
  "domain": {
    "domainId": "dom-002",
    "host": "api.example.com",
    "https": true,
    "certificateType": "free"
  },
  "sslStatus": "pending",
  "cnameTarget": "my-api-abc123.cranl.net"
}
```

After adding, point a CNAME record from your domain to the `cnameTarget`.

**DELETE /api/applications/(*id*)/domains/custom?domainId=(*domainId*)**

Remove a custom domain.

**Parameters:**

- **id** – Application ID

**Query Parameters:**

- **domainId** – Domain ID to remove

**Permissions:** Admin or owner role required.

**Response:**

```
{
  "success": true
}
```

## Monitoring

**GET /api/applications/(*id*)/monitoring**

Get real-time resource usage metrics.

**Parameters:**

- **id** – Application ID

**Response:** Monitoring data including CPU, memory, and disk usage metrics from the deployment server.

## Analytics

**GET /api/applications/(*id*)/analytics?dateFrom=(*dateFrom*)&dateTo=(*dateTo*)&granularity=(*granularity*)**

Get traffic analytics for an application.

**Parameters:**

- **id** – Application ID

**Query Parameters:**

- **dateFrom** – Start date (ISO 8601, optional)
- **dateTo** – End date (ISO 8601, optional)
- **granularity** – `hour` or `day` (default: `day`)

**Response:**

```
{
  "totalBandwidth": 1048576000,
  "totalRequests": 50000,
  "averageResponseTime": 125,
  "requestsChart": {
    "2025-01-15": 5000,
    "2025-01-16": 4800
  },
  "bandwidthChart": {
    "2025-01-15": 104857600,
    "2025-01-16": 99614720
  },
  "topCountries": [
    {"name": "United States", "count": 15000},
    {"name": "Germany", "count": 8000}
  ],
  "topPaths": [
    {"path": "/api/users", "count": 12000},
    {"path": "/api/products", "count": 8000}
  ],
  "errors": {
    "total3xx": 200,
    "total4xx": 500,
    "total5xx": 10
  }
}
```

## Purge Cache

**POST /api/applications/(*id*)/purge-cache**

Purge the CDN cache for an application.

**Parameters:**

- **id** – Application ID

**Permissions:** Admin or owner role required.

**Response:**

```
{
  "success": true
}
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/api/databases.html -->

<!-- ============================================ -->


## Databases API

_Source: https://docs.cranl.com/api/databases.html_


# Databases API

Endpoints for creating and managing managed databases.

## List Databases

**GET /api/databases**

List all databases the authenticated user has access to.

**Response:**

```
[
  {
    "id": "550e8400-...",
    "name": "mydb",
    "description": "Main database",
    "type": "postgresql",
    "status": "running",
    "server_id": "jAVVJm91DTLB7gzdQvukC",
    "project_id": "660e8400-...",
    "project_name": "Production",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

**Database types:** `postgresql`, `mysql`, `mariadb`, `mongodb`, `redis`

## Create Database

**POST /api/databases**

Create a new managed database.

**Request Body:**

```
{
  "name": "mydb",
  "projectId": "660e8400-...",
  "type": "postgresql",
  "serverId": "jAVVJm91DTLB7gzdQvukC",
  "description": "Main database"
}
```

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Database name |
| `projectId` | Yes | Project ID |
| `type` | Yes | `postgresql`, `mysql`, `mariadb`, `mongodb`, or `redis` |
| `serverId` | No | Deploy region server ID |
| `description` | No | Description |

**Response:**

```
{
  "id": "550e8400-...",
  "name": "mydb",
  "type": "postgresql",
  "status": "pending"
}
```

Passwords and credentials are generated automatically.

## Get Database

**GET /api/databases/(*id*)**

Get database details including connection information.

**Parameters:**

- **id** – Database ID

**Response:**

```
{
  "id": "550e8400-...",
  "name": "mydb",
  "type": "postgresql",
  "project_id": "660e8400-...",
  "cranl_back_database_id": "internal-id"
}
```

## Update Database

**PATCH /api/databases/(*id*)**

Update database name or description.

**Parameters:**

- **id** – Database ID

**Request Body:**

```
{
  "name": "new-name",
  "description": "Updated description"
}
```

Both fields are optional.

**Response:**

```
{
  "success": true
}
```

## Delete Database

**DELETE /api/databases/(*id*)**

Delete a database and all its data.

**Parameters:**

- **id** – Database ID

**Response:**

```
{
  "success": true
}
```

Warning

This permanently deletes the database and all data. This action cannot be undone.

## Database Lifecycle

**POST /api/databases/(*id*)/(*action*)**

Perform a lifecycle action on a database.

**Parameters:**

- **id** – Database ID
- **action** – One of `start`, `stop`, `reload`, `rebuild`, `deploy`

**Response:**

```
{
  "success": true,
  "action": "start",
  "status": "running"
}
```

Fails with `403` if the organization subscription is suspended.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/api/projects.html -->

<!-- ============================================ -->


## Projects API

_Source: https://docs.cranl.com/api/projects.html_


# Projects API

Endpoints for managing projects and project members.

## List Projects

**GET /api/projects**

List all projects the authenticated user has access to.

**Response:**

```
[
  {
    "id": "550e8400-...",
    "name": "Production",
    "organization_id": "660e8400-...",
    "created_at": "2025-01-15T10:30:00Z",
    "access_type": "organization"
  }
]
```

**Access types:**

- `organization` — Access via organization membership
- `project` — Access via direct project invitation

## Create Project

**POST /api/projects**

Create a new project.

**Request Body:**

```
{
  "name": "Staging",
  "organizationId": "660e8400-..."
}
```

**Response:**

```
{
  "id": "770e8400-...",
  "name": "Staging",
  "organization_id": "660e8400-..."
}
```

Subject to plan limits on number of projects.

## Get Project

**GET /api/projects/(*id*)**

Get project details.

**Parameters:**

- **id** – Project ID

**Response:**

```
{
  "id": "550e8400-...",
  "name": "Production",
  "organization_id": "660e8400-...",
  "created_by": "user-id",
  "created_at": "2025-01-15T10:30:00Z",
  "app_count": 5,
  "is_owner": true,
  "access_type": "organization"
}
```

## Update Project

**PUT /api/projects/(*id*)**

Update project name.

**Parameters:**

- **id** – Project ID

**Permissions:** Project creator or organization owner only.

**Request Body:**

```
{
  "name": "New Name"
}
```

**Response:**

```
{
  "success": true,
  "name": "New Name"
}
```

## Delete Project

**DELETE /api/projects/(*id*)**

Delete a project. The project must have no applications.

**Parameters:**

- **id** – Project ID

**Response:**

```
{
  "success": true
}
```

## Project Members

**GET /api/projects/(*id*)/members**

List project members and pending invitations.

**Parameters:**

- **id** – Project ID

**Response:**

```
{
  "members": [
    {
      "id": "member-001",
      "email": "[email protected]",
      "role": "admin",
      "status": "active",
      "invited_at": "2025-01-15T10:30:00Z",
      "accepted_at": "2025-01-15T11:00:00Z",
      "first_name": "Alice",
      "last_name": "Smith"
    }
  ],
  "isOwner": true
}
```

**Roles:** `admin`, `viewer`

**Statuses:** `pending`, `active`, `expired`

**POST /api/projects/(*id*)/members**

Invite a member to a project.

**Parameters:**

- **id** – Project ID

**Permissions:** Project owner or organization owner only.

**Request Body:**

```
{
  "email": "[email protected]",
  "role": "viewer"
}
```

**Response:**

```
{
  "success": true,
  "id": "member-002",
  "email": "[email protected]",
  "role": "viewer",
  "status": "pending",
  "expires_at": "2025-01-16T10:30:00Z"
}
```

Invitations expire after **24 hours**.

**PUT /api/projects/(*id*)/members/(*memberId*)**

Update a member’s role.

**Parameters:**

- **id** – Project ID
- **memberId** – Member ID

**Permissions:** Project owner or organization owner only.

**Request Body:**

```
{
  "role": "admin"
}
```

**DELETE /api/projects/(*id*)/members/(*memberId*)**

Remove a member from a project.

**Parameters:**

- **id** – Project ID
- **memberId** – Member ID

**Permissions:** Project owner or organization owner only.

**Response:**

```
{
  "success": true
}
```




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/mcp/index.html -->

<!-- ============================================ -->


## MCP Integration

_Source: https://docs.cranl.com/mcp/index.html_


# MCP Integration

CranL includes a hosted [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that lets AI coding assistants manage your infrastructure directly.

Connect your IDE to `https://app.cranl.com/api/mcp` with your API key — no binary or local setup needed.

The server exposes 16 tools for deploying apps, creating databases, managing environment variables, viewing logs, and more.

## Supported IDEs

- **Claude Code** (Anthropic)
- **Cursor**
- **Windsurf**
- **VS Code** (with MCP extension)
- Any IDE that supports the MCP protocol

## Quick Start

1. Get an API key from [Settings](https://app.cranl.com/dashboard/settings)
2. Add the MCP configuration to your IDE (see [IDE Setup](setup.html))
3. Start using CranL tools from your AI assistant

Tip

If you have the CranL CLI installed, run `cranl mcp` to see ready-to-copy configuration with your API key pre-filled.

## How It Works

Your AI assistant discovers CranL’s tools and the `cranl://platform-info` resource. It can then deploy apps, create databases, set env vars, check logs, and more — all through natural language.

Security

All requests require a valid API key via `Authorization: Bearer` header. Connections use HTTPS. Rate limited to 120 requests/minute per key.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/mcp/setup.html -->

<!-- ============================================ -->


## IDE Setup

_Source: https://docs.cranl.com/mcp/setup.html_


# IDE Setup

Connect your AI IDE to CranL’s hosted MCP server. No local binary or setup needed.

On this page

- Prerequisites
- Claude Code
- Cursor
- VS Code
- Antigravity
- Windsurf
- Verification
- Troubleshooting

## Prerequisites

1. A CranL account with an API key (get one from [Settings](https://app.cranl.com/dashboard/settings))

## Claude Code

Add to your project’s `.mcp.json` or global `~/.claude.json`:

```
{
  "mcpServers": {
    "cranl": {
      "type": "http",
      "url": "https://app.cranl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer cranl_sk_YOUR_API_KEY"
      }
    }
  }
}
```

Or via CLI:

```
claude mcp add --transport http cranl https://app.cranl.com/api/mcp \
  --header "Authorization: Bearer cranl_sk_YOUR_API_KEY"
```

## Cursor

Add to `.cursor/mcp.json` in your project:

```
{
  "mcpServers": {
    "cranl": {
      "type": "http",
      "url": "https://app.cranl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer cranl_sk_YOUR_API_KEY"
      }
    }
  }
}
```

## VS Code

Add to `.vscode/mcp.json`:

```
{
  "servers": {
    "cranl": {
      "type": "http",
      "url": "https://app.cranl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer cranl_sk_YOUR_API_KEY"
      }
    }
  }
}
```

## Antigravity

Open Additional Options (`...`) > MCP Servers > View raw config, and add:

```
{
  "mcpServers": {
    "cranl": {
      "serverUrl": "https://app.cranl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer cranl_sk_YOUR_API_KEY"
      }
    }
  }
}
```

## Windsurf

Add to `.windsurf/mcp.json`:

```
{
  "mcpServers": {
    "cranl": {
      "type": "http",
      "url": "https://app.cranl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer cranl_sk_YOUR_API_KEY"
      }
    }
  }
}
```

## Verification

After configuring, your AI assistant should be able to:

- List your projects and apps
- Deploy applications
- Create databases
- Set environment variables
- View logs and monitoring data

Try asking your AI assistant: *“List my CranL applications”* or *“Deploy my app”*.

Tip

If you have the CranL CLI installed, run `cranl mcp` to see ready-to-copy configuration with your API key pre-filled.

## Troubleshooting

**“Unauthorized” error**

Your API key is invalid or missing. Check:

- The key starts with `cranl_sk_`
- The `Authorization` header is `Bearer cranl_sk_...` (with the `Bearer` prefix)
- The key hasn’t been revoked in Settings

**“Does not adhere to MCP server configuration schema”**

Make sure the config includes `"type": "http"` inside the server object.

**Tools not showing up**

Restart your IDE after adding the MCP configuration. Some IDEs require a full restart to discover new MCP servers.




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/mcp/tools.html -->

<!-- ============================================ -->


## MCP Tools Reference

_Source: https://docs.cranl.com/mcp/tools.html_


# MCP Tools Reference

The CranL MCP server exposes 16 tools that AI assistants can use to manage your infrastructure.

## Projects

### cranl_list_projects

List all projects the user has access to.

**Parameters:** None

**Returns:** Array of projects with `id`, `name`, `organization_id`, `created_at`.

## Apps

### cranl_list_apps

List all applications with name, status, branch, project, and ID.

**Parameters:** None

**Returns:** Array of applications with `id`, `name`, `description`, `status`, `branch`, `project_id`, `project_name`, `created_at`.

### cranl_create_app

Create a new application from a GitHub repository.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Application name |
| `projectId` | string | Yes | Project ID |
| `repositoryId` | string | Yes | GitHub repository ID |
| `branch` | string | No | Git branch (default: `main`) |
| `buildType` | string | No | `nixpacks` or `dockerfile` (default: `nixpacks`) |
| `region` | string | No | Deploy region ID from `cranl_list_regions` (e.g. `germany-1`, `us-east-1`) |

**Returns:** Created application object.

### cranl_deploy_app

Trigger a new deployment for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

### cranl_app_lifecycle

Start, stop, restart, or rebuild an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |
| `action` | string | Yes | `start`, `stop`, `restart`, or `rebuild` |

## Logs & Monitoring

### cranl_get_app_logs

Get runtime logs for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

**Returns:** Object with `logs` field.

### cranl_get_deployment_logs

Get build logs for a specific deployment.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |
| `deploymentId` | string | Yes | Deployment ID |

**Returns:** Object with `logs` field.

### cranl_get_monitoring

Get CPU, memory, and disk monitoring data for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

**Returns:** Object with `cpu`, `memory`, and `disk` usage data.

### cranl_get_deployments

Get deployment history for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

**Returns:** Array of deployments with `id`, `status`, `commit_message`, `commit_sha`, `created_at`.

## Environment Variables

### cranl_get_env

Get environment variables for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

**Returns:** Object with `env` field (newline-separated `KEY=VALUE` pairs).

### cranl_set_env

Set environment variables. Merges with existing variables — existing variables not included in the update are preserved.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |
| `variables` | object | Yes | Key-value pairs (e.g. `{"NODE_ENV": "production", "PORT": "3000"}`) |

## Databases

### cranl_create_database

Create a managed database.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Database name |
| `projectId` | string | Yes | Project ID |
| `type` | string | Yes | `postgresql`, `mysql`, `mariadb`, `mongodb`, or `redis` |
| `region` | string | No | Deploy region ID from `cranl_list_regions` (e.g. `germany-1`, `us-east-1`) |

**Returns:** Database object with `id`, `name`, `type`, `status`.

### cranl_list_databases

List all managed databases.

**Parameters:** None

**Returns:** Array of databases with `id`, `name`, `type`, `status`, `server_id`, `project_id`, `project_name`, `created_at`.

## Regions & Domains

### cranl_list_regions

List available deploy regions with server IDs.

**Parameters:** None

**Returns:** Array of regions:

```
[
  {
    "id": "germany-1",
    "region": "Europe",
    "server": "Germany 1",
    "country": "Germany",
    "available": true
  },
  {
    "id": "saudi-arabia-1",
    "region": "MENA",
    "server": "Saudi Arabia 1",
    "country": "Saudi Arabia",
    "available": true,
    "note": "Pro/Enterprise plan required"
  }
]
```

Use the `id` field when passing a region to `cranl_create_app` or `cranl_create_database`.

### cranl_list_domains

List domains configured for an application.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |

**Returns:** Array of domain objects with `host`, `https`, `port`, `certificateType`.

## AI Fix

### cranl_get_ai_fix

Get AI-generated fix suggestions for a failed deployment.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | string | Yes | Application ID |
| `deploymentId` | string | Yes | Deployment ID (must be a failed deployment) |

**Returns:** Object with `error_summary`, `root_cause`, `suggested_fixes`, and `ai_explanation`.

## MCP Resource

### cranl://platform-info

A read-only resource that provides platform documentation to AI assistants. This helps the AI understand CranL’s capabilities without needing to make API calls.

**Content includes:**

- Available database types and their features
- Deploy regions with server IDs
- Build types (Nixpacks vs Dockerfile)
- How environment variables work
- Custom domain setup process
- Connection string injection pattern
- Typical deployment workflow




<!-- ============================================ -->

<!-- PAGE: https://docs.cranl.com/openapi.html -->

<!-- ============================================ -->


## OpenAPI Specification

_Source: https://docs.cranl.com/openapi.html_


# OpenAPI Specification

The CranL API is described by an OpenAPI 3.0 specification available for download.

## Download

[`openapi.json`](_downloads/81a4213b3282d6ebe982e56a204421ca/openapi.json)

You can use this specification with tools like:

- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- OpenAPI code generators

## Base URL

```
https://app.cranl.com/api
```

## Authentication

All endpoints require a Bearer token:

```
Authorization: Bearer cranl_sk_...
```

See [Authentication](api/authentication.html) for details on obtaining API keys.

