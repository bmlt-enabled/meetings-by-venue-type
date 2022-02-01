#!/usr/bin/env node

import https from "https";
import readline from "readline";

const log = console.log;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.pause();

let PRPL = "\u001b[1;35m";
let WHT = "\u001b[1;38m";
let YLW = "\u001b[1;93m";
let RED = "\u001b[1;31m";
let GRN = "\u001b[1;32m";
let TAL = "\u001b[1;36m";
let BLU = "\u001b[1;34m";
let EC = "\u001b[0m";

async function fetch(url) {
  return new Promise(async (resolve, reject) => {
    let body = [];
    const req = https.request(url, (res) => {
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => {
        const data = JSON.parse(Buffer.concat(body).toString());
        resolve(data);
      });
    });
    req.on("error", (e) => {
      console.log(`ERROR httpsGet: ${e}`);
      reject(e);
    });
    req.end();
  });
}

log("");
log(WHT + "Get Meetings By Venue-Type", EC, "\n");
log(PRPL + "Root Servers:", EC);

const tomatoServersData = await fetch(
  "https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json"
);

let tomatoRootServers = tomatoServersData.sort(function (a, b) {
  a = a.name.toLowerCase();
  b = b.name.toLowerCase();

  return a < b ? -1 : a > b ? 1 : 0;
});

let rs = 1;
for (const rootServer of tomatoRootServers) {
  let rootServerName = rootServer.name;
  log(YLW + " " + rs, "", rootServerName, EC);
  rs++;
}
log("");

const rootServerSelected = await new Promise((resolve) => {
  rl.question(PRPL + "Select a root server: " + EC, resolve);
});

log("");

if (parseInt(rootServerSelected) > tomatoRootServers.length) {
  log(RED + "Error: Selection must match one of the choices.", EC);
  process.exit(0);
}
let root_server_selected_url =
  tomatoRootServers[rootServerSelected - 1]["rootURL"];
let root_server_selected_name =
  tomatoRootServers[rootServerSelected - 1]["name"];
log(
  PRPL + "You Selected:" + EC,
  RED + rootServerSelected,
  "[" + root_server_selected_name + "]",
  EC
);
log("");
log(PRPL + "Regions:", EC);

const rootServersData = await fetch(
  root_server_selected_url + "client_interface/json/?switcher=GetServiceBodies"
);

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
    log(YLW + " " + sc, "", regionName, EC);
    regions.push(region);
    sc++;
  }
}

log("");
const regionSelected = await new Promise((resolve) => {
  rl.question(PRPL + "Select a region: " + EC, resolve);
});

log("");

if (parseInt(regionSelected) > regions.length) {
  log(RED + "Error: Selection must match one of the choices.", EC);
  process.exit(0);
}
let region_selected_id = regions[regionSelected - 1]["id"];
let region_selected_name = regions[regionSelected - 1]["name"];
log(
  PRPL + "You Selected:" + EC,
  RED + regionSelected,
  "[" + region_selected_name + "]",
  EC
);

log("");
log(PRPL + "Service Bodies:", EC);
let sb = 1;
let serviceBodyArr = [];
for (const serviceBody of serviceBodies) {
  if (
    serviceBody.parent_id === region_selected_id ||
    serviceBody.id === region_selected_id
  ) {
    let serviceBodyName = serviceBody.name;
    log(YLW + " " + sb, "", serviceBodyName, EC);
    serviceBodyArr.push(serviceBody);
    sb++;
  }
}

log("");

const serviceBodySelected = await new Promise((resolve) => {
  rl.question(PRPL + "Select a service body: " + EC, resolve);
});

log("");

if (parseInt(serviceBodySelected) > serviceBodyArr.length) {
  log(RED + "Error: Selection must match one of the choices.", EC);
  process.exit(0);
}

let service_body_selected_id = serviceBodyArr[serviceBodySelected - 1]["id"];
let service_body_selected_name =
  serviceBodyArr[serviceBodySelected - 1]["name"];
log(
  PRPL + "You Selected:" + EC,
  RED + serviceBodySelected,
  "[" + service_body_selected_name + " (" + service_body_selected_id + ")]",
  EC
);

log("");

const meetingsData = await fetch(
  root_server_selected_url +
    "client_interface/json/?switcher=GetSearchResults&services=" +
    service_body_selected_id +
    "&recursive=1&data_field_key=formats"
);

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

log(WHT + "Total Meetings By Venue Type", EC, "\n");
log(BLU + "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=", EC, "\n");
log(TAL + "In-person: " + EC + GRN + inPerson, EC);
log(TAL + "Hybrid: " + EC + GRN + hybrid, EC);
log(TAL + "Virtual: " + EC + GRN + virtual, EC);
log(WHT + "Total Meetings: " + EC + GRN + allMeetings, EC, "\n");
log(BLU + "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=", EC, "\n");

rl.pause();
