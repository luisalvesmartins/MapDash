var Translation={
    TAGLOC:"data-localize",
    currentLanguage:null,
    //Scraps the HTML and popsup a new window with the existing configuration
    createNewFile:function(){
        var C=document.querySelectorAll("[" + this.TAGLOC + "]");
        var trFile={};
        for(let c=0;c<C.length;c++)
        {
            trFile[C[c].getAttribute(this.TAGLOC)]=C[c].innerHTML;
        }
        var tr=trFile;
        var wo=window.open("about:blank","TRANSLATE");
        wo.document.write("<pre>" +JSON.stringify(tr) +"</pre>")
    },
    //Test function, transforms the interface to show all changed tags
    testScrapping:function(language){
        var T=translation.find(t=>t.language==language).tokens;
        var C=document.querySelectorAll("[" + this.TAGLOC + "]");
        for(let c=0;c<C.length;c++)
        {
            var translated=T[C[c].getAttribute(this.TAGLOC)];
            C[c].innerHTML=translated.split("").reverse("").join("");
        }
    },
    //Localize the current page in the supplied language
    localizePage:async function(options){
        var language=options.language;
        if (Translation.currentLanguage!=language){
            Translation.currentLanguage=language;
            var file=options.path + "." + language + ".json";
            Translation.dictionary=JSON.parse(await this._makeRequest("GET",file));
        }
        var C=document.querySelectorAll("[" + Translation.TAGLOC + "]");
        for(let c=0;c<C.length;c++)
        {
            var translated=Translation.dictionary[C[c].getAttribute(Translation.TAGLOC)];
            C[c].innerHTML=translated;
        }
    },
    _makeRequest(method, url) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    },
    localize:async function(text,options){
        //console.log(Translation.dictionary);
        if (typeof text=="string")
        {
            if (options==null){
                options={language:Translation.currentLanguage};
            }
            if (Translation.currentLanguage!=options.language){
                Translation.currentLanguage=options.language;
                var file=options.path + "." + options.language + ".json";
                Translation.dictionary=JSON.parse(await this._makeRequest("GET",file));
            }
            return Translation.dictionary[text];
        }
        else
        {
            await Translation.localizePage(text);            
        }
    }
}
