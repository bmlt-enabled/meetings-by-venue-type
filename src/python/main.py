#!/usr/bin/env python3
""" Get meeting types """
import sys
import json
import urllib3

# pylint: disable=line-too-long
# pylint: disable=too-few-public-methods
# pylint: disable=too-many-locals
# pylint: disable=too-many-branches
# pylint: disable=too-many-statements

class Bcolors:
    """
    Colors
    """
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
    totals = populate()
    print_totals(totals)


def print_totals(totals):
    """
    Print Totals
    :param totals: dict of totals
    """
    print(f"{Bcolors.WHT}\nTotal Meetings By Venue Type{Bcolors.EC}")
    pretty()
    print(
        f"{Bcolors.TAL}In-person: {Bcolors.EC}{Bcolors.GRN}{totals['inperson']}{Bcolors.EC}")
    print(
        f"{Bcolors.TAL}Hybrid: {Bcolors.EC}{Bcolors.GRN}{totals['hybrid']}{Bcolors.EC}")
    print(
        f"{Bcolors.TAL}Virtual: {Bcolors.EC}{Bcolors.GRN}{totals['virtual']}{Bcolors.EC}")
    print(
        f"{Bcolors.WHT}Total Meetings: {Bcolors.EC}{Bcolors.GRN}{totals['total']}{Bcolors.EC}")
    print(
        f"{Bcolors.WHT}Total Groups: {Bcolors.EC}{Bcolors.GRN}{totals['totalGroups']}{Bcolors.EC}")
    pretty()


def pretty():
    """
    Pretty Print
    """
    print(f"{Bcolors.BLU}")
    print('-=' * 20)
    print(Bcolors.EC)


def get_url(url):
    """
    Get URL
    :param url: string of url
    """
    http = urllib3.PoolManager()
    req = http.request(
        "GET",
        url,
        headers={
            'user-agent': 'User-Agent", "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltpy'
        })
    return json.loads(req.data.decode())


def calculateTotalGroups(data):
    meeting_map = {}
    for meeting in data:
        service_body_id = meeting["service_body_bigint"]
        meeting_name = meeting["meeting_name"]
        if service_body_id in meeting_map:
            if meeting_name not in meeting_map[service_body_id]:
                meeting_map[service_body_id].append(meeting_name)
        else:
            meeting_map[service_body_id] = [meeting_name]

    meeting_counts = {key: len(value) for key, value in meeting_map.items()}
    return sum(meeting_counts.values())


def populate():
    # pylint: disable=C0301
    """
    Populate
    :return: dict of totals
    """
    print(f"{Bcolors.WHT}\nGet Meetings By Venue-Type \n{Bcolors.EC}")
    print(f"{Bcolors.PRPL}Root Servers: {Bcolors.EC}")

    root_servers = sorted(
        get_url("https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json"),
        key=lambda k: k['name'])

    rcount = 1
    for server in root_servers:
        print(f" {Bcolors.YLW} {rcount} {server['name']} {Bcolors.EC}")
        rcount += 1

    print(f"{Bcolors.PRPL}")
    root_server_input = input("Select a root server: \033[0m")

    if int(root_server_input) > len(root_servers):
        print(
            f"\n{Bcolors.RED}Error: Selection must match one of the choices.{Bcolors.EC}")
        sys.exit(0)
    selected_root_server = root_servers[int(root_server_input) - 1]
    selected_root_server_name = selected_root_server['name']
    selected_root_server_url = selected_root_server['rootURL']
    print(f"\n{Bcolors.PRPL}You selected: {Bcolors.EC}", end='')

    print(f"{Bcolors.RED}{root_server_input} [{selected_root_server_name}]{Bcolors.EC}")
    print(f"\n{Bcolors.PRPL}Regions: {Bcolors.EC}")

    service_body_url = f"{selected_root_server_url}client_interface/json/?switcher=GetServiceBodies"
    service_bodies_data = sorted(
        get_url(service_body_url),
        key=lambda k: k['name'])

    regions = {}
    scount = 1
    for region in service_bodies_data:
        if "RS" in region['type']:
            print(f" {Bcolors.YLW} {scount} {region['name']} {Bcolors.EC}")
            regions[scount] = region
            scount += 1

    print(f"{Bcolors.PRPL}")
    regions_input = input("Select a region: \033[0m")

    if int(regions_input) > len(regions):
        print(
            f"\n{Bcolors.RED}Error: Selection must match one of the choices.{Bcolors.EC}")
        sys.exit(0)

    selected_region_name = regions[int(regions_input)]['name']
    selected_region_id = regions[int(regions_input)]['id']
    print(f"\n{Bcolors.PRPL}You selected: {Bcolors.EC}", end='')
    print(
        f"{Bcolors.RED}{regions_input} [{selected_region_name} ({selected_region_id})]{Bcolors.EC}")
    print(f"\n{Bcolors.PRPL}Service Bodies: {Bcolors.EC}")

    service_bodies = {}
    sbcount = 1
    for service_body in service_bodies_data:
        if selected_region_id in service_body['parent_id'] or selected_region_id in service_body['id']:
            print(
                f" {Bcolors.YLW} {sbcount} {service_body['name']} {Bcolors.EC}")
            service_bodies[sbcount] = service_body
            sbcount += 1

    print(f"{Bcolors.PRPL}")
    service_body_input = input("Select a service body: \033[0m")

    if int(service_body_input) > len(service_bodies):
        print(
            f"\n{Bcolors.RED}Error: Selection must match one of the choices.{Bcolors.EC}")
        sys.exit(0)

    print(f"\n{Bcolors.PRPL}You selected: {Bcolors.EC}", end='')
    selected_service_body_server_name = service_bodies[int(service_body_input)]['name']
    print(f"{Bcolors.RED}{service_body_input} [{selected_service_body_server_name}]{Bcolors.EC}")

    selected_service_body_id = service_bodies[int(service_body_input)]['id']
    meetings_data = get_url(
        f"{selected_root_server_url}/client_interface/json/?switcher=GetSearchResults&services={selected_service_body_id}&recursive=1&data_field_key=formats,meeting_name,service_body_bigint"
        )

    in_person = hybrid = virtual = temp_virtual = temp_closed = total = 0
    totalGroups = calculateTotalGroups(meetings_data)
    for meeting in meetings_data:
        formats = meeting['formats'].split(",")
        if "VM" not in formats and "TC" not in formats and "HY" not in formats:
            in_person += 1
        elif "VM" in formats and "TC" not in formats and "HY" not in formats:
            virtual += 1
        elif "VM" in formats and "TC" in formats and "HY" not in formats:
            virtual += 1
            temp_virtual += 1
        elif "VM" not in formats and "TC" not in formats and "HY" in formats:
            hybrid += 1
        elif "VM" in formats and "TC" not in formats and "HY" in formats:
            hybrid += 1
        elif "VM" not in formats and "TC" in formats and "HY" not in formats:
            temp_closed += 1
        else:
            print(formats)
        total += 1

    return {
        'inperson': in_person,
        'virtual': virtual,
        'tempvirtual': temp_virtual,
        'hybrid': hybrid,
        'tempclosed': temp_closed,
        'total': total,
        'totalGroups': totalGroups
    }


if __name__ == "__main__":
    main()
