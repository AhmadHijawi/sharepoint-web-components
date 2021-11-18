<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string
export let filter = 'ID ne 0'
export let limit:number = 4
export let columns:number = 4
export let dir:string = 'ltr'
export let height:number = 400
export let smallwidth:number = 576
export let mediumwidth:number = 768
export let orderField = 'ArticleStartDate'
export let orderDirection = 'desc'
export let imagefield:string = 'PublishingRollupImage'
export let datefilterfromtext:string = 'From'
export let datefiltertotext:string = 'To'
export let nexttext:string = 'Next'
export let prevtext:string = 'Previous'
export let datefromfield:string = 'ArticleStartDate'
export let datetofield:string = ''
export let showheader = 'true'
export let showfilters = 'true'
export let showpaging = 'true'

let fullWidth:number = 1
let count:number
let fields = ['Title','FileRef','FieldValuesAsHtml']
let prevUrl:string
let nextUrl:string
let currentUrl:string
let pages:any[] = []

let filtersList:string[] = []

let showFromCalendar = false
let fromStr:string
$: from = new Date(fromStr || null)

let showToCalendar = false
let toStr:string
$: to = new Date(toStr || null)

const getDateForFilter = (date:Date) => {
    return `${date.toISOString().substring(0, date.toISOString().indexOf('T'))}`
}

$: {
    filtersList = []

    if(fromStr){
        filtersList = [...filtersList, `${datefromfield} ge datetime'${getDateForFilter(from)}T00:00:00Z'`]
    }
    if(toStr){
        filtersList = [...filtersList, `${datefromfield} le datetime'${getDateForFilter(to)}T23:00:00Z'`]
    }
    if(filter){
        filtersList = [...filtersList, filter];
    }
}

$: filters = `(${filtersList.join(') and (')})`

$: {
    currentUrl = null
    prevUrl = null
    nextUrl = null
    fetchCards(filters)
}

$: count = limit || 4

$: layout = fullWidth <= smallwidth ? 1 : (fullWidth <= mediumwidth ? Math.min(columns, 3) : Math.min(columns, 6))

$: allFields = fields.concat(datefromfield, datetofield).filter(f => {return f})

const fetchCards = async (spFilters:string) => {
    if(filtersList && filtersList.length > 0 && allFields && allFields.length > 0){
        console.log(document)
        siteurl = siteurl || `${document.location.protocol}//${document.location.host}`
        console.log(siteurl)
        currentUrl = currentUrl || `${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${allFields.join(',')}&$top=${count}&$filter=${spFilters}&$orderby=${orderField} ${orderDirection}`
        var pagesRes = await fetch(currentUrl, options)
        var data = (await pagesRes.json())
        pages = data.d.results;

        if(data.d.__next){
            nextUrl = data.d.__next
        }

        for(var i = 0; i < pages.length; i++){
            var imgRes = await fetch(`${pages[i].FieldValuesAsHtml.__deferred.uri}`, options)
            var fieldValues = (await imgRes.json()).d
            pages[i].imageUrl = options.extractImageUrl(siteurl, fieldValues[imagefield])
        }
    }
}

const fetchPrev = () => {
    nextUrl = currentUrl
    currentUrl = prevUrl
    prevUrl = ''
    fetchCards(filters)
}

const fetchNext = () => {
    prevUrl = currentUrl
    currentUrl = nextUrl
    nextUrl = ''
    fetchCards(filters)
}

onMount(() => {
    fetchCards(filters)
})

</script>

<svelte:options tag="sp-cards"></svelte:options>

