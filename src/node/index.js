#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';
import readline from 'readline';

const log = console.log;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// rl.pause();

function ask(question, cb = () => void 0) {
    return new Promise(resolve => {
        rl.question(question, (...args) => {
            rl.pause();
            resolve(...args);
            cb(...args);
        });
    });
}


log('')
log(chalk.whiteBright('Get Meetings By Venue-Type'), '\n')
log(chalk.magentaBright('Root Servers:'))


fetch('https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json')
    .then(res => res.text())
    .then((rootServerList) => {
        let rootServers = JSON.parse(rootServerList).sort(function(a, b) {
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();

            return (a < b) ? -1 : (a > b) ? 1 : 0;
        });

        let rc = 1;
        for (const rootServer of rootServers) {
            let rootServerName = rootServer.name;
            log(chalk.yellowBright(' ', rc, '', rootServerName))
            rc++
        }
        log('')
        return rootServers
    })
    .then((rootServers) => {
        ask(chalk.magentaBright('Select a root server: '))
            .then(rootserverSelected => {
                log('')
                if (parseInt(rootserverSelected) > rootServers.length) {
                    log(chalk.redBright("Error: Selection must match one of the choices."))
                    process.exit(0)
                }
                let root_server_selected_url = rootServers[rootserverSelected-1]["rootURL"];
                let root_server_selected_name = rootServers[rootserverSelected-1]["name"];
                log(chalk.magentaBright('You Selected:'), chalk.redBright(rootserverSelected, '[' + root_server_selected_name + ']'))
                return root_server_selected_url
            })
            .then(rootServerUrl => {
                log('')
                log(chalk.magentaBright('Regions:'))
                fetch(rootServerUrl + "client_interface/json/?switcher=GetServiceBodies")
                    .then(res => res.text())
                    .then((serviceBodiesRaw) => {
                        let serviceBodiesList = JSON.parse(serviceBodiesRaw).sort(function(a, b) {
                            a = a.name.toLowerCase();
                            b = b.name.toLowerCase();
                            return (a < b) ? -1 : (a > b) ? 1 : 0;
                        });

                        return serviceBodiesList
                    })
                    .then(serviceBodies => {
                        log('')
                        let rl = 1
                        let regions = [];
                        for (const region of serviceBodies) {
                            if (region.type.includes("RS")) {
                                let regionName = region.name;
                                log(chalk.yellowBright(' ', rl, '', regionName))
                                regions.push(region);
                                rl++
                            }
                        }
                        ask(chalk.magentaBright('Select a region: '))
                            .then(regionSelected => {
                                log('')
                                if (parseInt(regionSelected) > regions.length) {
                                    log(chalk.redBright("Error: Selection must match one of the choices."))
                                    process.exit(0)
                                }
                                let region_selected_id = regions[regionSelected-1]["id"];
                                let region_selected_name = regions[regionSelected-1]["name"];
                                log(chalk.magentaBright('You Selected:'), chalk.redBright(regionSelected,
                                    '[' + region_selected_name + ' (' + region_selected_id + ')]'))
                                return region_selected_id
                            })
                            .then(regionId => {
                                log('')
                                log(chalk.magentaBright('Service Bodies:'))
                                // console.log(serviceBodies)

                                log(chalk.magentaBright(' ', regionId, '',rootServerUrl))
                                // fetch(rootServerUrl
                                //     + "client_interface/json/?switcher=GetSearchResults&services="
                                // + regionId + "&recursive=1&data_field_key=formats")
                                //     .then(res => res.text())
                                //     .then((meetingsRaw) => {
                                //         let meetings = JSON.parse(meetingsRaw)
                                //         let ml = 0
                                //         let meetingArr = [];
                                //         for (const meeting of meetings) {
                                //             console.log(meeting)
                                //
                                //             ml++
                                //             // if (region.type.includes("RS")) {
                                //             //     let regionName = region.name;
                                //             //     log(chalk.yellowBright(' ', rl, '', regionName))
                                //             //     regionArr.push(region);
                                //             //     rl++
                                //             // }
                                //         }
                                //     })
                                //log(chalk.magentaBright(' ',rootServerUrl, ' ',  regionId))

                            })
                    })
            });
    });
