package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	ErrorColor    = "\033[1;31m%s\033[0m"
	TotalColor    = "\033[1;32m%d\033[0m"
	LineColor     = "\033[1;34m%s\033[0m"
	NoticeColor   = "\033[1;35m%s\033[0m"
	PromptColor   = "\033[1;36m%s\033[0m"
	InfoColor     = "\033[1;38m%s\033[0m"
	ServicesColor = "\033[1;93m%s\033[0m"
	CountColor    = "\033[1;93m%d\033[0m"
)

type Totals struct {
	Virtual       int
	InPerson      int
	Hybrid        int
	TempVirtual   int
	TotalMeetings int
}

func main() {
	t := populate(Totals{})
	t.PrintMethod()
}

func (totals Totals) PrintMethod() {
	fmt.Printf(PromptColor, "In-person: ")
	fmt.Printf(TotalColor, totals.InPerson)
	fmt.Printf(PromptColor, "\nHybrid: ")
	fmt.Printf(TotalColor, totals.Hybrid)
	fmt.Printf(PromptColor, "\nVirtual: ")
	fmt.Printf(TotalColor, totals.Virtual)
	fmt.Printf(InfoColor, "\nTotal Meetings: ")
	fmt.Printf(TotalColor, totals.TotalMeetings)
	pretty()
}

