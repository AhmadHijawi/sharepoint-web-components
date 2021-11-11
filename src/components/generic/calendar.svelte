<svelte:options tag="sp-calendar" />

<script lang="ts">
// export let width = 400
// export let primarycolor = '#c2002f'
// export let textcolor = '#333'
// export let mindate:string
// export let maxdate:string
export let value:string = (new Date()).toISOString().substr(0, 10)
let el:HTMLElement
let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

let displayYear:number = (new Date(value)).getFullYear()
let displayMonth:number = (new Date(value)).getMonth()

$: displayMonthStartDate = new Date(displayYear, displayMonth, 1)
$: displayMonthFirstDay = displayMonthStartDate.getDay()
$: displayMonthEndDate = new Date(displayYear, displayMonth + 1, 0)
$: displayMonthLastDay = displayMonthEndDate.getDate()

const getDate = (day:number) => {
    return new Date(displayYear, displayMonth, day)
}

const dayIsInDisplayMonth = (cellIndex:number, monthFirstDay:number, monthLastDay: number) => {
    return cellIndex >= monthFirstDay && cellIndex + 1 - displayMonthFirstDay <= monthLastDay
}

const changeDisplayMonthBy = (numberOfMonths:number) => {
    displayYear += numberOfMonths >= 12 ? Math.floor(numberOfMonths / 12) : 0
    displayYear += numberOfMonths <= -12 ? Math.ceil(numberOfMonths / 12) : 0
    displayMonth += numberOfMonths % 12

    if(displayMonth < 1){
        displayYear--;
        displayMonth += 12
    }
    else if (displayMonth > 12){
        displayYear++;
        displayMonth -= 12
    }
}

const selectDate = (day: number) => {
    value = (new Date(displayYear, displayMonth, day)).toISOString().substr(0, 10)
    el.dispatchEvent(new CustomEvent('change', {
        detail: value,
        composed: true
    }))
}

</script>
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
    <br/>
    {#each [...Array(6).keys()] as weekRow}
    {#each [...Array(7).keys()] as dayOfWeekCell}
        <span
        class="cell day-cell"
        class:disabled="{!dayIsInDisplayMonth(dayOfWeekCell + (weekRow * 7), displayMonthFirstDay, displayMonthLastDay)}"
        class:today="{
            displayYear === (new Date()).getFullYear() &&
            displayMonth === (new Date()).getMonth() &&
            (dayOfWeekCell + 1 + (weekRow * 7) - displayMonthFirstDay) === (new Date()).getDate()
        }"
        class:selected="{
            displayYear === (new Date(value)).getFullYear() &&
            displayMonth === (new Date(value)).getMonth() &&
            (dayOfWeekCell + 1 + (weekRow * 7) - displayMonthFirstDay) === (new Date(value)).getDate()
        }"
        on:click="{() => {selectDate(getDate(dayOfWeekCell + 1 + (weekRow * 7) - displayMonthFirstDay).getDate() + 1)}}"
        >
            {getDate(dayOfWeekCell + 1 + (weekRow * 7) - displayMonthFirstDay).getDate()}
        </span>
    {/each}
    <br/>
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
    }

    .header {
        height: 30px;
        direction: ltr;
    }

    .header div {
        width: 50%;
        float: left;
    }

    .view-title {
        text-align: left;
        font-size: 1.5em;
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
        height: 35px;
        width: 35px;
        line-height: 35px;
        font-size: 0.9em;
        margin: 3px;
        transition: all 0.1s;
    }

    .day-cell {
        color: #333;
        box-shadow: 0 0 1px rgb(0 0 0 / 30%);
        cursor: pointer;
    }

    .day-cell:hover {
        box-shadow: 0 0 3px rgb(0 0 0 / 30%);
    }

    .today {
        background-color: rgba(0,0,0,0.07);
    }

    .selected {
        background-color: rgb(8, 46, 109);
        box-shadow: 0 0 2px #333;
        color: #fff;
        font-weight: bold;
    }

    .disabled {
        visibility: hidden;
    }
</style>