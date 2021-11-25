<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl = ''
export let pageid:number
export let dir = 'ltr'
export let imageisend = 'true'
export let height = 400
export let smallwidth = 768
export let imagefield = 'PublishingRollupImage'
export let backgroundcolor = 'transparent'
export let textcolor = '#333'

let fullWidth:number = 1
let page:any = {}

$: isMobile = fullWidth <= smallwidth
$: imageWidthPercentage = isMobile ? 100 : 40
$: float = imageisend !== 'false' ? (dir === 'rtl' ? 'left' : 'right') : (dir === 'ltr' ? 'left' : 'right')

onMount(async () => {
    siteurl = siteurl || `${document.location.protocol}//${document.location.host}`
    var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items(${pageid})/FieldValuesAsHtml`, options)
    page = (await pagesRes.json()).d;
    console.log(page)
    page.imageUrl = options.extractImageUrl(siteurl, page[imagefield])
})

</script>

<svelte:options tag="sp-page-brief"></svelte:options>

{#if page && page.imageUrl}
<div class="page {dir}" dir="{dir}" bind:clientWidth="{fullWidth}" style="height: {isMobile ? 'auto' : height + 'px'}; background-color: {backgroundcolor}">
    <div class="image-box" style="float: {float}; width: {imageWidthPercentage}%;">
        <img src="{page.imageUrl}" alt="{page.Title}" style=""/>
    </div>
    <div class="content-box" style="float: {float}; width: {imageWidthPercentage == 100 ? 100 : 100 - imageWidthPercentage}%; color: {textcolor}">
        <div class="content">
            <a style="color: {textcolor}; font-size: 1rem;" href="{`${siteurl}/${weburl}/pages/${page.FileLeafRef}`}">
                <h2>{@html page.Title}</h2>
            </a>
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
        padding: 25px 0;
        margin-bottom: 14px;
    }

    img {
        display: block;
        border: none;
        border-radius: 10px;
        margin: 0;
        max-width: 100%;
        max-height: 100%;
        position: absolute;
        transform: translateY(-50%);
        top: 50%;
    }

    .image-box {
        padding: 0;
        height: 100%;
        position: relative;
    }

    .content-box {
        position: relative;
        padding: 0 1%;
        height: 100%;
        overflow: hidden;
        text-align: justify;
    }

    .content-box h2{
        margin-top: 0;
    }

    .content-box p{
        font-size: 1.2rem;
    }
</style>