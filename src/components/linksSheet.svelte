<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string = ''
export let filter = 'ID gt 0'
export let limit:number = 1000000
export let dir:string = 'ltr'
export let height:number = 35
export let mediumwidth:number = 768
export let orderfield = 'ID'
export let orderdirection = 'desc'
export let fontsize = 16
export let fontcolor = '#333'

let fullWidth:number = 1
let count:number

$: {
    count = limit <= 0 ? 4 : limit;
} 

$: layout = fullWidth > mediumwidth ? 1 : 0;

let fields = 'Title,Url'
let links:any[] = []

onMount(async () => {
    siteurl = siteurl || `${document.location.protocol}//${document.location.host}`
    var linksRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$top=${count}&$filter=${filter}&$orderby=${orderfield} ${orderdirection}`, options)
    var rowLinks = (await linksRes.json()).d.results;
    rowLinks.map(p => {
        if(p && p.Url && p.Url.indexOf('http') !== 0){
            p.Url = `${siteurl}${p.Url}`;
        }
    })
    links = rowLinks;
})

</script>

<svelte:options tag="sp-links-sheet"></svelte:options>

<div class="links {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
    {#each links as link}
        <div class="link-column" style="width: {layout ? '220px' : '50%'};">
            <a class="link" href="{link.Url}" style="height: {height}px; font-size: {fontsize}px; color: {fontcolor};">
                {link.Title}
            </a>
        </div>
    {/each}
    <div style="clear: both;"></div>
</div>

<style>
    .links {
        margin: 0 -7px 0 -7px;
    }

    .link-column {
        float: left;
        padding: 0 7px 0 7px;
        box-sizing: border-box;
    }

    .rtl .link-column {
        float: right;
    }

    .link {
        display: block;
        width: 100%;
        text-decoration: none;
        margin: 5px;
    }
</style>