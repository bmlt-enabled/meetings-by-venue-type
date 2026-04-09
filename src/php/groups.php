<?php
$service_body_selected_id = "1033";
$meetings = json_decode(get( "https://texasoklahomana.org/main_server/client_interface/json/?switcher=GetSearchResults&services=$service_body_selected_id&recursive=1&data_field_key=formats,meeting_name,service_body_bigint"), true);
$total_groups = calculateTotalGroups($meetings);
$group_names = getUniqueGroupNames($meetings);

echo "Total Groups: " . $total_groups . "\n\n";
echo "Group Names (Alphabetical):\n";
echo str_repeat("-", 40) . "\n";
foreach ($group_names as $name) {
    echo $name . "\n";
}

/**
 * Get list of unique group names in alphabetical order.
 *
 * @param array $meetings Array of meeting data from the API.
 *
 * @return array Sorted array of unique group names.
 */
function getUniqueGroupNames($meetings)
{
    $unique_names = [];
    foreach ($meetings as $meeting) {
        // Normalize and store the original meeting name (not lowercase).
        $meeting_name = trim($meeting["meeting_name"]);
        $normalized_key = strtolower($meeting_name);
        // Use normalized key to deduplicate, but store original name.
        if (!isset($unique_names[$normalized_key])) {
            $unique_names[$normalized_key] = $meeting_name;
        }
    }

    // Get the values (original names) and sort alphabetically.
    $names = array_values($unique_names);
    sort($names, SORT_STRING | SORT_FLAG_CASE);

    return $names;
}

/**
 * Calculate total number of unique groups.
 *
 * Groups are determined by unique meeting names within each service body.
 * A group may have multiple meetings (e.g., same group meeting on different
 * days/times), so we need to count unique meeting names rather than total
 * meetings to get an accurate group count.
 *
 * @param array $meetings Array of meeting data from the API.
 *
 * @return int Total number of unique groups across all service bodies.
 */
function calculateTotalGroups($meetings)
{
    // Create a map to track unique meeting names per service body.
    $meeting_map = [];
    foreach ($meetings as $meeting) {
        $service_body_id = $meeting["service_body_bigint"];
        // Normalize meeting name (lowercase and trim whitespace) to handle
        // variations in capitalization or spacing.
        $meeting_name = strtolower(trim($meeting["meeting_name"]));
        if (!isset($meeting_map[$service_body_id])) {
            $meeting_map[$service_body_id] = [];
        }
        // Use meeting name as array key to automatically deduplicate.
        $meeting_map[$service_body_id][$meeting_name] = true;
    }

    // Sum up the unique meeting names across all service bodies.
    $total_groups = 0;
    foreach ($meeting_map as $names) {
        $total_groups += count($names);
    }

    return $total_groups;
}

/**
 * Implements get function.
 */
function get($url)
{
    // error_log($url);
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

