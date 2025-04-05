<script lang="ts">
  // Type assertion function to safely cast window
  function getCustomWindow(): CustomWindow {
    return window as unknown as CustomWindow;
  }

  interface TomatoServer {
    name: string;
    rootURL: string;
  }

  interface ServiceBody {
    id: string;
    name: string;
    type: string[];
    parent_id?: string;
  }

  interface Meeting {
    formats: string;
    meeting_name: string;
    service_body_bigint: string;
  }

  interface MeetingTotals {
    inPerson: number;
    virtual: number;
    tempVirtual: number;
    hybrid: number;
    tempClosed: number;
    totalMeetings: number;
    totalGroups: number;
  }

  // State variables
  let tomatoServers = $state<TomatoServer[]>([]);
  let selectedRootServer = $state<TomatoServer | null>(null);
  let regions = $state<ServiceBody[]>([]);
  let selectedRegion = $state<ServiceBody | null>(null);
  let serviceBodies = $state<ServiceBody[]>([]);
  let selectedServiceBody = $state<ServiceBody | null>(null);
  let meetingTotals = $state<MeetingTotals>({
    inPerson: 0,
    virtual: 0,
    tempVirtual: 0,
    hybrid: 0,
    tempClosed: 0,
    totalMeetings: 0,
    totalGroups: 0
  });

  // Load tomato servers on component mount
  $effect(() => {
    console.log('Loading tomato servers...');
    loadTomatoServers();
  });

  async function loadTomatoServers() {
    try {
      console.log('Fetching tomato servers...');
      const response = await fetch('https://raw.githubusercontent.com/bmlt-enabled/tomato/master/rootServerList.json');
      const data = await response.json();
      console.log('Received tomato servers:', data);
      tomatoServers = data.sort((a: TomatoServer, b: TomatoServer) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } catch (error) {
      console.error('Error loading tomato servers:', error);
    }
  }

  async function handleRootServerSelect(event: Event) {
    console.log('Root server selected');
    const select = event.target as HTMLSelectElement;
    const selectedServer = tomatoServers.find((server) => server.rootURL === select.value);
    if (selectedServer) {
      console.log('Selected server:', selectedServer);
      selectedRootServer = selectedServer;
      await loadRegions(selectedServer.rootURL);
    }
  }

  async function loadRegions(rootServerUrl: string) {
    try {
      console.log('Loading regions from:', rootServerUrl);
      const response = await fetchJsonp(`${rootServerUrl}client_interface/jsonp/?switcher=GetServiceBodies`);
      const data = await response.json();
      console.log('Received regions:', data);
      regions = data.filter((sb: ServiceBody) => sb.type.includes('RS')).sort((a: ServiceBody, b: ServiceBody) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  }

  async function handleRegionSelect(event: Event) {
    console.log('Region selected');
    const select = event.target as HTMLSelectElement;
    const selectedRegionData = regions.find((region) => region.id === select.value);
    if (selectedRegionData && selectedRootServer) {
      console.log('Selected region:', selectedRegionData);
      selectedRegion = selectedRegionData;
      await loadServiceBodies(selectedRootServer.rootURL, selectedRegionData.id);
    }
  }

  async function loadServiceBodies(rootServerUrl: string, regionId: string) {
    try {
      console.log('Loading service bodies for region:', regionId);
      const response = await fetchJsonp(`${rootServerUrl}client_interface/jsonp/?switcher=GetServiceBodies`);
      const data = await response.json();
      console.log('Received service bodies:', data);
      serviceBodies = data
        .filter((sb: ServiceBody) => sb.parent_id === regionId || sb.id === regionId)
        .sort((a: ServiceBody, b: ServiceBody) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } catch (error) {
      console.error('Error loading service bodies:', error);
    }
  }

  async function handleServiceBodySelect(event: Event) {
    console.log('Service body selected');
    const select = event.target as HTMLSelectElement;
    const selectedServiceBodyData = serviceBodies.find((sb) => sb.id === select.value);
    if (selectedServiceBodyData && selectedRootServer) {
      console.log('Selected service body:', selectedServiceBodyData);
      selectedServiceBody = selectedServiceBodyData;
      await loadMeetings(selectedRootServer.rootURL, selectedServiceBodyData.id);
    }
  }

  async function loadMeetings(rootServerUrl: string, serviceBodyId: string) {
    try {
      console.log('Loading meetings for service body:', serviceBodyId);
      const response = await fetchJsonp(
        `${rootServerUrl}client_interface/jsonp/?switcher=GetSearchResults&services=${serviceBodyId}&recursive=1&data_field_key=formats,meeting_name,service_body_bigint`
      );
      const data = await response.json();
      console.log('Received meetings:', data);
      calculateTotals(data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  }

  function calculateTotalGroups(data: Meeting[]): number {
    const meetingMap: Record<string, Set<string>> = {};
    data.forEach((meeting) => {
      const { service_body_bigint: serviceBodyId, meeting_name: meetingName } = meeting;
      const normalizedMeetingName = meetingName.trim().toLowerCase();
      if (!meetingMap[serviceBodyId]) {
        meetingMap[serviceBodyId] = new Set();
      }
      meetingMap[serviceBodyId].add(normalizedMeetingName);
    });
    return Object.values(meetingMap).reduce((total, set) => total + set.size, 0);
  }

  function calculateTotals(data: Meeting[]) {
    let totalMeetings = 0;
    let inPerson = 0;
    let virtual = 0;
    let hybrid = 0;
    let tempVirtual = 0;
    let tempClosed = 0;

    for (const meeting of data) {
      const formats = meeting.formats.split(',');
      if (!formats.includes('VM') && !formats.includes('TC') && !formats.includes('HY')) {
        inPerson++;
      } else if (formats.includes('VM') && !formats.includes('TC') && !formats.includes('HY')) {
        virtual++;
      } else if (formats.includes('VM') && formats.includes('TC') && !formats.includes('HY')) {
        virtual++;
        tempVirtual++;
      } else if (!formats.includes('VM') && !formats.includes('TC') && formats.includes('HY')) {
        hybrid++;
      } else if (formats.includes('VM') && !formats.includes('TC') && formats.includes('HY')) {
        hybrid++;
      } else if (!formats.includes('VM') && formats.includes('TC') && !formats.includes('HY')) {
        tempClosed++;
      }
      totalMeetings++;
    }

    meetingTotals = {
      inPerson,
      virtual,
      tempVirtual,
      hybrid,
      tempClosed,
      totalMeetings,
      totalGroups: calculateTotalGroups(data)
    };
    console.log('Calculated totals:', meetingTotals);
  }

  // JSONP fetch implementation
  async function fetchJsonp(url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
      const script = document.createElement('script');
      script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}`;
      script.id = `jsonp_${callbackName}`;

      const customWindow = getCustomWindow();
      customWindow[callbackName] = (data: any) => {
        resolve({
          ok: true,
          json: () => Promise.resolve(data)
        } as Response);
        document.head.removeChild(script);
        delete customWindow[callbackName];
      };

      script.onerror = () => {
        reject(new Error(`JSONP request to ${url} failed`));
        document.head.removeChild(script);
        delete customWindow[callbackName];
      };

      document.head.appendChild(script);
    });
  }
</script>

<div class="container">
  <div id="content">
    <div class="wht" id="title">Get Meetings By Venue-Type</div>
    <br />

    <label class="mag" for="tomato-dropdown"
      >Root Servers:&nbsp;
      <select id="tomato-dropdown" name="tomato-roots" onchange={handleRootServerSelect}>
        <option value="">Select a root server:</option>
        {#each tomatoServers as server}
          <option value={server.rootURL}>{server.name}</option>
        {/each}
      </select>
    </label>

    <br />
    <br />

    {#if selectedRootServer}
      <div class="mag inline">You selected:</div>
      <div class="red inline">{selectedRootServer.name}</div>
    {/if}

    <br />
    <br />

    {#if regions.length > 0}
      <label class="mag" for="regions-dropdown"
        >Regions:&nbsp;
        <select id="regions-dropdown" name="regions" onchange={handleRegionSelect}>
          <option value="">Select a region:</option>
          {#each regions as region}
            <option value={region.id}>{region.name}</option>
          {/each}
        </select>
      </label>
    {/if}

    <br />

    {#if selectedRegion}
      <div class="mag inline">You selected:</div>
      <div class="red inline">{selectedRegion.name}</div>
    {/if}

    <br />
    <br />

    {#if serviceBodies.length > 0}
      <label class="mag" for="service-bodies-dropdown"
        >Service Bodies:&nbsp;
        <select id="service-bodies-dropdown" name="service-bodies" onchange={handleServiceBodySelect}>
          <option value="">Select a service body:</option>
          {#each serviceBodies as serviceBody}
            <option value={serviceBody.id}>{serviceBody.name}</option>
          {/each}
        </select>
      </label>
    {/if}

    <br />

    {#if selectedServiceBody}
      <div class="mag inline">You selected:</div>
      <div class="red inline">{selectedServiceBody.name}</div>
    {/if}

    <br />
    <br />

    {#if meetingTotals.totalMeetings > 0}
      <div id="tallyDiv">
        <div class="wht">Total Meetings By Venue Type</div>
        <br />
        <div class="blu">-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=</div>
        <br />
        <div class="tal inline">In-Person: &nbsp;</div>
        <div class="grn inline">{meetingTotals.inPerson}</div>
        <br />
        <div class="tal inline">Hybrid: &nbsp;</div>
        <div class="grn inline">{meetingTotals.hybrid}</div>
        <br />
        <div class="tal inline">Virtual: &nbsp;</div>
        <div class="grn inline">{meetingTotals.virtual}</div>
        <br />
        <div class="wht inline">Total Meetings: &nbsp;</div>
        <div class="grn inline">{meetingTotals.totalMeetings}</div>
        <br />
        <div class="wht inline">Total Groups: &nbsp;</div>
        <div class="grn inline">{meetingTotals.totalGroups}</div>
        <br />
        <br />
        <div class="blu">-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=</div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background-color: #000000;
  }

  :global(option) {
    color: #fffc72;
    background-color: #000000;
  }

  :global(select) {
    color: #fffc72;
    background-color: #000000;
  }

  .mag {
    color: #ff77fc;
  }

  .red {
    color: #ff6e68;
  }

  .wht {
    color: #ffffff;
  }

  .blu {
    color: #6771fb;
  }

  .tal {
    color: #5cfdff;
  }

  .grn {
    color: #5cfa72;
  }

  .container {
    width: 700px;
    height: 600px;
    border: 2px solid #000;
  }

  #content {
    width: 95%;
    margin: 10px auto;
    border: 2px solid #000;
  }

  .inline {
    display: inline;
  }

  #tallyDiv {
    display: block;
  }
</style>