func populate(total Totals) *Totals {
	fmt.Printf(InfoColor, "\nGet Meetings By Venue-Type\n")
	fmt.Printf(NoticeColor, "\nRoot Servers:")
	fmt.Println("")

	tomatoRoots := getUrl("https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json")

	var tomatoSlice []map[string]string
	if err := json.Unmarshal(tomatoRoots, &tomatoSlice); err != nil {
		panic(err)
	}

	sort.Slice(tomatoSlice[:], func(i, j int) bool {
		return tomatoSlice[i]["name"] < tomatoSlice[j]["name"]
	})

	count := 1
	for _, element := range tomatoSlice {
		fmt.Printf("  ")
		fmt.Printf(CountColor, count)
		fmt.Printf(" ")
		fmt.Printf(ServicesColor, element["name"])
		fmt.Printf("\n")
		count += 1
	}

	fmt.Printf(NoticeColor, "\nSelect a root server: ")
	reader := bufio.NewReader(os.Stdin)
	rootInput, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("An error occurred while reading input. Please try again", err)
		log.Fatal(err)
	}
	rootInput = strings.TrimSuffix(rootInput, "\n")

	selectionRange, _ := strconv.ParseInt(rootInput, 10, 64)
	if selectionRange > int64(len(tomatoSlice)) {
		fmt.Printf(ErrorColor, "\nError: Selection must match one of the choices.")
		os.Exit(0)
	}

	tomatoSelectionIndex, _ := strconv.ParseInt(rootInput, 10, 64)

	fmt.Printf(NoticeColor, "\nYou selected: ")
	fmt.Printf(ErrorColor, rootInput)
	fmt.Printf(ErrorColor, " [")
	fmt.Printf(ErrorColor, tomatoSlice[tomatoSelectionIndex-1]["name"])
	fmt.Printf(ErrorColor, "]")

	rootUrl := tomatoSlice[tomatoSelectionIndex-1]["rootURL"]

	serviceBodiesData := getUrl(fmt.Sprintf("%sclient_interface/json/?switcher=GetServiceBodies", rootUrl))

	var regionSlice []map[string]string
	if err := json.Unmarshal(serviceBodiesData, &regionSlice); err != nil {
		panic(err)
	}

	sort.Slice(regionSlice[:], func(i, j int) bool {
		return regionSlice[i]["name"] < regionSlice[j]["name"]
	})

	fmt.Printf(NoticeColor, "\n\nRegions: \n")

	rcount := 1
	regions := make([]map[string]string, 0)
	for _, element := range regionSlice {
		var region map[string]string
		if element["type"] == "RS" {
			fmt.Printf("  ")
			fmt.Printf(CountColor, rcount)
			fmt.Printf(" ")
			fmt.Printf(ServicesColor, element["name"])
			fmt.Printf("\n")
			region = element
			regions = append(regions, region)
			rcount += 1
		}
	}

	fmt.Printf(NoticeColor, "\nSelect a region: ")

	regionReader := bufio.NewReader(os.Stdin)
	regionInput, err := regionReader.ReadString('\n')
	if err != nil {
		fmt.Println("An error occurred while reading input. Please try again", err)
		os.Exit(0)
	}
	regionInput = strings.TrimSuffix(regionInput, "\n")

	regionSelectionRange, _ := strconv.ParseInt(regionInput, 10, 64)
	if regionSelectionRange > int64(len(regions)) {
		fmt.Printf(ErrorColor, "\nError: Selection must match one of the choices.")
		os.Exit(0)
	}

	regionSelectionIndex, _ := strconv.ParseInt(regionInput, 10, 64)
	regionServiceBodySelectedId := regions[regionSelectionIndex-1]["id"]
	fmt.Printf(NoticeColor, "\nYou selected: ")
	fmt.Printf(ErrorColor, regionInput)
	fmt.Printf(ErrorColor, " [")
	fmt.Printf(ErrorColor, regions[regionSelectionIndex-1]["name"])
	fmt.Printf(ErrorColor, " (")
	fmt.Printf(ErrorColor, regionServiceBodySelectedId)
	fmt.Printf(ErrorColor, ")")
	fmt.Printf(ErrorColor, "]")
	fmt.Printf(NoticeColor, "\n\nService Bodies: \n")

	scount := 1
	serviceBodies := make([]map[string]string, 0)
	for _, element := range regionSlice {
		var serviceBody map[string]string
		if element["parent_id"] == regionServiceBodySelectedId || element["id"] == regionServiceBodySelectedId {
			fmt.Printf("  ")
			fmt.Printf(CountColor, scount)
			fmt.Printf(" ")
			fmt.Printf(ServicesColor, element["name"])
			fmt.Printf("\n")
			serviceBody = element
			serviceBodies = append(serviceBodies, serviceBody)
			scount += 1
		}
	}

	fmt.Printf(NoticeColor, "\nSelect a service body: ")
	serviceBodyReader := bufio.NewReader(os.Stdin)
	serviceBodyInput, err := serviceBodyReader.ReadString('\n')
	if err != nil {
		fmt.Println("An error occurred while reading input. Please try again", err)
		os.Exit(0)
	}
	serviceBodyInput = strings.TrimSuffix(serviceBodyInput, "\n")

	serviceBodySelectionRange, _ := strconv.ParseInt(serviceBodyInput, 10, 64)
	if serviceBodySelectionRange > int64(len(serviceBodies)) {
		fmt.Printf(ErrorColor, "\nError: Selection must match one of the choices.")
		os.Exit(0)
	}

	serviceBodySelectionIndex, _ := strconv.ParseInt(serviceBodyInput, 10, 64)
	serviceBodySelectedId := serviceBodies[serviceBodySelectionIndex-1]["id"]
	fmt.Printf(NoticeColor, "\nYou selected: ")
	fmt.Printf(ErrorColor, serviceBodyInput)
	fmt.Printf(ErrorColor, " [")
	fmt.Printf(ErrorColor, serviceBodies[serviceBodySelectionIndex-1]["name"])
	fmt.Printf(ErrorColor, " (")
	fmt.Printf(ErrorColor, serviceBodySelectedId)
	fmt.Printf(ErrorColor, ")")
	fmt.Printf(ErrorColor, "]")
	fmt.Printf(InfoColor, "\n\nTotal Meetings By Venue Type")
	pretty()

	meetingsData := getUrl(fmt.Sprintf("%sclient_interface/json/?switcher=GetSearchResults&services=%s&recursive=1&data_field_key=formats", rootUrl, serviceBodySelectedId))
	var meetingSlice []map[string]string
	if err := json.Unmarshal(meetingsData, &meetingSlice); err != nil {
		panic(err)
	}

	virtual := 0
	inPerson := 0
	hybrid := 0
	tempVirtual := 0
	totalMeetings := 0

	for _, element := range meetingSlice {
		formats := strings.Split(element["formats"], ",")
		if !contains(formats, "VM") && !contains(formats, "TC") && !contains(formats, "HY") {
			inPerson += 1
		} else if contains(formats, "VM") && !contains(formats, "TC") && !contains(formats, "HY") {
			virtual += 1
		} else if contains(formats, "VM") && contains(formats, "TC") && !contains(formats, "HY") {
			virtual += 1
			tempVirtual += 1
		} else if !contains(formats, "VM") && !contains(formats, "TC") && contains(formats, "HY") {
			hybrid += 1
		}
		totalMeetings += 1
	}

	total = Totals{
		Virtual:       virtual,
		InPerson:      inPerson,
		Hybrid:        hybrid,
		TempVirtual:   tempVirtual,
		TotalMeetings: totalMeetings,
	}

	return &total
}

func contains(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

func pretty() {
	fmt.Printf("\n")
	fmt.Printf(LineColor, strings.Repeat("-=", 20))
	fmt.Printf("\n")
}

func getUrl(url string) []byte {
	bmltClient := http.Client{
		Timeout: time.Second * 10,
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)

	if err != nil {
		log.Fatal(err)
	}

	req.Header.Set("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltgo")
	res, getErr := bmltClient.Do(req)

	if getErr != nil {
		log.Fatal(getErr)
	}

	if res.Body != nil {
		defer res.Body.Close()
	}

	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		log.Fatal(readErr)
	}

	return body
}
