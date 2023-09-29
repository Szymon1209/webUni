const express = require('express');
const cheerio = require('cheerio');
const archiver = require('archiver');
const qs = require('qs');
const fs = require('fs')
//const fetch = require('node-fetch');
const { URLManager } = require('./URLManager');
const path = require('path');


const startJSON = (req, res) => {
    
    // We fetch the webpage and convert the HTML code to text
    let _url = req.query.url
    let _recLevel = req.query.recLevel
    let _maxFiles = req.query.maxFiles

    rec = function(url, recLevel)
    {
        let list = []
        return new Promise((resolve, reject) =>
        {
            let promises = []

            fetch(url) 
            .then(fetchRes => {
                return fetchRes.text() 
            })
            .then(text => 
            {
                // We parse the HTML text using cheerio
                const $ = cheerio.load(text);
                // We iterate each <a/> tag
                $('a').each((i,link)=>
                {
                    let href = $(link).attr('href');
                    if (_maxFiles > 0)
                    {
                        let name = URLManager.getFullUrl(url, href)
                        let type = URLManager.isWebpage(name) ? "webpage" : "file"
                        list.push({'name': name, 'type': type})
                        _maxFiles--
                    }
                })  
                
                if (recLevel + 1 < _recLevel)
                {   
                    list.forEach(function(link)
                    {
                        if (link.type == "webpage")
                        {   
                            promises.push(rec(link['name'], ++recLevel).then(elemList => link.elements = elemList))
                        }
                    }) 
                }

                Promise.all(promises).then(() => 
                {
                    resolve(list)
                })
            })             
        })
    }

    rec(_url, 0).then(json => 
    {
        res.json(json)
        res.end()
    })

}

const startZIP = (req, res) => {
    // We fetch the webpage and convert the HTML code to text
    let _url = req.query.url    
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(res); //crea una tuberia entre la resposta i el zip, només un cop, no per cada arxiu

    res.on('close', function(){
        console.log(archive.pointer() + ' total compressed bytes');
        res.end()
    })
    
    fetch(_url) 
    .then(fetchRes => {
        return fetchRes.text() 
    })
    .then(text => {
            // We parse the HTML text using cheerio
            const $ = cheerio.load(text);
            let counter = 0;
            $('a').each(function() {
                // We process the <a/> tag
                let fullURL = URLManager.getFullUrl(_url, $(this).attr('href'))
                if (!URLManager.isWebpage(fullURL))  
                {                    
                    const fileName = path.basename(fullURL);
                    counter++;
                    console.log("NOM: " + fileName)
                    /*let promise = */fetch(fullURL)
                    .then(result => result.arrayBuffer())
                    .then(arrayBuffer => {
                        // We convert the array buffer to a Buffer object
                        const buffer = Buffer.from(arrayBuffer);                 
                        // We put append the buffer into the zip
                        // Here goes appending the StringBuffer: Buffer.from(buffer) in the zip. 
                        archive.append(buffer, { name: fileName });
                        //list.push(promise)
                        console.log("counter : " + counter)
                        counter--
                        if(counter == 0)
                        {
                            archive.finalize()
                        }
                    })
                }

            })            
        })
}        

const app = express();
const port = 3000;

app.get('/json', function(req, res){
   
    startJSON(req, res);
});

app.get('/zip', function(req, res){
    res.writeHead(200 , {  
        'Content-Type' : 'application/zip',
        'Content-Disposition' : 'attachment; filename = Szymoooooon.zip'
    })
    startZIP(req, res);
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));