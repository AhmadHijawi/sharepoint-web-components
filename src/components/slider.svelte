<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string = ''
export let filter:string = 'ID gt 0'
export let limit:number = 1000000
export let dir:string = 'ltr'
export let height:number = 400
export let interval:number = 5000
export let orderField = 'ID'
export let orderDirection = 'desc'

let fields = 'Title,Description,FileRef,Url'
let slides:any[] = []
let activeIndex = 0
let mouseIsIn: boolean = false
let count:number

$: {
    count = (limit <= 0 || limit > 10) ? 4 : limit;

    if(limit <= 0 || limit > 10)
    {
        console.log('sp-slider: limit should between 0 and 10')
    }
} 

onMount(async () => {
    siteurl = siteurl || `${document.location.protocol}//${document.location.host}`
    var slidesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options)
    slides = (await slidesRes.json()).d.results;

    window.setInterval(() => {
        if(!mouseIsIn){
            activeIndex = activeIndex + 1 >= slides.length ? 0 : activeIndex + 1;
        }
    }, interval)
})
</script>

<svelte:options tag="sp-slider"></svelte:options>

<div class="slider {dir}" dir="{dir}" style="height: {height || 400}px;" on:mouseenter="{() => {mouseIsIn = true}}" on:mouseleave="{() => {mouseIsIn = false}}">
    <div class="dots" style="top: {(height || 400) - 50}px;">
        {#each slides as _, index}
        <div class="dot" style="width: {index == activeIndex ? 60 : 30}px;" on:click="{() => {activeIndex = index}}"></div>
        {/each}
    </div>
    {#each slides as slide, index}
        <a href="{slide.Url?.Url}" class="slide" style="background-image: url('{`${siteurl}${slide.FileRef}`}'); z-index: {index == activeIndex ? '1' : '0'}; opacity: {index == activeIndex ? '1' : '0'}">
            {#if slide.Title || slide.Description}
            <div class="content">
                {#if slide.Title}<h1>{slide.Title}</h1>{/if}
                {#if slide.Description}<h3>{slide.Description}</h3>{/if}
            </div>
            {/if}
        </a>
    {/each}
    <div style="clear: both;"></div>
</div>

<style>
    .slider {
        position: relative;
        margin-bottom: 14px;
        overflow: hidden;
        border-radius: 10px;
        box-shadow: 1px 3px 8px -4px #000;
    }

    .slider:hover {
        box-shadow: 0px 2px 5px -3px #000;
    }

    .slider:active {
        box-shadow: 0px 1px 3px -1px #000;
    }

    .slide {
        position: absolute;
        display: block;
        width: 100%;
        height: 100%;
        background-position-x: center;
        background-position-y: center;
        background-size: cover;
        transition: opacity 0.2s;
    }

    .content {
        background: rgb(0,0,0);
        background: linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.4962359943977591) 56%);
    }

    .rtl .content {
        background: rgb(0,0,0);
        background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.4962359943977591) 56%);
    }

    .content {
        position: absolute;
        bottom: 0;
        min-width: 50%;
        max-width: 80%;
        height: 100%;
        color: #fff;
        box-sizing: border-box;
        padding: 50px 5% 0;
    }

    .dots {
        position: absolute;
        z-index: 2;
        width: 100%;
        text-align: center;
    }

    .dot {
        margin: 0 5px;
        display: inline-block;
        height: 30px;
        border-radius: 15px;
        background: #fff;
        box-shadow: 0px 2px 5px -3px #000;
        cursor: pointer;
        transition: width 0.2s;
    }
</style>