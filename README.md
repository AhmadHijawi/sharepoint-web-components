# SharePoint Web Components

A collection of [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) designed for SharePoint 2013-2019/Online sites as isolated components, they will inherit the font family of the host page, other than that, the styles and scripts of these components will not effect or be effected by the host page's styles and scripts, as well as other copies of the same component, these components are build and compiled using [Svelte](https://svelte.dev/) to be lightweight, provide maximum performance and because [Svelte is awesome](https://insights.stackoverflow.com/survey/2021#web-frameworks)

## Usage

Upload [bundle.js](https://raw.githubusercontent.com/AhmadHijawi/sharepoint-web-components/main/public/build/bundle.js) to /Style Library/spwc

In your masterpage add:

```html
    .
    .
    .
    <script defer src='/Style Library/spwc/bundle.js'></script>
</head>
```

Then in your pages you can add the components as html elements using a ScriptEditorWebPart (Edit page > Insert > Embed Code).

### Images Slider
A full width image carousel, requires an image library with the additional fields: (Title:String, Description:String, Url:String).

#### Usage

```html
<sp-slider
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    siteurl="<site collection url (default: '/')>"
    limit="<number limit (default: 1000000)>"
    interval="<number of milliseconds (default: 5000)>"
    height="<height in pixels (default: 400)>"
    orderField="<field internal name (default: 'ID')>"
    orderDirection="<asc | desc (default: 'desc')>"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    dir="<rtl | ltr (default: ltr)>">
</sp-slider>
```

#### Example

```html
<sp-slider
    siteurl="https://our-sharepoint-site"
    weburl="ar"
    list="298968AA-09EC-44EE-A105-AA119A73FE27"
    limit="4"
    interval="3000"
    height="350"
    filter="Active eq 1"
    orderField="slideOrder"
    dir="rtl">
</sp-slider>
```

### Links Grid
A full width links grid, requires a custom list with the following fields: (Title: String, Url:String , CssColor:String, Columns:Number).

#### Usage

```html
<sp-links-grid
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    siteurl="<site collection url (default: '/')>"
    limit="<number limit (default: 1000000)>"
    height="<link height in pixels (default: 35)>"
    orderField="<field internal name (default: 'ID')>"
    orderDirection="<asc | desc (default: 'desc')>"
    mediumwidth="<medium breakpoint (default: 768)>"
    fontsize="<link text font size (default: 16)>"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    dir="<rtl | ltr (default: ltr)>">
</sp-links-grid>
```

#### Example

```html
<sp-links-grid
    siteurl="https://our-sharepoint-site"
    weburl="ar"
    list="3A88D34D-CE6B-41AE-8E5C-48F44F5F665E"
    limit="20"
    height="70"
    filter="Active eq 1"
    fontsize="20"
    dir="rtl">
</sp-links-grid>
```

### Page Brief
A full width page brief, requires a publishing page.

#### Usage

```html
<sp-page-brief
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    pageid="<page ID *required>"
    siteurl="<site collection url (default: '/')>"
    height="<card height in pixels (default: 400)>"
    smallwidth="<small breakpoint (default: 768)>"
    imageisend="<true | false (default: true)>"
    imagefield="<image field internal name (default: 'PublishingRollupImage')>"
    backgroundcolor="<css color (default: 'transparent')>"
    textcolor="<css color (default: '#333')>"
    dir="<rtl | ltr (default: ltr)>">
</sp-page-brief>
```

#### Example

```html
<sp-page-brief
    siteurl="https://our-sharepoint-site"
    weburl="ar/news"
    list="DA1A89B9-51EB-40C8-ABCB-E7BA05C4FFFC"
    pageid="2"
    dir="rtl">
</sp-page-brief>
```

### Cards
A full width page cards with optional header, date range filter and results paging, requires the "Pages" library of a SharePoint publishing site.

#### Usage

```html
<sp-cards
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    siteurl="<site collection url (default: '/')>"
    height="<card height in pixels (default: 400)>"
    limit="<number limit (default: 4)>"
    smallwidth="<small breakpoint (default: 768)>"
    mediumwidth="<medium breakpoint (default: 768)>"
    imagefield="<image field internal name (default: 'PublishingRollupImage')>"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    orderField="<field internal name (default: 'ID')>"
    orderDirection="<asc | desc (default: 'desc')>"
    datefilterfromtext="<string (default: 'From')>"
    datefiltertotext="<string (default: 'To')>"
    nexttext="<string (default: 'Next')>"
    prevtext="<string (default: 'Previous')>"
    datefromfield="<start date field internal name (default: 'ArticleStartDate')>"
    datetofield="<optional end date field internal name (default: '')>"
    dir="<rtl | ltr (default: ltr)>">
    <slot></slot>
</sp-cards>
```

#### Example

```html
<sp-cards
    siteurl="https://our-sharepoint-site"
    weburl="ar/news"
    list="DA1A89B9-51EB-40C8-ABCB-E7BA05C4FFFC"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    datefilterfromtext="From date"
    datefiltertotext="To date"
    nexttext="Next page"
    prevtext="Previous page"
    dir="rtl">
    <h2>
        News
    </h2>
</sp-cards>
```

### Map
A full width locations map with pin markers, requires a custom list with the following fields: (Title:String, Lat:Number, Long:Number).

#### Usage

```html
<sp-map
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    siteurl="<site collection url (default: '/')>"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    lat="<center latitude *required>"
    long="<center longitude *required>"
    zoom="<zoom factor (default: 12)>"
    height="<map height in pixels (default: 400)>"
    >
</sp-map>
```

#### Example

```html
<sp-map
    siteurl="http://sp2013.sp2013gm"
    weburl="en"
    list="26522569-F3AC-45E7-BD47-59B680731D15"
    lat="24.43"
    long="54.41"
    height="350">
</sp-map>
```

### Accordion
A full width vertical accordion, requires a custom list with the following fields: (Title:String, Content:String|RichText).

#### Usage

```html
<sp-accordion
    weburl="<web url relative to site collection *required>"
    list="<list ID *required>"
    siteurl="<site collection url (default: '/')>"
    filter="<SharePoint REST Api filter (default: 'ID gt 0')> see https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests"
    height="<accordion item content height in pixels (default: 150)>"
    orderField="<field internal name (default: 'ID')>"
    orderDirection="<asc | desc (default: 'desc')>"
    dir="<rtl | ltr (default: ltr)>">
</sp-accordion>
```

#### Example

```html
<sp-accordion
    siteurl="http://sp2013.sp2013gm"
    weburl="en"
    list="9B1891B3-FE78-40F5-94F9-0E65570F6C87"
    dir="rtl">
</sp-accordion>
```


## Customize

Clone or download this repository

Install the dependencies...

```bash
cd sharepoint-web-components
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

### Updating a component

Edit a component file in `src/components`, save it, and reload the page to see your changes.

### Adding new component

In `src/components` create new svelte component file `coolComponent.svelte`:
```html
<svelte:options tag="sp-cool-component"></svelte:options>

<script lang="ts">
export let name:string = 'My Name'
</script>

<h1>{`hello ${name} from cool component`}</h1>

<style>
    h1 {
        color: #f0f
    }
</style>
```

Import your component in `src/main.ts`

```typescript
.
.
.

//Add
import CoolComponent from './components/coolComponent.svelte'

export default [
    //Add
    CoolComponent //Export it to be compiled
    .
    .
    .
];
```

Then use it in your pages:

```html
<sp-cool-component name="World"></sp-cool-component>
```

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```