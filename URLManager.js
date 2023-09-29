const path = require("path")
function URLManager() {
}

URLManager.getFullUrl = function (parentUrl, url)
{
    if (parentUrl[parentUrl.length - 1] == "/")
    {
        parentUrl = parentUrl.slice(0, -1)
        console.log(parentUrl)
    }
    if(url[0] == '.' )
    {
        url = url.replace('.', "")
    }
    if(url[0] != '/' && url[0] != 'h')
    {
        url = url.replace('', "/")
    } 
    url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0 ? newURL = url : newURL = `${parentUrl}${url}`
    
    const parts = newURL.split('?');
    return parts[0]
}
URLManager.isWebpage = function (url){
    return path.extname(url) == "" || path.extname(url) == ".app"
}

//exporto URLManager
module.exports={
  URLManager
}
