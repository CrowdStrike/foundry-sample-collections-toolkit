![CrowdStrike Falcon](/images/cs-logo.png?raw=true)

# Collections Toolkit sample Foundry app

The Collections Toolkit sample Foundry app is a community-driven, open source project which serves as an example of an
app which can be built using CrowdStrike's Foundry ecosystem. `foundry-sample-collections` is an open source project,
not a CrowdStrike product. As such, it carries no formal support, expressed or implied.

This app is one of several App Templates included in Foundry that you can use to jumpstart your development. It comes
complete with a set of preconfigured capabilities aligned to its business purpose. Deploy this app from the Templates
page with a single click in the Foundry UI, or create an app from this template using the CLI.

> [!IMPORTANT]  
> To view documentation and deploy this sample app, you need access to the Falcon console.

## Description

The Collections Toolkit sample Foundry app shows how to use collections with functions, workflows, and UI extensions.

## Prerequisites

* The Foundry CLI (instructions below).
* Python 3.13+ (needed if modifying the app's functions).
  See [Python For Beginners](https://www.python.org/about/gettingstarted/) for installation instructions.
* Node 22+ (needed if modifying the app's UI). See https://nodejs.org/en/download for installation instructions.

### Install the Foundry CLI

You can install the Foundry CLI with Scoop on Windows or Homebrew on Linux/macOS.

**Windows**:

Install [Scoop](https://scoop.sh/). Then, add the Foundry CLI bucket and install the Foundry CLI.

```shell
scoop bucket add foundry https://github.com/crowdstrike/scoop-foundry-cli.git
scoop install foundry
```

Or, you can download
the [latest Windows zip file](https://assets.foundry.crowdstrike.com/cli/latest/foundry_Windows_x86_64.zip), expand it,
and add the install directory to your PATH environment variable.

**Linux and macOS**:

Install [Homebrew](https://docs.brew.sh/Installation). Then, add the Foundry CLI repository to the list of formulae that
Homebrew uses and install the CLI:

```shell
brew tap crowdstrike/foundry-cli
brew install crowdstrike/foundry-cli/foundry
```

Run `foundry version` to verify it's installed correctly.

## Getting Started

Clone this sample to your local system,
or [download as a zip file](https://github.com/CrowdStrike/foundry-sample-collections/archive/refs/heads/main.zip) and
import it into Foundry.

```shell
git clone https://github.com/CrowdStrike/foundry-sample-collections
cd foundry-sample-collections
```

Log in to Foundry:

```shell
foundry login
```

Select the following permissions:

- [ ] Create and run RTR scripts
- [x] Create, execute and test workflow templates
- [x] Create, run and view API integrations
- [ ] Create, edit, delete, and list queries

Deploy the app:

```shell
foundry apps deploy
```

> [!TIP]
> If you get an error that the name already exists, change the name to something unique to your CID in `manifest.yml`.

Once the deployment has finished, you can release the app:

```shell
foundry apps release
```

Next, go to **Foundry** > **App catalog**, find your app, and install it. Go to **Fusion SOAR** > **Workflows** to see
the on-demand workflows from this app.

## About this sample app

<!-- Intro below should match app_docs/README.md -->

This sample is designed to show how to use Collections in Falcon Foundry. It contains a few capabilities:

1. Collections:

    - [**event_logs**](collections/event_logs.json)
    - [**processing_checkpoints**](collections/processing_checkpoints.json)
    - [**security_events_csv**](collections/security_events_csv.json)
    - [**threat_intel**](collections/threat_intel.json)
    - [**user_preferences**](collections/user_preferences.json)

2. Python functions:

    - [**csv-import**](functions/csv-import/main.py): Shows how to import CSV files and convert to collection data
    - [**log-event**](functions/log-event/main.py): Uses FalconPy to store data in a collection
    - [**process-events**](functions/process-events/main.py): Processes events with checkpointing to prevent
      duplicates

3. Test workflows to invoke the last two functions.
4. Extensive integration testing for the CSV import via GitHub Actions.
5. UI extensions on **Host setup and management** > **Host management** that can be used to do CRUD (Create, Read, Update, and Delete) on the `user_preferences` collection.

See this sample's [App docs README](app_docs/README.md) for usage information.

## Foundry resources

- Foundry
  documentation: [US-1](https://falcon.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [US-2](https://falcon.us-2.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [EU](https://falcon.eu-1.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
- Foundry learning
  resources: [US-1](https://falcon.crowdstrike.com/foundry/learn) | [US-2](https://falcon.us-2.crowdstrike.com/foundry/learn) | [EU](https://falcon.eu-1.crowdstrike.com/foundry/learn)

---

<p align="center"><img src="/images/cs-logo-footer.png"><br/><img width="300px" src="/images/adversary-goblin-panda.png"></p>
<h3><p align="center">WE STOP BREACHES</p></h3>
