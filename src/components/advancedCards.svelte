<svelte:options tag="sp-advanced-cards"></svelte:options>

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
export let orderField = 'ID'
export let orderDirection = 'desc'
export let imagefield:string = 'PublishingRollupImage'
export let datefilterenabled:string = 'true'
export let datefromfield:string = 'ArticleStartDate'
export let datetofield:string = ''

let fullWidth:number = 1
let count:number
let fields = ['Title','FileRef','FieldValuesAsHtml']
let pages:any[] = []

let filtersList:string[] = []

let fromStr:string
$: from = new Date(fromStr || null)

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
    fetchCards(filters)
}

$: count = limit || 4

$: layout = fullWidth <= smallwidth ? 1 : (fullWidth <= mediumwidth ? Math.min(count, 3) : Math.min(count, 6))

$: allFields = fields.concat(datefromfield, datetofield).filter(f => {return f})

const fetchCards = async (spFilters:string) => {
    if(filtersList && filtersList.length > 0 && allFields && allFields.length > 0){
        var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${allFields.join(',')}&$top=${count}&$filter=${spFilters}&$orderby=${orderField} ${orderDirection}`, options)
        pages = (await pagesRes.json()).d.results;
        
        for(var i = 0; i < pages.length; i++){
            var imgRes = await fetch(`${pages[i].FieldValuesAsHtml.__deferred.uri}`, options)
            var fieldValues = (await imgRes.json()).d
            pages[i].imageUrl = options.extractImageUrl(siteurl, fieldValues[imagefield])
        }
    }
}

onMount(() => {
    fetchCards(filters)
})

</script>

<div>
    <div class="cards {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
        <div class="title"><slot></slot></div>
        {#if datefilterenabled === 'true'}
        <div class="filters">
            <i-calendar color="#333"></i-calendar>
            <input type="date" bind:value="{fromStr}" />
            <input type="date" bind:value="{toStr}" />
        </div>
        {/if}
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
    </div>
</div>

<style>
    .cards {
        margin: 0 -7px 0 -7px;
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
</style>