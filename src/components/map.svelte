<svelte:options tag="sp-map" />

<script lang="ts">
  import L from "leaflet";
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";
  import options from "../service";

  export let weburl: string;
  export let list: string;
  export let siteurl: string = "";
  export let filter = "ID ne 0";
  export let height = 500;
  export let zoom = 12;
  export let lat: number;
  export let long: number;
  export let markerlinktext = 'show'

  let mapContainer: HTMLDivElement;
  let markers: any[] = [];

  onMount(async () => {
    var map = L.map(mapContainer, {
      center: [lat, long],
      zoom: zoom,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    siteurl = siteurl || `${document.location.protocol}//${document.location.host}`
    const response = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=Title,Lat,Long&$filter=${filter}`, options);

    markers = (await response.json()).d.results;

    if (markers && markers.length > 0) {
      markers.map((m) => {
        var marker = L.marker([Number(m.Lat), Number(m.Long)], {
          icon: new L.Icon({
            iconAnchor: [12.5, 41],
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          }),
        }).addTo(map)

        marker.bindPopup(`<b>${m.Title}</b><br/><a target="_blank" href="https://www.google.com/maps/@${m.Lat},${m.Long},19z">${markerlinktext}</a>`)
      });
    }
  });
</script>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
  integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
  crossorigin=""
/>
<div bind:this={mapContainer} id="map" style="width:100%; height:{height}px;"></div>

<style>
    #map {
        margin-bottom: 14px;
        border-radius: 10px;
        box-shadow: 1px 3px 8px -4px #000;
        z-index: 2;
    }

    #map:hover {
        box-shadow: 0px 2px 5px -3px #000;
    }

    #map:active {
        box-shadow: 0px 1px 3px -1px #000;
    }
</style>