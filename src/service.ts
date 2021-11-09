export default {
    extractImageUrl: (siteurl:string, htmlImgTag:string) => {
        var imageUrl = htmlImgTag.substring(htmlImgTag.indexOf('src="') + 5, htmlImgTag.indexOf('" style'))
        return `${siteurl}${imageUrl}`;
    },
    headers: {
        'Accept': 'application/json;odata=verbose',
    }
}