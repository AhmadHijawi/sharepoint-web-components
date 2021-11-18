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
export let orderField = 'ID'
export let orderDirection = 'desc'
export let fontsize = 16

let fullWidth:number = 1
let count:number

$: {
    count = limit <= 0 ? 4 : limit;
} 

$: layout = fullWidth > mediumwidth ? 1 : 0;

let fields = 'Title,Url,CssColor,Columns'
let pages:any[] = []

onMount(async () => {
    siteurl = siteurl || document.currentScript.ownerDocument.baseURI
    var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options)
    pages = (await pagesRes.json()).d.results;
})

</script>

<svelte:options tag="sp-links-grid"></svelte:options>

<div class="links {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
    {#each pages as page}
        <div class="link-column" style="width: {(layout ? (Math.pow((page.Columns || 12),layout) / 12) : 1) * 100}%;">
            <a class="link {page.Url ? 'clickable' : ''}" href="{page.Url}" style="height: {height}px; line-height: {height}px; font-size: {fontsize}px; background-color: {page.CssColor || '#fff'}">
                {page.Title}
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
        margin-bottom: 14px;
    }

    .rtl .link-column {
        float: right;
    }

    .link {
        border-radius: 10px;
        display: block;
        width: 100%;
        text-align: center;
        text-decoration: none;
        color: #fff;
    }

    .clickable {
        background: linear-gradient(163deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%);
        box-shadow: 1px 3px 8px -4px #000;
        transition: all 0.05s;
    }

    .clickable:hover {
        background: linear-gradient(350deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%);
        box-shadow: 0px 2px 5px -3px #000;
    }

    .clickable:active {
        background: linear-gradient(163deg, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.0) 100%);
        box-shadow: 0px 1px 3px -1px #000;
    }
</style>