<div>
    <div class="cards {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
        {#if showheader === 'true'}
            <div class="header">
                <div class="title"><slot></slot></div>
                {#if showfilters === 'true'}
                    <div class="filters">
                        {datefilterfromtext}
                        <button on:click="{() => {showFromCalendar = !showFromCalendar; showToCalendar = false;}}">
                            <i-calendar width="30" height="30"></i-calendar>
                            <span>{fromStr ? fromStr.replace(/-/g, '/') : ''}</span>
                        </button>
                        {datefiltertotext}
                        <button on:click="{() => {showToCalendar = !showToCalendar; showFromCalendar = false;}}">
                            <i-calendar width="30" height="30"></i-calendar>
                            <span>{toStr ? toStr.replace(/-/g, '/') : ''}</span>
                        </button>
                    </div>
                    <sp-calendar
                        style="display: {showFromCalendar ? 'block' : 'none'};"
                        value="{fromStr}"
                        maxdate="{toStr}"
                        on:change="{(e) => {
                            fromStr = e.detail;
                            showFromCalendar = showToCalendar = false;
                        }}">
                    </sp-calendar>

                    <sp-calendar 
                        style="display: {showToCalendar ? 'block' : 'none'};"
                        value="{toStr}"
                        mindate="{fromStr}"
                        on:change="{(e) => {
                                toStr = e.detail;
                                showFromCalendar = showToCalendar = false;
                            }}">
                    </sp-calendar>
                {/if}
                <div style="clear: both;"></div>
            </div>
        {/if}
        <div class="cards-row">
            {#if pages && pages.length > 0}
                {#each pages as page}
                    {#if page.imageUrl}
                    <div class="card-column" style="width: {100 / layout}%;">
                        <a class="card" href="{`${siteurl}${page.FileRef}`}" style="height: {height}px;">
                            <div class="image" style="height: {height - 130}px; background-image: url('{page.imageUrl}');"></div>
                            <div class="content">
                                <h4>{page.Title}</h4>
                                <p>{new Date(page[datefromfield]).toLocaleDateString()} {datetofield ? ` - ${new Date(page[datefromfield]).toLocaleDateString()}` : ''}</p>
                            </div>
                        </a>
                    </div>
                    {/if}
                {/each}
            {:else}
                <div class="card-column" style="width: {100 / layout}%;">
                    <a class="card" href="#" style="height: {height}px;">
                        <div class="image" style="height: {height - 130}px;"></div>
                        <div class="content">
                        </div>
                    </a>
                </div>
            {/if}
        </div>
        <div style="clear: both;"></div>
        {#if showpaging === 'true'}
            {#if prevUrl}
                <span on:click="{() => {fetchPrev()}}" class="paging-link">
                    {prevtext}
                </span>
            {/if}
            {#if nextUrl}
                <span on:click="{() => {fetchNext()}}" class="paging-link">
                    {nexttext}
                </span>
            {/if}
        {/if}
    </div>
</div>

<style>
    .cards {
        margin: 0 -10px 0 -10px;
    }

    .header {
        height: 70px;
        padding: 0 10px 0 10px;
    }

    .title {
        height: 100%;
        float: left;
    }

    .rtl .title {
        float: right;
    }

    .filters {
        font-size: 1.3em;
        padding-top: 13px;
        float: right;
    }

    .rtl .filters {
        float: left;
    }

    .filters button {
        transition: all 0.1s;
        border: none;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 0 3px rgb(0 0 0 / 20%);
    }

    .filters button:hover {
        box-shadow: 0 0 3px rgb(0 0 0 / 30%);
    }

    .filters button:active {
        box-shadow: 0 0 1px rgb(0 0 0 / 60%);
    }

    .filters button * {
        vertical-align: middle;
    }

    sp-calendar {
        position: absolute;
        right: 0;
        margin-top: 50px;
        z-index: 2;
    }

    .rtl sp-calendar {
        right:unset;
        left: 0;
    }

    .card-column {
        float: left;
        padding: 0 10px 0 10px;
        box-sizing: border-box;
    }

    .rtl .card-column {
        float: right;
    }

    .card {
        border-radius: 10px;
        box-shadow: 0px 2px 8px -5px #000;
        display: block;
        margin-bottom: 20px;
        overflow: hidden;
        position: relative;
        transition: all 0.2s;
        width: 100%;
        z-index: 1;
    }

    .card:hover {
        box-shadow: 0px 2px 20px -9px #000;
        transform: scale(1.1);
        z-index: 2;
    }

    .card:active {
        box-shadow: none;
        transform: scale(0.95);
    }

    .image {
        background-size: cover;
        background-position: center;
    }

    .content {
        position: absolute;
        padding: 10px;
        bottom: 0;
        background: #fff;
        width: 100%;
        box-sizing: border-box;
        height: 130px;
    }

    .content * {
        color: #333;
    }

    h4 {
        margin: 0;
    }

    .paging-link {
        cursor: pointer;
        margin: 7px;
        display: inline-block;
        background: #fff;
        transition: all 0.1s;
        padding: 7px 15px;
        box-shadow: 0 0 3px rgb(0 0 0 / 20%);
    }

    .paging-link:hover {
        box-shadow: 0 0 3px rgb(0 0 0 / 30%);
    }

    .paging-link:active {
        box-shadow: 0 0 1px rgb(0 0 0 / 60%);
    }
</style>