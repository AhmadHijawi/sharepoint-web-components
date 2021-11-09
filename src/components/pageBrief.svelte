<svelte:options tag="sp-page-brief"></svelte:options>

<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string = ''
export let pageid:number
export let dir:string = 'ltr'
export let imageisend:string = 'true'
export let height:number = 400
export let smallwidth:number = 768
export let imagefield:string = 'PublishingRollupImage'
export let backgroundcolor:string = 'transparent'
export let textcolor:string = '#333'

let fullWidth:number = 1
let page:any = {}

$: isMobile = fullWidth <= smallwidth
$: imageWidthPercentage = isMobile ? 100 : 40
$: float = imageisend !== 'false' ? (dir === 'rtl' ? 'left' : 'right') : (dir === 'ltr' ? 'left' : 'right')

onMount(async () => {
    var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items(${pageid})/FieldValuesAsHtml`, options)
    page = (await pagesRes.json()).d;
    page.imageUrl = options.extractImageUrl(siteurl, page[imagefield])
})

</script>

{#if page && page.imageUrl}
<div class="page {dir}" dir="{dir}" bind:clientWidth="{fullWidth}" style="height: {isMobile ? 'auto' : height + 'px'}; background-color: {backgroundcolor}">
    <div class="image-box" style="float: {float}; width: {imageWidthPercentage}%;">
        <img src="{page.imageUrl}" alt="{page.Title}" style=""/>
    </div>
    <div class="content-box" style="float: {float}; width: {imageWidthPercentage == 100 ? 100 : 100 - imageWidthPercentage}%; color: {textcolor}">
        <div>
            <h3>{page.Title}</h3>
            <p>{@html page.PublishingPageContent}</p>
        </div>
    </div>
    <div style="clear: both;"></div>
</div>
{/if}

<style>
    * {
        box-sizing: border-box;
    }

    .page {
        padding: 25px 1%;
        margin-bottom: 14px;
    }

    img {
        display: block;
        border: none;
        border-radius: 10px;
        margin: 0 auto;
        max-width: 100%;
        max-height: 100%;
    }

    .image-box {
        padding: 0 1%;
        height: 100%;
    }

    .content-box {
        padding: 0 1%;
    }
</style>