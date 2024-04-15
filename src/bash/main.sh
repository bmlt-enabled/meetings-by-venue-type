#!/usr/bin/env bash

PRPL="\033[1;35m"
WHT="\033[1;38m"
YLW="\033[1;93m"
RED="\033[1;31m"
GRN="\033[1;32m"
TAL="\033[1;36m"
BLU="\033[1;34m"
EC="\033[0m"

calculateTotalGroups() {
    local json_data=$1
    declare -A uniqueMeetings

    while IFS=$'\t' read -r serviceBodyID meetingName; do
        local uniqueKey="${serviceBodyID}_${meetingName}"
        uniqueMeetings["$uniqueKey"]=1
    done < <(jq -r '.[] | [.service_body_bigint, .meeting_name | ascii_downcase | gsub("[ \\t\\r\\n]+"; "")] | @tsv' <<< "$json_data")

    echo ${#uniqueMeetings[@]}
}

echo -e "${WHT}\nGet Meetings By Venue-Type \n${EC}"

echo -e "${PRPL}Root Servers: ${EC}"

ROOT_SERVERS=$(curl -s "https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json" | jq -c 'sort_by(.name) | .[]')

RC=1
echo "$ROOT_SERVERS" | while read -r i; do
	ROOT_SERVER_NAME=$(echo "$i" | jq -r '.name' | sort)
	echo -e "  ${YLW}$RC $ROOT_SERVER_NAME${EC}"
	((RC++))
done

echo -en "${PRPL}\nSelect a root server: ${EC}"
read -r root_server_input
((selected_root_server_input += root_server_input - 1))
SELECTED_ROOT_SERVER=$(curl -s "https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json" | jq -c --argjson SELECTION "$selected_root_server_input" 'sort_by(.name) | .[$SELECTION]')
SELECTED_ROOT_SERVER_NAME=$(echo "$SELECTED_ROOT_SERVER" | jq -r '.name')
SELECTED_ROOT_SERVER_URL=$(echo "$SELECTED_ROOT_SERVER" | jq -r '.rootURL')

echo -en "${PRPL}\nYou selected: ${EC}"
echo -en "${RED}$root_server_input [$SELECTED_ROOT_SERVER_NAME]${EC}\n"
echo -e "${PRPL}\nRegions: ${EC}"

SERVICE_BODIES=$(curl -s "$SELECTED_ROOT_SERVER_URL/client_interface/json/?switcher=GetServiceBodies" | jq -c 'sort_by(.name)')
REGIONS=$(echo "$SERVICE_BODIES" | jq -c '.[] | select(.type=="RS")')

RGC=1
echo "$REGIONS" | while read -r i; do
	REGION_NAME=$(echo "$i" | jq -r '.name' | sort)
	echo -e "  ${YLW}$RGC $REGION_NAME${EC}"
	((RGC++))
done

echo -en "${PRPL}\nSelect a region: ${EC}"
read -r region_input
((selected_region_input += region_input - 1))
SELECTED_REGION=$(echo "$REGIONS" | jq -c -s --argjson SELECTION "$selected_region_input" '.[$SELECTION]')
SELECTED_REGION_NAME=$(echo "$SELECTED_REGION" | jq -r '.name')
SELECTED_REGION_ID=$(echo "$SELECTED_REGION" | jq -r '.id')
echo -en "${PRPL}\nYou selected: ${EC}"
echo -en "${RED}$region_input [$SELECTED_REGION_NAME ($SELECTED_REGION_ID)]${EC}\n"
echo -e "${PRPL}\nService Bodies: ${EC}"

REGION_SERVICE_BODIES=$(echo "$SERVICE_BODIES" | jq -c --arg SELECTION "$SELECTED_REGION_ID" '.[] | select((.parent_id==$SELECTION) or (.id==$SELECTION))')

SBC=1
echo "$REGION_SERVICE_BODIES" | while read -r i; do
	SERVICE_BODY_NAME=$(echo "$i" | jq -r '.name' | sort)
	echo -e "  ${YLW}$SBC $SERVICE_BODY_NAME${EC}"
	((SBC++))
done

echo -en "${PRPL}\nSelect a service body: ${EC}"
read -r service_body_input
((selected_service_body_input += service_body_input - 1))
SELECTED_SERVICE_BODY=$(echo "$REGION_SERVICE_BODIES" | jq -c -s --argjson SELECTION "$selected_service_body_input" '.[$SELECTION]')
SELECTED_SERVICE_BODY_NAME=$(echo "$SELECTED_SERVICE_BODY" | jq -r '.name')
SELECTED_SERVICE_BODY_ID=$(echo "$SELECTED_SERVICE_BODY" | jq -r '.id')
echo -en "${PRPL}\nYou selected: ${EC}"
echo -en "${RED}$region_input [$SELECTED_SERVICE_BODY_NAME ($SELECTED_SERVICE_BODY_ID)]${EC}\n"

MEETINGS=$(curl -s "$SELECTED_ROOT_SERVER_URL/client_interface/json/?switcher=GetSearchResults&services=$SELECTED_SERVICE_BODY_ID&recursive=1&data_field_key=formats,meeting_name,service_body_bigint")

INPERSON=0
VIRTUAL=0
HYBRID=0
TOTAL=0
NOFORMAT=0

while read -r i; do
	# perform computations on $i
	((TOTAL++))
	IFS=';' read -ra ADDR <<<"$i"
	for a in "${ADDR[@]}"; do
		if [[ -n "${a[*]}" ]]; then
			((NOFORMAT++))
		fi
		if [[ ! " ${a[*]} " =~ "VM" ]] && [[ ! " ${a[*]} " =~ "TC" ]] && [[ ! " ${a[*]} " =~ "HY" ]]; then
			((INPERSON++))
		elif [[ " ${a[*]} " =~ "VM" ]] && [[ ! " ${a[*]} " =~ "TC" ]] && [[ ! " ${a[*]} " =~ "HY" ]]; then
			((VIRTUAL++))
		elif [[ " ${a[*]} " =~ "VM" ]] && [[ " ${a[*]} " =~ "TC" ]] && [[ ! " ${a[*]} " =~ "HY" ]]; then
			((VIRTUAL++))
		elif [[ ! " ${a[*]} " =~ "VM" ]] && [[ ! " ${a[*]} " =~ "TC" ]] && [[ " ${a[*]} " =~ "HY" ]]; then
			((HYBRID++))
		elif [[ " ${a[*]} " =~ "VM" ]] && [[ ! " ${a[*]} " =~ "TC" ]] && [[ " ${a[*]} " =~ "HY" ]]; then
      ((HYBRID++))
    fi
	done
done < <(echo "$MEETINGS" | jq -r -c '.[].formats')

TOTALGROUPS=$(calculateTotalGroups "$MEETINGS")
TOTAL_NO_FORMATS=$((TOTAL - NOFORMAT))
TOTAL_INPERSON=$((INPERSON + TOTAL_NO_FORMATS))

echo -e "${WHT}\nTotal Meetings By Venue Type\n${EC}"
echo -e "${BLU}-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n${EC}"
echo -e "${TAL}In-person:${EC} ${GRN}$TOTAL_INPERSON${EC}"
echo -e "${TAL}Hybrid:${EC} ${GRN}$HYBRID${EC}"
echo -e "${TAL}Virtual:${EC} ${GRN}$VIRTUAL${EC}"
echo -e "${WHT}Total Meetings:${EC} ${GRN}$TOTAL${EC}"
echo -e "${WHT}Total Groups:${EC} ${GRN}$TOTALGROUPS${EC}"
echo -e "${BLU}\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n${EC}"
