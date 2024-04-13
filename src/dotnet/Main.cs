using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace dotnet
{
    class Program
    {
        const string ErrorColor = "\u001b[1;31m{0}\u001b[0m";
        const string TotalColor = "\u001b[1;32m{0}\u001b[0m";
        const string LineColor = "\u001b[1;34m{0}\u001b[0m";
        const string NoticeColor = "\u001b[1;35m{0}\u001b[0m";
        const string PromptColor = "\u001b[1;36m{0}\u001b[0m";
        const string InfoColor = "\u001b[1;38m{0}\u001b[0m";
        const string ServicesColor = "\u001b[1;93m{0}\u001b[0m";
        const string CountColor = "\u001b[1;93m{0}\u001b[0m";

        static async Task Main(string[] args)
        {
            Totals totals = await PopulateAsync(new Totals());
            if (totals != null)
            {
                totals.PrintMethod();
            }
        }

        class Totals
        {
            public int Virtual { get; set; }
            public int InPerson { get; set; }
            public int Hybrid { get; set; }
            public int TempVirtual { get; set; }
            public int TotalMeetings { get; set; }

            public void PrintMethod()
            {
                Console.Write(string.Format(PromptColor, "In-person: "));
                Console.Write(string.Format(TotalColor, InPerson));
                Console.Write(string.Format(PromptColor, "\nHybrid: "));
                Console.Write(string.Format(TotalColor, Hybrid));
                Console.Write(string.Format(PromptColor, "\nVirtual: "));
                Console.Write(string.Format(TotalColor, Virtual));
                Console.Write(string.Format(InfoColor, "\nTotal Meetings: "));
                Console.Write(string.Format(TotalColor, TotalMeetings));
                Pretty();
            }
        }

        static async Task<Totals> PopulateAsync(Totals total)
        {
            Console.Write(string.Format(InfoColor, "\nGet Meetings By Venue-Type\n"));
            Console.Write(string.Format(NoticeColor, "\nRoot Servers:\n\n"));

            string tomatoRoots = await GetUrlAsync("https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json");
            if (tomatoRoots == null)
            {
                Console.WriteLine("Error: Unable to retrieve data from the URL.");
                Environment.Exit(1);
            }
            List<Dictionary<string, string>> tomatoSlice = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(tomatoRoots);

            tomatoSlice = tomatoSlice.OrderBy(e => e["name"]).ToList();

            int count = 1;
            foreach (var element in tomatoSlice)
            {
                Console.Write("  ");
                Console.Write(string.Format(CountColor, count));
                Console.Write(" ");
                Console.Write(string.Format(ServicesColor, element["name"]));
                Console.Write("\n");
                count++;
            }

            Console.Write(string.Format(NoticeColor, "\nSelect a root server: "));
            string rootInput = Console.ReadLine();

            if (!int.TryParse(rootInput, out int selectionRange) || selectionRange > tomatoSlice.Count)
            {
                Console.Write(string.Format(ErrorColor, "\nError: Selection must match one of the choices."));
                Environment.Exit(0);
            }

            int tomatoSelectionIndex = int.Parse(rootInput);

            Console.Write(string.Format(NoticeColor, "\nYou selected: "));
            Console.Write(string.Format(ErrorColor, rootInput));
            Console.Write(string.Format(ErrorColor, " ["));
            Console.Write(string.Format(ErrorColor, tomatoSlice[tomatoSelectionIndex - 1]["name"]));
            Console.Write(string.Format(ErrorColor, "]"));

            string rootUrl = tomatoSlice[tomatoSelectionIndex - 1]["rootURL"];

            string serviceBodiesData = await GetUrlAsync($"{rootUrl}client_interface/json/?switcher=GetServiceBodies");

            List<Dictionary<string, string>> regionSlice = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(serviceBodiesData);

            regionSlice = regionSlice.OrderBy(e => e["name"]).ToList();

            Console.Write(string.Format(NoticeColor, "\n\nRegions: \n"));

            int rcount = 1;
            List<Dictionary<string, string>> regions = new List<Dictionary<string, string>>();
            foreach (var element in regionSlice)
            {
                if (element["type"] == "RS")
                {
                    Console.Write("  ");
                    Console.Write(string.Format(CountColor, rcount));
                    Console.Write(" ");
                    Console.Write(string.Format(ServicesColor, element["name"]));
                    Console.Write("\n");
                    regions.Add(element);
                    rcount++;
                }
            }

            Console.Write(string.Format(NoticeColor, "\nSelect a region: "));
            string regionInput = Console.ReadLine();

            if (!int.TryParse(regionInput, out int regionSelectionRange) || regionSelectionRange > regions.Count)
            {
                Console.Write(string.Format(ErrorColor, "\nError: Selection must match one of the choices."));
                Environment.Exit(0);
            }

            int regionSelectionIndex = int.Parse(regionInput);
            string regionServiceBodySelectedId = regions[regionSelectionIndex - 1]["id"];

            Console.Write(string.Format(NoticeColor, "\nYou selected: "));
            Console.Write(string.Format(ErrorColor, regionInput));
            Console.Write(string.Format(ErrorColor, " ["));
            Console.Write(string.Format(ErrorColor, regions[regionSelectionIndex - 1]["name"]));
            Console.Write(string.Format(ErrorColor, " ("));
            Console.Write(string.Format(ErrorColor, regionServiceBodySelectedId));
            Console.Write(string.Format(ErrorColor, " )]"));

            Console.Write(string.Format(NoticeColor, "\n\nService Bodies: \n"));

            int scount = 1;
            List<Dictionary<string, string>> serviceBodies = new List<Dictionary<string, string>>();
            foreach (var element in regionSlice)
            {
                if (element["parent_id"] == regionServiceBodySelectedId || element["id"] == regionServiceBodySelectedId)
                {
                    Console.Write("  ");
                    Console.Write(string.Format(CountColor, scount));
                    Console.Write(" ");
                    Console.Write(string.Format(ServicesColor, element["name"]));
                    Console.Write("\n");
                    serviceBodies.Add(element);
                    scount++;
                }
            }

            Console.Write(string.Format(NoticeColor, "\nSelect a service body: "));
            string serviceBodyInput = Console.ReadLine();

            if (!int.TryParse(serviceBodyInput, out int serviceBodySelectionRange) || serviceBodySelectionRange > serviceBodies.Count)
            {
                Console.Write(string.Format(ErrorColor, "\nError: Selection must match one of the choices."));
                Environment.Exit(0);
            }

            int serviceBodySelectionIndex = int.Parse(serviceBodyInput);
            string serviceBodySelectedId = serviceBodies[serviceBodySelectionIndex - 1]["id"];

            Console.Write(string.Format(NoticeColor, "\nYou selected: "));
            Console.Write(string.Format(ErrorColor, serviceBodyInput));
            Console.Write(string.Format(ErrorColor, " ["));
            Console.Write(string.Format(ErrorColor, serviceBodies[serviceBodySelectionIndex - 1]["name"]));
            Console.Write(string.Format(ErrorColor, " ("));
            Console.Write(string.Format(ErrorColor, serviceBodySelectedId));
            Console.Write(string.Format(ErrorColor, ")]"));
            Console.Write(string.Format(InfoColor, "\n\nTotal Meetings By Venue Type"));
            Pretty();

            string meetingsData = await GetUrlAsync($"{rootUrl}client_interface/json/?switcher=GetSearchResults&services={serviceBodySelectedId}&recursive=1&data_field_key=formats");

            List<Dictionary<string, string>> meetingSlice = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(meetingsData);

            int virtualCount = 0;
            int inPersonCount = 0;
            int hybridCount = 0;
            int tempVirtualCount = 0;
            int totalMeetingsCount = 0;

            foreach (var element in meetingSlice)
            {
                string[] formats = element["formats"].Split(',');
                if (!Contains(formats, "VM") && !Contains(formats, "TC") && !Contains(formats, "HY"))
                {
                    inPersonCount++;
                }
                else if (Contains(formats, "VM") && !Contains(formats, "TC") && !Contains(formats, "HY"))
                {
                    virtualCount++;
                }
                else if (Contains(formats, "VM") && Contains(formats, "TC") && !Contains(formats, "HY"))
                {
                    virtualCount++;
                    tempVirtualCount++;
                }
                else if (!Contains(formats, "VM") && !Contains(formats, "TC") && Contains(formats, "HY"))
                {
                    hybridCount++;
                }
                else if (Contains(formats, "VM") && !Contains(formats, "TC") && Contains(formats, "HY"))
                {
                    hybridCount++;
                }
                totalMeetingsCount++;
            }

            total = new Totals
            {
                Virtual = virtualCount,
                InPerson = inPersonCount,
                Hybrid = hybridCount,
                TempVirtual = tempVirtualCount,
                TotalMeetings = totalMeetingsCount
            };

            return total;
        }

        static bool Contains(string[] s, string str)
        {
            return s.Contains(str);
        }

        static void Pretty()
        {
            Console.Write("\n\n");
            Console.Write(string.Format(LineColor, new string('-', 40)));
            Console.Write("\n\n");
        }

        static async Task<string> GetUrlAsync(string url)
        {
            using (HttpClient httpClient = new HttpClient())
            {
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                try
                {
                    HttpResponseMessage response = await httpClient.GetAsync(url);
                    response.EnsureSuccessStatusCode();
                    string responseBody = await response.Content.ReadAsStringAsync();
                    return responseBody;
                }
                catch (HttpRequestException e)
                {
                    Console.WriteLine("An error occurred while making the HTTP request: " + e.Message);
                    Environment.Exit(0);
                }
            }
            return null;
        }
    }
}
