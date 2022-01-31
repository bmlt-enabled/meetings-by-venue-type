#!/usr/bin/env node

import https from 'https';
import chalk from "chalk";
import readline from "readline";

const log = console.log;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
rl.pause();

async function fetch(url) {
    return new Promise(async (resolve, reject) => {
        let body = [];
        const req = https.request(url, res => {
            res.on('data', chunk => body.push(chunk));
            res.on('end', () => {
                const data = JSON.parse(Buffer.concat(body).toString());
                resolve(data);
            });
        });
        req.on('error', e => {
            console.log(`ERROR httpsGet: ${e}`);
            reject(e);
        });
        req.end();
    });
}

log("");
log(chalk.whiteBright("Get Meetings By Venue-Type"), "\n");
log(chalk.magentaBright("Root Servers:"));

const tomatoServersData = await fetch('https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json');

let tomatoRootServers = tomatoServersData.sort(function (a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    return a < b ? -1 : a > b ? 1 : 0;
});

let rs = 1;
for (const rootServer of tomatoRootServers) {
    let rootServerName = rootServer.name;
    log(chalk.yellowBright(" ", rs, "", rootServerName));
    rs++;
}
log("");

const rootServerSelected = await new Promise(resolve => {
    rl.question(chalk.magentaBright("Select a root server: "), resolve)
})

log("");

if (parseInt(rootServerSelected) > tomatoRootServers.length) {
    log(
        chalk.redBright("Error: Selection must match one of the choices.")
    );
    process.exit(0);
}
let root_server_selected_url = tomatoRootServers[rootServerSelected - 1]["rootURL"];
let root_server_selected_name = tomatoRootServers[rootServerSelected - 1]["name"];
log(chalk.magentaBright("You Selected:"),
    chalk.redBright(
        rootServerSelected,
        "[" + root_server_selected_name + "]"
    )
);
log("");
log(chalk.magentaBright("Regions:"));

const rootServersData = await fetch(root_server_selected_url + "client_interface/json/?switcher=GetServiceBodies");

let serviceBodies = rootServersData.sort(function (a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    return a < b ? -1 : a > b ? 1 : 0;
});

let sc = 1;
let regions = [];
for (const region of serviceBodies) {
    if (region.type.includes("RS")) {
        let regionName = region.name;
        log(chalk.yellowBright(" ", sc, "", regionName));
        regions.push(region);
        sc++;
    }
}

log("");
const regionSelected = await new Promise(resolve => {
    rl.question(chalk.magentaBright("Select a region: "), resolve)
})

log("");

if (parseInt(regionSelected) > regions.length) {
    log(
        chalk.redBright("Error: Selection must match one of the choices.")
    );
    process.exit(0);
}
let region_selected_id = regions[regionSelected - 1]["id"];
let region_selected_name = regions[regionSelected - 1]["name"];
log(chalk.magentaBright("You Selected:"),
    chalk.redBright(
        regionSelected,
        "[" + region_selected_name + "]"
    )
);

log("");
log(chalk.magentaBright("Service Bodies:"));
let sb = 1;
let serviceBodyArr = [];
for (const serviceBody of serviceBodies) {
    if (
        serviceBody.parent_id === region_selected_id ||
        serviceBody.id === region_selected_id
    ) {
        let serviceBodyName = serviceBody.name;
        log(chalk.yellowBright(" ", sb, "", serviceBodyName));
        serviceBodyArr.push(serviceBody);
        sb++;
    }
}

log("");

const serviceBodySelected = await new Promise(resolve => {
    rl.question(chalk.magentaBright("Select a service body: "), resolve)
})

log("");

if (parseInt(serviceBodySelected) > serviceBodyArr.length) {
    log(
        chalk.redBright("Error: Selection must match one of the choices.")
    );
    process.exit(0);
}

let service_body_selected_id =
    serviceBodyArr[serviceBodySelected - 1]["id"];
let service_body_selected_name =
    serviceBodyArr[serviceBodySelected - 1]["name"];
log(
    chalk.magentaBright("You Selected:"),
    chalk.redBright(
        serviceBodySelected,
        "[" +
        service_body_selected_name +
        " (" +
        service_body_selected_id +
        ")]"
    )
);

log("");

const meetingsData = await fetch(    root_server_selected_url +
    "client_interface/json/?switcher=GetSearchResults&services=" +
    service_body_selected_id +
    "&recursive=1&data_field_key=formats");

let meetings = meetingsData;
let allMeetings = 0;
let inPerson = 0;
let virtual = 0;
let hybrid = 0;
let tempVirtual = 0;

for (const meeting of meetings) {
    let formats = meeting.formats.split(",");
    if (
        !formats.includes("VM") &&
        !formats.includes("TC") &&
        !formats.includes("HY")
    ) {
        inPerson++;
    } else if (
        formats.includes("VM") &&
        !formats.includes("TC") &&
        !formats.includes("HY")
    ) {
        virtual++;
    } else if (
        formats.includes("VM") &&
        formats.includes("TC") &&
        !formats.includes("HY")
    ) {
        virtual++;
        tempVirtual++;
    } else if (
        !formats.includes("VM") &&
        !formats.includes("TC") &&
        formats.includes("HY")
    ) {
        hybrid++;
    } else if (
        formats.includes("VM") &&
        !formats.includes("TC") &&
        formats.includes("HY")
    ) {
        hybrid++;
    }
    allMeetings++;
}
log(
    chalk.whiteBright("Total Meetings By Venue Type"),
    "\n"
);
log(
    chalk.blueBright(
        "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
    ),
    "\n"
);
log(
    chalk.cyanBright("In-person: ") +
    chalk.greenBright(inPerson)
);
log(
    chalk.cyanBright("Hybrid: ") +
    chalk.greenBright(hybrid)
);
log(
    chalk.cyanBright("Virtual: ") +
    chalk.greenBright(virtual)
);
log(
    chalk.whiteBright("Total Meetings: ") +
    chalk.greenBright(allMeetings),
    "\n"
);
log(
    chalk.blueBright(
        "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
    ),
    "\n"
);

rl.pause();
