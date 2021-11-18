<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string = ''
export let height = 150
export let filter = 'ID gt 0'
export let dir:string = 'ltr'
export let orderField = 'ID'
export let orderDirection = 'asc'

let fields = 'ID,Title,Content'
let items:any[] = []
let activeItem = -1

onMount(async () => {
    siteurl = siteurl || document.currentScript.ownerDocument.baseURI
    var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options)
    items = (await pagesRes.json()).d.results;
})

</script>

<svelte:options tag="sp-accordion"></svelte:options>

<div class="accordion {dir}" dir="{dir}">
    {#each items as item}
        <div class="item" class:inactive="{activeItem !== item.ID}">
            <div class="header" on:click="{() => {activeItem = activeItem === item.ID ? -1 : item.ID}}">
                <span>{item.Title}</span>
                <i-chevron-down class="chevron" width="17" height="17"></i-chevron-down>
            </div>
            <div class="body" style="height: {height}px;">
                <div class="content">
                    {@html item.Content}
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .item {
        margin-bottom: 20px;
        border-radius: 10px;
        box-shadow: 0px 2px 8px -5px #000;
    }
    
    .header {
        min-height: 50px;
        cursor: pointer;
        padding: 10px;
        box-sizing: border-box;
        border-bottom: 1px solid #aaa;
        display: flex;
    }

    .inactive .header {
        border-bottom: none;
    }

    .header > span {
        font-size: 1.1rem;
        display: flex;
        align-items: center;
    }

    .chevron {
        flex-shrink: 0;
        height: 17px;
        display: inline-block;
        margin: auto;
        margin-right: 0;
        transition: transform 0.3s;
        transform: rotate(-180deg);
    }

    .inactive .chevron {
        transform: rotate(0deg);
    }

    .rtl .chevron {
        margin-left: 0;
        margin-right: auto;
    }

    .body {
        overflow: auto;
        transition: height .3s;
    }

    .inactive .body {
        height: 0px !important;
    }

    .content {
        padding: 10px;
    }
</style>