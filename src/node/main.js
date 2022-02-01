#!/usr/bin/env node

import https from "https";
import readline from "readline";

const log = console.log;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.pause();

class Color {
  static PRPL = "\u001b[1;35m";
  static WHT = "\u001b[1;38m";
  static YLW = "\u001b[1;93m";
  static RED = "\u001b[1;31m";
  static GRN = "\u001b[1;32m";
  static TAL = "\u001b[1;36m";
  static BLU = "\u001b[1;34m";
  static EC = "\u001b[0m";
}

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
log(Color.WHT + "Get Meetings By Venue-Type", Color.EC, "\n");
log(Color.PRPL + "Root Servers:", Color.EC);

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
  log(Color.YLW + " " + rs, "", rootServerName, Color.EC);
  rs++;
}

log("");
const rootServerSelected = await new Promise((resolve) => {
  rl.question(Color.PRPL + "Select a root server: " + Color.EC, resolve);
});

log("");
if (parseInt(rootServerSelected) > tomatoRootServers.length) {
  log(Color.RED + "Error: Selection must match one of the choices.", Color.EC);
  process.exit(0);
}
let root_server_selected_url =
  tomatoRootServers[rootServerSelected - 1]["rootURL"];
let root_server_selected_name =
  tomatoRootServers[rootServerSelected - 1]["name"];
log(
  Color.PRPL + "You Selected:" + Color.EC,
  Color.RED + rootServerSelected,
  "[" + root_server_selected_name + "]",
  Color.EC
);
log("");
log(Color.PRPL + "Regions:", Color.EC);

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
    log(Color.YLW + " " + sc, "", regionName, Color.EC);
    regions.push(region);
    sc++;
  }
}

log("");
const regionSelected = await new Promise((resolve) => {
  rl.question(Color.PRPL + "Select a region: " + Color.EC, resolve);
});

log("");
if (parseInt(regionSelected) > regions.length) {
  log(Color.RED + "Error: Selection must match one of the choices.", Color.EC);
  process.exit(0);
}
let region_selected_id = regions[regionSelected - 1]["id"];
let region_selected_name = regions[regionSelected - 1]["name"];
log(
  Color.PRPL + "You Selected:" + Color.EC,
  Color.RED + regionSelected,
  "[" + region_selected_name + "]",
  Color.EC
);

log("");
log(Color.PRPL + "Service Bodies:", Color.EC);
let sb = 1;
let serviceBodyArr = [];
for (const serviceBody of serviceBodies) {
  if (
    serviceBody.parent_id === region_selected_id ||
    serviceBody.id === region_selected_id
  ) {
    let serviceBodyName = serviceBody.name;
    log(Color.YLW + " " + sb, "", serviceBodyName, Color.EC);
    serviceBodyArr.push(serviceBody);
    sb++;
  }
}

log("");
const serviceBodySelected = await new Promise((resolve) => {
  rl.question(Color.PRPL + "Select a service body: " + Color.EC, resolve);
});

log("");
if (parseInt(serviceBodySelected) > serviceBodyArr.length) {
  log(Color.RED + "Error: Selection must match one of the choices.", Color.EC);
  process.exit(0);
}

let service_body_selected_id = serviceBodyArr[serviceBodySelected - 1]["id"];
let service_body_selected_name =
  serviceBodyArr[serviceBodySelected - 1]["name"];
log(
  Color.PRPL + "You Selected:" + Color.EC,
  Color.RED + serviceBodySelected,
  "[" + service_body_selected_name + " (" + service_body_selected_id + ")]",
  Color.EC
);

log("");
const meetingsData = await fetch(
  root_server_selected_url +
    "client_interface/json/?switcher=GetSearchResults&services=" +
    service_body_selected_id +
    "&recursive=1&data_field_key=formats"
);

let allMeetings, inPerson, virtual, hybrid, tempVirtual, tempClosed;
allMeetings = inPerson = virtual = hybrid = tempVirtual = tempClosed = 0;

for (const meeting of meetingsData) {
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
  } else if (
    !formats.includes("VM") &&
    formats.includes("TC") &&
    !formats.includes("HY")
  ) {
    tempClosed++;
  }
  allMeetings++;
}

let totals = {
  inPerson: inPerson,
  virtual: virtual,
  tempVirtual: tempVirtual,
  hybrid: hybrid,
  tempClosed: tempClosed,
  allMeetings: allMeetings,
};

log(Color.WHT + "Total Meetings By Venue Type", Color.EC, "\n");
log(Color.BLU + "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=", Color.EC, "\n");
log(
  Color.TAL + "In-person: " + Color.EC + Color.GRN + totals.inPerson,
  Color.EC
);
log(Color.TAL + "Hybrid: " + Color.EC + Color.GRN + totals.hybrid, Color.EC);
log(Color.TAL + "Virtual: " + Color.EC + Color.GRN + totals.virtual, Color.EC);
log(
  Color.WHT + "Total Meetings: " + Color.EC + Color.GRN + totals.allMeetings,
  Color.EC,
  "\n"
);
log(Color.BLU + "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=", Color.EC, "\n");

rl.pause();
