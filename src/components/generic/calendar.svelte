<script lang="ts">
// export let width = 400
// export let primarycolor = '#c2002f'
// export let textcolor = '#333'
export let mindate:string = ''
export let maxdate:string = ''
export let value:string = ''

let el:HTMLElement
let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

let displayYear:number = (new Date(value || new Date())).getFullYear()
let displayMonth:number = (new Date(value || new Date())).getMonth()

$: minDate = mindate ? new Date(mindate) : null
$: maxDate = maxdate ? new Date(maxdate) : null

$: {
    if(value){
        if(maxDate && new Date(value) > maxDate) {
            value = maxDate.toISOString().substr(0, 10)
            displayYear = maxDate.getFullYear()
            displayMonth = maxDate.getMonth()
        }
    
        if(minDate && new Date(value) < minDate) {
            value = minDate.toISOString().substr(0, 10)
            displayYear = minDate.getFullYear()
            displayMonth = minDate.getMonth()
        }
    }
}

$: displayMonthStartDate = new Date(displayYear, displayMonth, 1)
$: displayMonthFirstDay = displayMonthStartDate.getDay()
$: displayMonthEndDate = new Date(displayYear, displayMonth + 1, 0)
$: displayMonthLastDay = displayMonthEndDate.getDate()

const getCellDate = (year:number, month:number, dayCellIndex:number) => {
    return new Date(year, month, dayCellIndex + 1 - displayMonthFirstDay)
}

const cellIsInDisplayMonth = (cellIndex:number, monthFirstDay:number, monthLastDay:number) => {
    return cellIndex >= monthFirstDay && cellIndex + 1 - monthFirstDay <= monthLastDay
}

const changeDisplayMonthBy = (numberOfMonths:number) => {
    displayYear += numberOfMonths >= 12 ? Math.floor(numberOfMonths / 12) : 0
    displayYear += numberOfMonths <= -12 ? Math.ceil(numberOfMonths / 12) : 0
    displayMonth += numberOfMonths % 12

    if(displayMonth < 0){
        displayYear--;
        displayMonth += 12
    }
    else if (displayMonth > 11){
        displayYear++;
        displayMonth -= 12
    }
}

//WORKAROUND!!
//included (mindate:string, maxdate:string) to 
//disable/enable day cells when mindate/maxdate change at runtime
const cellIsEnabled = (year:number, month:number, dayCell:number, mindate:string, maxdate:string) => {
    var cellDate = getCellDate(year, month, dayCell)
    var cellNextDate = getCellDate(year, month, dayCell + 1)

    return (!minDate || cellNextDate >= minDate) && (!maxDate || cellDate <= maxDate) && cellIsInDisplayMonth(dayCell, displayMonthFirstDay, displayMonthLastDay)
}

const selectDate = (day: number) => {
    if(cellIsEnabled(displayYear, displayMonth, day - 1 + displayMonthFirstDay, mindate, maxdate)){
        value = (new Date(displayYear, displayMonth, day + 1)).toISOString().substr(0, 10)
        el.dispatchEvent(new CustomEvent('change', {
            detail: value,
            composed: true
        }))
    }
}

</script>

<svelte:options tag="sp-calendar"></svelte:options>

<div bind:this={el} class="calendar">
    <div class="header">
        <div class="view-title">
            {displayYear}\{displayMonth + 1}
        </div>
        <div class="controls">
            <span on:click="{() => {changeDisplayMonthBy(-12)}}">
                <i-chevron-down width="17" height="17"></i-chevron-down>
            </span>
            <span on:click="{() => {changeDisplayMonthBy(-1)}}">
                <i-chevron-left width="17" height="17"></i-chevron-left>
            </span>
            <span on:click="{() => {changeDisplayMonthBy(1)}}">
                <i-chevron-right width="17" height="17"></i-chevron-right>
            </span>
            <span on:click="{() => {changeDisplayMonthBy(12)}}">
                <i-chevron-up width="17" height="17"></i-chevron-up>
            </span>
        </div>
        <div style="clear: both;"></div>
    </div>
    {#each weekDays as dayName}
    <span class="cell">
        {dayName}
    </span>
    {/each}
    {#each [...Array(42).keys()] as dayCell}
        <span
        class="cell day-cell"
        title="{`${displayYear}-${displayMonth + 1}-${dayCell + 1 - displayMonthFirstDay}`}"
        class:hidden="{!cellIsInDisplayMonth(dayCell, displayMonthFirstDay, displayMonthLastDay)}"
        class:disabled="{!cellIsEnabled(displayYear, displayMonth, dayCell, mindate, maxdate)}"
        class:today="{
            displayYear === (new Date()).getFullYear() &&
            displayMonth === (new Date()).getMonth() &&
            (dayCell + 1 - displayMonthFirstDay) === (new Date()).getDate()
        }"
        class:selected="{
            value &&
            displayYear === (new Date(value)).getFullYear() &&
            displayMonth === (new Date(value)).getMonth() &&
            (dayCell + 1 - displayMonthFirstDay) === (new Date(value)).getDate()
        }"
        on:click="{() => {selectDate(getCellDate(displayYear, displayMonth, dayCell).getDate())}}"
        >
            {getCellDate(displayYear, displayMonth, dayCell).getDate()}
        </span>
    {/each}
</div>

<style>
    .calendar {
        width: 287px;
        padding: 11px;
        user-select: none;
        box-shadow: 1px 2px 5px -3px;
        border: 1px solid rgba(0,0,0,0.2);
        border-radius: 10px;
        background-color: #fff;
    }

    .header {
        height: 35px;
        direction: ltr;
    }

    .header div {
        width: 50%;
        float: left;
    }

    .view-title {
        text-align: left;
        font-size: 1.2em;
    }

    .controls {
        text-align: right;
    }

    .controls span {
        display: inline-block;
        padding: 3px;
        width: 17px;
        height: 17px;
        cursor: pointer;
    }

    .controls span:hover {
        box-shadow: 0 0 3px rgb(0 0 0 / 30%);
    }

    .controls span:active {
        box-shadow: 0 0 1px rgb(0 0 0 / 60%);
    }

    .cell {
        display: inline-block;
        text-align: center;
        height: 33px;
        width: 33px;
        line-height: 35px;
        font-size: 0.9em;
        margin: 3px;
        border: 1px solid #fff;
        transition: all 0.1s;
    }

    .day-cell {
        color: #333;
        box-shadow: 0 0 1px rgb(0 0 0 / 30%);
        border: 1px solid rgb(0 0 0 / 30%);
        cursor: pointer;
    }

    .day-cell:hover {
        box-shadow: 0 0 3px rgb(0 0 0 / 30%);
        font-weight: bold;
    }

    .today {
        border-color: rgb(8, 46, 109);
        font-weight: bold;
    }

    .selected {
        background-color: rgb(8, 46, 109);
        box-shadow: 0 0 2px #333;
        color: #fff;
        font-weight: bold;
    }

    .hidden {
        visibility: hidden;
    }

    .disabled {
        cursor: not-allowed;
        box-shadow: none !important;
        background-color: #f2f2f2;
        border-color: transparent;
        color: #aaa;
    }
</style>