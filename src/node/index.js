#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';
import readline from 'readline';

const log = console.log;

log('')
log(chalk.whiteBright('Get Meetings By Venue-Type'), '\n')
log(chalk.magentaBright('Root Servers:'))



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
                let rootServerId = rootServer.id
                let rootServerUrl = rootServer.url
                log(chalk.yellowBright(' ', rc, '', rootServerName))
                rc++
            }
            log('')
        return rootServers
    })
    .then(function(rootServers) {
        rl.question(chalk.magentaBright('Select a root server: '), function(rootserverSelected) {
            let root_server_selected_id = rootServers[rootserverSelected-1]["id"];
            let root_server_selected_url = rootServers[rootserverSelected-1]["rootURL"];
            let root_server_selected_name = rootServers[rootserverSelected-1]["name"];
            log('')
            log(chalk.magentaBright('You Selcted:'), chalk.redBright(rootserverSelected, '[' + root_server_selected_name + ']'))
            rl.close();
            return root_server_selected_url;
        })      
});
