#!/usr/bin/env python3
import sys
import json
import urllib3


class bcolors:
    PRPL = '\033[1;35m'
    WHT = '\033[1;38m'
    YLW = '\033[1;93m'
    RED = '\033[1;31m'
    GRN = '\033[1;32m'
    TAL = '\033[1;36m'
    BLU = '\033[1;34m'
    EC = '\033[0m'


def main():
    """
    Main
    """
    t = populate()
    printTotals(t)


def printTotals(totals):
    """
    Print Totals
    :param totals: dict of totals
    """
    print(f"{bcolors.WHT}\nTotal Meetings By Venue Type{bcolors.EC}")
    pretty()
    print(
        f"{bcolors.TAL}In-person: {bcolors.EC}{bcolors.GRN}{totals['inperson']}{bcolors.EC}")
    print(
        f"{bcolors.TAL}Hybrid: {bcolors.EC}{bcolors.GRN}{totals['hybrid']}{bcolors.EC}")
    print(
        f"{bcolors.TAL}Virtual: {bcolors.EC}{bcolors.GRN}{totals['virtual']}{bcolors.EC}")
    print(
        f"{bcolors.WHT}Total Meetings: {bcolors.EC}{bcolors.GRN}{totals['total']}{bcolors.EC}")
    pretty()


def pretty():
    """
    Pretty Print
    """
    print(f"{bcolors.BLU}")
    print('-=' * 20)
    print(bcolors.EC)


def get_url(url):
    """
    Get URL
    :param url: string of url
    """
    http = urllib3.PoolManager()
    r = http.request(
        "GET",
        url,
        headers={
            'user-agent': 'User-Agent", "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltpy'
        })
    return json.loads(r.data.decode())


def populate():
    """
    Populate
    :return: dict of totals
    """
    print(f"{bcolors.WHT}\nGet Meetings By Venue-Type \n{bcolors.EC}")
    print(f"{bcolors.PRPL}Root Servers: {bcolors.EC}")

    rootServers = sorted(
        get_url("https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json"),
        key=lambda k: k['name'])

    rcount = 1
    for server in rootServers:
        print(f" {bcolors.YLW} {rcount} {server['name']} {bcolors.EC}")
        rcount += 1

    print(f"{bcolors.PRPL}")
    rootServerInput = input("Select a root server: \033[0m")

    if int(rootServerInput) > len(rootServers):
        print(f"\n{bcolors.RED}Error: Selection must match one of the choices.{bcolors.EC}")
        sys.exit(0)

    selectedRootserver = rootServers[int(rootServerInput) - 1]
    selectedRootserverName = selectedRootserver['name']
    selectedRootserverUrl = selectedRootserver['rootURL']
    print(f"\n{bcolors.PRPL}You selected: {bcolors.EC}", end='')
    print(f"{bcolors.RED}{rootServerInput} [{selectedRootserverName}]{bcolors.EC}")
    print(f"\n{bcolors.PRPL}Regions: {bcolors.EC}")

    serviceBodyUrl = "{}client_interface/json/?switcher=GetServiceBodies".format(
        selectedRootserverUrl)
    serviceBodiesData = sorted(
        get_url(serviceBodyUrl),
        key=lambda k: k['name'])

    regions = {}
    scount = 1
    for region in serviceBodiesData:
        if "RS" in region['type']:
            print(f" {bcolors.YLW} {scount} {region['name']} {bcolors.EC}")
            regions[scount] = region
            scount += 1

    print(f"{bcolors.PRPL}")
    regionsInput = input("Select a region: \033[0m")

    if int(regionsInput) > len(regions):
        print(f"\n{bcolors.RED}Error: Selection must match one of the choices.{bcolors.EC}")
        sys.exit(0)

    selectedRegionName = regions[int(regionsInput)]['name']
    selectedRegionId = regions[int(regionsInput)]['id']
    print(f"\n{bcolors.PRPL}You selected: {bcolors.EC}", end='')
    print(f"{bcolors.RED}{regionsInput} [{selectedRegionName} ({selectedRegionId})]{bcolors.EC}")
    print(f"\n{bcolors.PRPL}Service bodies: {bcolors.EC}")

    serviceBodies = {}
    sbcount = 1
    for serviceBody in serviceBodiesData:
        if selectedRegionId in serviceBody['parent_id'] or selectedRegionId in serviceBody['id']:
            print(f" {bcolors.YLW} {sbcount} {serviceBody['name']} {bcolors.EC}")
            serviceBodies[sbcount] = serviceBody
            sbcount += 1

    print(f"{bcolors.PRPL}")
    serviceBodyInput = input("Select a service body: \033[0m")

    if int(serviceBodyInput) > len(serviceBodies):
        print(f"\n{bcolors.RED}Error: Selection must match one of the choices.{bcolors.EC}")
        sys.exit(0)

    selectedServiceBodyId = serviceBodies[int(serviceBodyInput)]['id']
    meetingsData = get_url(
        "{}/client_interface/json/?switcher=GetSearchResults&services={}&recursive=1&data_field_key=formats".
        format(selectedRootserverUrl, selectedServiceBodyId))

    inPerson = hybrid = virtual = tempVirtual = tempClosed = total = 0
    for meeting in meetingsData:
        formats = meeting['formats'].split(",")
        if "VM" not in formats and "TC" not in formats and "HY" not in formats:
            inPerson += 1
        elif "VM" in formats and "TC" not in formats and "HY" not in formats:
            virtual += 1
        elif "VM" in formats and "TC" in formats and "HY" not in formats:
            virtual += 1
            tempVirtual += 1
        elif "VM" not in formats and "TC" not in formats and "HY" in formats:
            hybrid += 1
        elif "VM" in formats and "TC" not in formats and "HY" in formats:
            hybrid += 1
        elif "VM" not in formats and "TC" in formats and "HY" not in formats:
            tempClosed += 1
        else:
            print(formats)
        total += 1

    return {
        'inperson': inPerson,
        'virtual': virtual,
        'tempvirtual': tempVirtual,
        'hybrid': hybrid,
        'tempclosed': tempClosed,
        'total': total
    }


if __name__ == "__main__":
    main()
