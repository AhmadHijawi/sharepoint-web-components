<svelte:options tag="sp-cards"></svelte:options>

<script lang="ts">
import { onMount } from 'svelte';

import options from '../service'

export let siteurl:string
export let weburl:string
export let list:string
export let filter = 'ID ne 0'
export let limit:number
export let dir:string
export let height:number = 400
export let smallwidth:number = 576
export let mediumwidth:number = 768
export let orderField = 'ID'
export let orderDirection = 'desc'
export let datefromfield:string
export let datetofield:string

let fullWidth:number = 1
let count:number
let fields = ['Title','FileRef','FieldValuesAsHtml']
let pages:any[] = []

$: {
    count = (limit <= 0 || limit > 8) ? 4 : limit;

    if(limit <= 0 || limit > 8 ? 4 : limit)
    {
        console.log('sp-cards: limit should between 0 and 8')
    }
} 

$: layout = fullWidth <= smallwidth ? 1 : (fullWidth <= mediumwidth ? Math.min(count, 3) : Math.min(count, 6));

$: allFields = fields.concat(datefromfield, datetofield).filter(f => {return f})

onMount(async () => {
    var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${allFields.join(',')}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options)
    pages = (await pagesRes.json()).d.results;
    
    for(var i = 0; i < pages.length; i++){
        var imgRes = await fetch(`${pages[i].FieldValuesAsHtml.__deferred.uri}`, options)
        var fieldValues = (await imgRes.json()).d
    
        var element = document.createElement('DIV')
        element.innerHTML = fieldValues.PublishingRollupImage
        pages[i].imageUrl = `${siteurl}${element.firstElementChild.attributes['src'].nodeValue}`;
    }
})

</script>

<div class="cards {dir}" dir="{dir}" bind:clientWidth="{fullWidth}">
    {#each pages as page}
        <div class="card-column" style="width: {100 / layout}%;">
            <a class="card" href="{`${siteurl}${page.FileRef}`}" style="height: {height}px; background-image: url('{page.imageUrl}');">
                <div class="content">
                    <h4>{page.Title}</h4>
                    <p>{new Date(page[datefromfield]).toLocaleDateString()} {datetofield ? ` - ${new Date(page[datefromfield]).toLocaleDateString()}` : ''}</p>
                </div>
            </a>
        </div>
    {/each}
    <div style="clear: both;"></div>
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