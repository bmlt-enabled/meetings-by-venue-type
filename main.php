<?php

$root_server = "https://bmlt.sezf.org/main_server";
$console_color = true;
$tempvirtual = 0;
$virtual = 0;
$inperson = 0;
$hybrid = 0;
$total_meetings = 0;
$region_service_bodies = [];
$regions = [];

$root_servers = json_decode(get("https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json"), true);
usort($root_servers, function ($a, $b) {
    return strnatcasecmp($a["name"], $b["name"]);
});

echo colors("\nGet Meetings By Venue-Type \n", "38");
echo colors("\nRoot Servers: \n", "35");

$count = 1;
foreach ($root_servers as $root_server) {
    echo colors("  " . $count  . " " . $root_server["name"] . "\n", "93");
    $count++;
}

echo colors("\nSelect a root server: ", "35");
$root_server_selected = rtrim(fgets(STDIN));
$root_server_selected_id = $root_servers[$root_server_selected-1]["id"];
$root_server_selected_url = $root_servers[$root_server_selected-1]["rootURL"];
echo colors("\nYou selected: ", "35") . colors($root_server_selected . " [" . $root_servers[$root_server_selected-1]["name"] . "]\n", "31");

$service_bodies = json_decode(get($root_server_selected_url . "client_interface/json/?switcher=GetServiceBodies"), true);

foreach ($service_bodies as  $key => $value){
    if ($value["type"] == "RS") {
        $regions[$key] = $value;
    }
}

usort($regions, function ($a, $b) {
    return strnatcasecmp($a["name"], $b["name"]);
});

echo colors("\nRegions: \n", "35");

$count = 1;
foreach ($regions as $region) {
    echo colors("  " . $count  . " " . $region["name"] . "\n", "93");
    $count++;
}

echo colors("\nSelect a region: ", "35");
$region_service_body_selected = rtrim(fgets(STDIN));
$region_service_body_selected_id = $regions[$region_service_body_selected-1]["id"];
echo colors("\nYou selected: ", "35") . colors($region_service_body_selected . " [" . $regions[$region_service_body_selected-1]["name"] . " (" .$region_service_body_selected_id. ")]\n", "31");

foreach ($service_bodies as  $key => $value){
    if ($value["parent_id"] == $region_service_body_selected_id || $value["id"] == $region_service_body_selected_id) {
        $region_service_bodies[$key] = $value;
    }
}

usort($region_service_bodies, function ($a, $b) {
    return strnatcasecmp($a["name"], $b["name"]);
});

echo colors("\nService Bodies: \n", "35");

$count = 1;
foreach ($region_service_bodies as $service_body) {
    echo colors("  " . $count  . " " . $service_body["name"] . "\n", "93");
    $count++;
}

echo colors("\nSelect a service body: ", "35");
$service_body_selected = rtrim(fgets(STDIN));
$service_body_selected_id = $region_service_bodies[$service_body_selected-1]["id"];
echo colors("\nYou selected: ", "35") . colors($service_body_selected . " [" . $region_service_bodies[$service_body_selected-1]["name"] . " (" .$service_body_selected_id. ")]\n", "31");

$meetings = json_decode(get($root_server_selected_url . "client_interface/json/?switcher=GetSearchResults&services=$service_body_selected_id&recursive=1&data_field_key=formats"), true);

foreach ($meetings as $meeting) {
    $formats = explode(",", $meeting['formats']);
    if (  !in_array("VM", $formats) && !in_array("TC", $formats) && !in_array("HY", $formats)  ) {
        $inperson++;
    } else if (  in_array("VM", $formats) && !in_array("TC", $formats) && !in_array("HY", $formats)  ) {
        $virtual++;
    } else if (  in_array("VM", $formats) && in_array("TC", $formats) && !in_array("HY", $formats)  ) {
        $tempvirtual++;$virtual++;
    } else if (  !in_array("VM", $formats) && !in_array("TC", $formats) && in_array("HY", $formats)  ) {
        $hybrid++;
    }
    $total_meetings++;
}

echo colors("\nTotal Meetings By Venue Type\n", "38");
echo colors(pretty(), "34") . "\n";
echo colors("In-person: ", "36") . colors($inperson, "32") . "\n";
echo colors("Hybrid: ", "36") . colors($hybrid, "32") . "\n";
echo colors("Virtual: ", "36") . colors($virtual, "32") . "\n";
// echo colors("Virtual (temporarily replacing an in-person): ", "36"). colors($tempvirtual, "32") . "\n\n";
echo colors("Total Meetings: ", "37") . colors($total_meetings, "32") . "\n";
echo colors(pretty(), "34");
echo "\n";

function pretty()
{
    return "\n" . str_repeat("-=", 20) . "\n";
}

function colors($string, $color)
{
    if ($GLOBALS['console_color']) {
        return "\e[1;" . $color . "m" . $string . "\e[0m";
    } else {
        return $string;
    }
}

function get($url)
{
    #error_log($url);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltform');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);
    $errorno = curl_errno($ch);
    curl_close($ch);
    if ($errorno > 0) {
        throw new Exception(curl_strerror($errorno));
    }

    return $data;
}
