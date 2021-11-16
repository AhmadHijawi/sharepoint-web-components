<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let weburl:string
export let list:string
export let siteurl:string = ''
export let filter = 'ID ne 0'
export let limit:number = 4
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

$: layout = fullWidth <= smallwidth ? 1 : (fullWidth <= mediumwidth ? Math.min(count, 3) : Math.min(count, 6))

$: allFields = fields.concat(datefromfield, datetofield).filter(f => {return f})

const fetchCards = async (spFilters:string) => {
    if(filtersList && filtersList.length > 0 && allFields && allFields.length > 0){
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

<svelte:options tag="sp-advanced-cards"></svelte:options>

<div>
    <div class="cards {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
        <div class="header">
            <div class="title"><slot></slot></div>
            <div class="filters">
                {datefilterfromtext}
                <button on:click="{() => {showFromCalendar = !showFromCalendar; showToCalendar = false;}}">
                    <i-calendar width="30" height="30"></i-calendar>
                    <span>{fromStr || ''}</span>
                </button>
                {datefiltertotext}
                <button on:click="{() => {showToCalendar = !showToCalendar; showFromCalendar = false;}}">
                    <i-calendar width="30" height="30"></i-calendar>
                    <span>{toStr || ''}</span>
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
            <div style="clear: both;"></div>
        </div>
        {#each pages as page}
        {#if page.imageUrl}
        <div class="card-column" style="width: {100 / layout}%;">
            <a class="card" href="{`${siteurl}${page.FileRef}`}" style="height: {height}px; background-image: url('{page.imageUrl}');">
                <div class="content">
                    <h4>{page.Title}</h4>
                    <p>{new Date(page[datefromfield]).toLocaleDateString()} {datetofield ? ` - ${new Date(page[datefromfield]).toLocaleDateString()}` : ''}</p>
                </div>
            </a>
        </div>
        {/if}
        {/each}
        <div style="clear: both;"></div>
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
    </div>
</div>

<style>
    .cards {
        margin: 0 -7px 0 -7px;
    }

    .header {
        height: 70px;
        padding: 0 7px 0 7px;
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
        background: none;
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
        left: 0;
        top: 50px;
        background: #fff;
        z-index: 2;
    }

    .card-column {
        float: left;
        padding: 0 7px 0 7px;
        box-sizing: border-box;
    }

    .rtl .card-column {
        float: right;
    }

    .card {
        position: relative;
        border-radius: 10px;
        box-shadow: 1px 3px 8px -4px #000;
        overflow: hidden;
        display: block;
        margin-bottom: 14px;
        transition: box-shadow 0.05s;
        background-position-x: center;
        background-repeat: no-repeat;
        width: 100%;
    }

    .card:hover {
        box-shadow: 0px 2px 5px -3px #000;
    }

    .card:active {
        box-shadow: 0px 1px 3px -1px #000;
    }

    .content {
        position: absolute;
        padding: 10px;
        bottom: 0;
        background: #fff;
        width: 100%;
        box-sizing: border-box;
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