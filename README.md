# CaSMM

> Computation and Science Modeling through Making

Cloud-based programming interface

![Deploy Staging](https://github.com/STEM-C/CaSMM/workflows/Deploy%20Staging/badge.svg)
![Deploy Production](https://github.com/STEM-C/CaSMM/workflows/Deploy%20Production/badge.svg)

<br/>

#### Application

#### `client` 
[client](/client#client) is the frontend of the application. It is powered by [React](https://reactjs.org/) and [Blockly](https://developers.google.com/blockly).

#### `server`

[server](/server#server) is the web server and application server. It is powered by [Node](https://nodejs.org/en/) and [Strapi](https://docs-v3.strapi.io/developer-docs/latest/getting-started/introduction.html).

#### `compile`

  [compile](/compile#compile) is an arduino compiler service. It is an unofficial fork of [Chromeduino](https://github.com/spaceneedle/Chromeduino).

<br/>

#### Environments

> The project is divided into three conceptual environments.

#### Development
#### Structure

The development environment is composed of five servers. The first one is run with the [Create React App](https://create-react-app.dev/docs/getting-started/) dev server. The later four are containerized with docker and run with [docker compose](https://docs.docker.com/compose/).

* `casmm-client-dev` - localhost:3000

* `casmm-server-dev` - localhost:1337/admin

* `casmm-compile-dev` 

* `casmm-db-dev` - localhost:5432

  > The first time the db is started, the [init_db.sh](/scripts/init_db.sh) script will run and seed the database with an environment specific dump. Read about Postgres initialization scripts [here](https://github.com/docker-library/docs/blob/master/postgres/README.md#initialization-scripts). To see how to create this dump, look [here](https://github.com/DavidMagda/CaSMM_fork_2023/blob/develop/scripts/readme.md).

* `casmm-compile_queue-dev`

#### Running

`casmm-client-dev`

1. Follow the [client](/client#setup) setup
2. Run `yarn start` from `/client`

`casmm-server-dev`, `casmm-compile-dev`, `casmm-db-dev`, and `casmm-compile_queue-dev`

1. Install [docker](https://docs.docker.com/get-docker/)

2. Run `docker compose up` from `/`

   > Grant permission to the **scripts** and **server** directories if you are prompted
   

#### Staging

#### Structure

The staging environment is a Heroku app. It is composed of a web dyno, compile dyno, Heroku Postgres add-on, and Heroku Redis add-on.

* `casmm-staging` - [casmm-staging.herokuapp.com](https://casmm-staging.herokuapp.com/)
  * The web dyno runs `server`
  * The compile dyno runs `compile`

#### Running

`casmm-staging` is automatically built from the latest commits to branches matching `release/v[0-9].[0-9]`. Heroku runs the container orchestration from there.

### Production

#### Structure

The production environment is a Heroku app. It is composed of a web dyno, compile dyno, Heroku Postgres add-on, and Heroku Redis add-on.

* `casmm` - [www.casmm.org](https://www.casmm.org/)
  * The web dyno runs `server`
  * The compile dyno runs `compile`

#### Running

`casmm` is automatically built from the latest commits to `master`. Heroku runs the container orchestration from there.

<br/>

#### Maintenance

All three components of the application have their own dependencies managed in their respective `package.json` files. Run `npm outdated` in each folder to see what packages have new releases. Before updating a package (especially new major versions), ensure that there are no breaking changes. Avoid updating all of the packages at once by running `npm update` because it could lead to breaking changes. 

#### Strapi

This is by far the largest and most important dependency we have. Staying up to date with its [releases](https://github.com/strapi/strapi/releases) is important for bug/security fixes and new features. When it comes to actually upgrading Strapi make sure to follow the [migration guides](https://docs-v3.strapi.io/developer-docs/latest/update-migration-guides/migration-guides.html#v3-guides)!

<br/>

#### Branches

There are multiple branches to this Github repository: a development branch (main viable product branch) as well as respective individual branches. Our individual branches holds all the code that we are still working on or many not be entirely functional. Development is what is currently deployed on your website.

#### Features Implemented

- Operational replica of Ardublockly block factory within CASMM
- Block definition extractor fully functional
- Block preview display based on the block definition extracted from the root block
- Arduino code generator base on the custom block preview and definition
- Immediate response of the block factory elements to any change in the toolbox

![testing](https://github.com/Software-Eng-9e/Emerald-Project06-9e/assets/93238079/357a6666-e0ca-41bc-a581-9d49bc45617b)

![image](https://github.com/Software-Eng-9e/Emerald-Project06-9e/assets/93238079/c16b537a-5d7a-428b-9c1b-d6508c1b8765)

![image](https://github.com/Software-Eng-9e/Emerald-Project06-9e/assets/93238079/541c3db4-9356-4540-a120-1b74eb2664d7)

![image](https://github.com/Software-Eng-9e/Emerald-Project06-9e/assets/93238079/de03b5a8-1add-45a3-86d6-6550b42b445f)
![image](https://github.com/Software-Eng-9e/Emerald-Project06-9e/assets/93238079/e4a5c81d-a3c5-4789-9076-a777b72a202a)


#### Updates to Database, Server Connection, and STRAPI Dump Files

- No updates were performed
- This project was produce within CASMM environment

#### Outstanding Work

- Adding custom blocks to the gallery
- Teachers adding custom blocks to classrooms
- Block documentation within the database
- Further stylizing the workspace

#### Built Upon

- Ardublockly Repository:  https://github.com/carlosperate/ardublockly
- BlockyDuinoFactory: https://github.com/BlocklyDuino/BlocklyDuinoFactory





