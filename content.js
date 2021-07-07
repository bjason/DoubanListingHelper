// console.log('content script starts');

// ====== Utilities ======

let getCurrentPage=()=>{
    let match=window.location.href.match(/([\w]+)\.com/);
    let site=match && match[1];
    let page;

    switch(site){
        case 'douban':
            let nBasic=document.getElementsByClassName('basic').length;
            if (nBasic==2) page='douban-1';
            else if (nBasic>2) page='douban-2';
            else page='douban-3';
            break;
        case 'bandcamp':
        case 'discogs':
        case 'soundcloud':
        case 'apple':
            page=site;
            break;
    }
    return page
}

class Listing {
    static keys=null
    
    constructor(data=null){
        this.data={};
        for (let key in this.keys) this.data[key]=null;
        if (data){
            for (let key in data){
                this.set(key, data[key]);
            }
        }
    }

    get(key){return this.data[key]}

    set(key, value){
        if (key=="date"){
            this.data[key]=this.formatDate(dataStr);
        } else {
            this.data[key]=value
        }
    }


    formatDate(dateStr) {
        // supported format: yyyy年mm月dd日; yyyy/mm/dd; mm/dd/yyyy; month/dd/yyyy; dd/month/yyyy; yyyy; month/yyyy; mm/yyyy； 
        try{
            let spl=dateStr.split(/ ?[, 年月日] ?/).filter(n=>n);
            const monthNameMap={"jan":"01","feb":"02","mar":"03","apr":"04","may":"05","jun":"06","jul":"07","aug":"08","sep":"09","oct":"10","nov":"11","dec":"12","january":"01","february":"02","march":"03","april":"04","may":"05","june":"06","july":"07","august":"08","september":"09","october":"10","november":"11","december":"12"}
            let month="01", day="01", year='null';
            if (spl.length==1){
                year=dateStr;
            } else if (spl.length==2){
                month=spl[0];
                year=spl[1];
            } else if (spl.length>=3){
                if (spl[0].match(/\d\d\d\d/)){
                    year=spl[0],month=spl[1],day=spl[2];
                } else {
                    year=spl[2];
                    month=spl[0];
                    day=spl[1]
                    if (monthNameMap[String(day).toLowerCase()]){
                        month=spl[1];
                        day=spl[0];
                    }
                }
            } else {return null;}
            
            month=month.padStart(2,'0').toLowerCase();
            if (monthNameMap[month]) month=monthNameMap[month];
            day=day.padStart(2,'0')
            return `${year}-${month}-${day}`;
        } catch(err){
            return null
        }
    }

}

class MusicListing extends Listing{
    static keys=['album', 'artist1','artist2','artist3','genre']
}

class MovieListing extends Listing{


}



class GameListing extends Listing {


}

class BookListing extends Listing {

}



const localStorageId='DoubanListingMetadata'

// ====== Douban ====== 

class DoubanPage {
    
    constructor(){

    }
    getElements(){
        throw "Not Implemented"
    }  

    fill(listing) {
        let elements=this.getElements()
        for (let key in elements){
            try{
                let value=listing.get(value)
                if (value)
                    this.fillElement(elements[key][2],elements[key][0], elements[key][1],value)
            } catch(err){
                console.log("Can't fill "+key); 
            }
        }

    }

    fillElement(element, elementType, elementParas,value){    
        // fill value to the web element
        switch (elementType){
            case 'text': // small textbox
            case 'textLarge': // large textbox
            case 'date': // date
                element.value=value;
                break;
            case 'dropdown': // dropdown 
                try{
                    fillDropdown(element, value, elementParas);
                } catch {err} {
                    throw "Illegal dropdown parameter!";
                }
                
        }
    } 

    fillDropdown(dropdown, value, keys){
        let i=0;
        for (key in keys){
            if (value==key) break;
            i+=1
        }
        // console.log(i);
        if (i<length(keys)) {
            dropdown.getElementsByClassName('options')[0].getElementsByClassName('sub')[i].click();
        }
    }

}

class DoubanMusicPage1 extends DoubanPage {

    getElements(){
        let elements={}
        elements['album']=['text',null,document.getElementById('p_title')]
        elements['barcode']=['text',null,document.getElementById('uid')]
        return elements
    }

    click(listing){
        let button;
        if (listing.get('barcode')){
            // console.log('have barcode');
            button=document.getElementsByClassName('submit')[0];
        } else{
            button=document.getElementsByClassName('btn-link')[0];
        }
        button.click(); 
    }
}


class DoubanMusicPage2 extends DoubanPage {

    getElements(){
        let elements={}
        elements['album']=['text',null,document.getElementsByClassName('item basic')[0].getElementsByClassName('input_basic modified')]
        elements['date']=['date',null,document.getElementsByClassName('item basic')[1].getElementsByClassName('datepicker input_basic hasDatepicker')[0]]
        elements['label']=['text',null,document.getElementsByClassName('item basic')[2].getElementsByClassName('input_basic')[0]]
        elements['numberOfDiscs']=['text',null,document.getElementsByClassName('item basic')[3].getElementsByClassName('input_basic')[0]]
        elements['isrc']=['text',null,document.getElementsByClassName('item basic')[4].getElementsByClassName('input_basic')[0]]
        elements['albumAltName']=['text',null,document.getElementsByClassName('item list')[0].getElementsByClassName('input_basic')[0]]
        elements['artist0']=['text',null,document.getElementsByClassName('item list musicians')[0].getElementsByClassName('input_basic')[0]];
        elements['artist1']=['text',null,document.getElementsByClassName('item list musicians')[0].getElementsByClassName('input_basic')[1]];
        elements['artist2']=['text',null,document.getElementsByClassName('item list musicians')[0].getElementsByClassName('input_basic')[2]];
        elements['genre']=['dropdown',this.dropdownKeys['genre'],document.getElementsByClassName('dropdown')[0]];
        elements['releaseType']=['dropdown',this.dropdownKeys['releaseType'],document.getElementsByClassName('dropdown')[1]];
        elements['media']=['dropdown',this.dropdownKeys['media'],document.getElementsByClassName('dropdown')[2]];
        elements['tracks']=['textLarge',null,document.getElementsByClassName('item text section')[0].getElementsByClassName('textarea_basic')[0]]
        elements['description']=['textLarge',null,document.getElementsByClassName('item text section')[1].getElementsByClassName('textarea_basic')[0]]

        return elements
    }
    
    dropdownKeys={
        'genre':['Blues','Classical','EasyListening','Electronic','Folk','FunkSoulRnB','Jazz','Latin','Pop','Rap','Reggae' ,'Rock','Soundtrack','World'],
        'releaseType':['Album', 'Compilation','EP', 'Single','Bootleg', 'Video'],
        'media':['CD','Digital','Cassette','Vinyl']
    }

    click(listing){
        throw "NotImplemented"
    }    
}

class DoubanMusicPage3 extends DoubanPage { // TODO: auto-select image
    constructor(){
        throw "NotImplemented"
    }
} 



// ====== Bancamp/discogs/soundcloud/apple ======

let createButton = (currentPage)=>{
    var button=document.createElement("Button");
    button.innerHTML ="Collect";
    button.style = "top:0;left:0;position:absolute;z-index:9999";
    button.onclick=function(){
        let meta=collectMeta(currentPage);
        browser.runtime.sendMessage({page:currentPage,meta: JSON.stringify(meta)});
        window.open("https://music.douban.com/new_subject");
    };
    document.body.appendChild(button);
}


class SourcePage {
    keys=null
    pageType=null
    listing=null

    constructor(){
        switch (this.pageType){
            case 'music':
                this.listing=new MusicListing();
                break;
            case 'movie':
                this.listing=new MovieListing();
                break;
            case ''
        }
    }

    collect(){

        for (let key in keys){

        }
    }

    collectItem(key){

    }



}

class MusicPage extends SourcePage {
    keys=MusicListing.keys
    collect(){
        let listing=new MusicListing
        for (let key in keys){

        }
    }
}

class MoviePage extends SourcePage{
    keys=MoviePage.keys
}

class GamePage extends SourcePage{
    keys=GameListing.keys
}

class BookPage extends SourcePage{
    keys=BookListing.keys
}

class Bandcamp extends SourcePage {

}

class 



let collectMeta=(currentPage) => {
    switch (currentPage){
        case "bandcamp":
            return collectBandcampMeta();
        case "discogs":
            return collectDiscogsMeta();
        case "soundcloud":
           return collectSoundcloudMeta();
        case "apple":
            return collectAppleMeta();
        default:
            return null
    }
}

let collectBandcampMeta=() =>{
    out= {
        'url'           : document.URL,
        'album'         : document.getElementById('name-section').children[0].textContent.trim(),
        'barcode'       : null,
        'albumAltName'  : null,
        'artists'       : [document.getElementById('name-section').children[1].getElementsByTagName('span')[0].textContent.trim()],
        'genre'         : 'Electronic',
        'releaseType'   : 'Album', // Not labeled on Bandcamp
        'media'         : 'Digital', // Not labeled on Bandcamp
        'date'          : document.getElementsByClassName("tralbumData tralbum-credits")[0].textContent.trim().split('\n')[0].replace('released ',''),
        'label'         : "Self-Released", // Bandcamp doesn't have a generic way for label
        'numberOfDiscs' : "1",
        'isrc'          : null,
        'tracks'        : Array.from(document.getElementById('track_table').children[0].getElementsByClassName("track_row_view")).map((ele) =>{
                            return ele.textContent.replaceAll(/[\n\t ]+/g,' ').replace(/ *buy track */,'').replace(/ *lyrics */,'').replace(/ *video */,'').trim()
                        }).join('\n').trim(), 
        'description'   : document.URL,
        'imgUrl'        : document.getElementById('tralbumArt').children[0].href
    }
    out['date']=formatDate(out['date']);
    try{
        out['description']+="\n\n"+document.getElementsByClassName("tralbumData tralbum-about")[0].textContent.trim()
    } catch (err){}
    return out;
}

let collectDiscogsMeta=()=>{ // TODO
    out={}
    let keys=['url' ,'album','barcode','albumAltName' ,'artists','genre','releaseType'  ,'media','date','label','numberOfDiscs','isrc','tracks','description'  ,'imgUrl' ]
    for (const key of keys) out[key]=null;

    let profileBlock=document.getElementsByClassName('profile')[0]
    out['url']= document.URL
    out['album']= profileBlock.children[0].children[1].textContent.trim()
    out['artists']=Array.from(profileBlock.children[0].children[0].children).map((ele)=>{return ele.title.trim()})
    out['media']='Vinyl'; // default
    out['label']='Self-Released'; //default
    const keyRenameMap={'Genre': 'genre', 'Year': 'date', "Format":"media","Released":'date', 'Label': 'label'};
    const valueRenameMap={'Hip Hop':'Rap'}
    for (let i=1;i<profileBlock.children.length-1;i+=2){ //This handles genre, media, date, label
        try{
            let key=profileBlock.children[i].textContent.replace(":","").trim();
            let value=profileBlock.children[i+1].children[0].textContent.trim(); // TODO: multiple genres, multiple labels, etc; empty entry
            key=keyRenameMap[key]
            if (key){
                if (valueRenameMap[value]) value=valueRenameMap[value];
                out[key]=value;
            }
        } catch (err){}
    }
    if (out['date']) out['date']=formatDate(out['date']);
    out['releaseType']='Album';
    out['numberOfDiscs']=1;
    // tracks

    let tracks=document.getElementById('tracklist').getElementsByTagName('tbody')[0]
    let trackText="";
    for (let i=0;i< tracks.children.length;i++){
        let track=tracks.children[i]
        let trackPos=(i+1).toString();
        let es=track.getElementsByClassName("tracklist_track_pos")
        if (es.length>0) trackPos=es[0].textContent.trim();
        let trackTitle=''
        es=track.getElementsByClassName("tracklist_track_title")
        if (es.length>0) trackTitle=es[0].textContent.trim();
        let trackDur=''
        es=track.getElementsByClassName("tracklist_track_duration")
        if (es.length>0) trackDur=es[0].textContent.trim();
        trackText+=`${trackPos} - ${trackTitle} ${trackDur}\n`
    }
    out['tracks']=trackText;

    out['description']=out['url']
    let noteBlock=document.getElementById('notes');
    if (noteBlock) out['description']+='\n\n'+noteBlock.children[1].textContent.trim();

    out['imgUrl']=JSON.parse(document.getElementById('page_content').getElementsByClassName("image_gallery")[0].attributes['data-images'].nodeValue)[0]['full'];

    return out;
}


let collectSoundcloudMeta=()=>{ // TODO
    return null
}

let collectAppleMeta=()=>{ // TODO
    out={}
    let keys=['url' ,'album','barcode','albumAltName' ,'artists','genre','releaseType'  ,'media','date','label','numberOfDiscs','isrc','tracks','description'  ,'imgUrl' ]
    for (const key of keys) out[key]=null;

    out['url']= document.URL;
    out['album']=document.getElementsByClassName('album-header-metadata')[0].children[0].textContent.trim();
    out['barcode']=null;
    out['artists']=[document.getElementsByClassName('album-header-metadata')[0].children[1].textContent.trim()];
    let genre=document.getElementsByClassName('album-header-metadata')[0].children[2].textContent.trim().split("·")[0].trim();
    const genreNameMap={'Dance':'Electronic','Hip-Hop':'Rap','HipHop':'Rap','Alternative':'Rock', "Hip-Hop/Rap":'Rap'};
    if (genre && genreNameMap[genre]) out['genre']=genreNameMap[genre];
    out['releaseType']='Album'; // TODO
    out['media']='Digital';
    out['date']=document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-released-container')[0].textContent.replace("RELEASED",'').trim() // TODO:convert
    out['date']=formatDate(out['date']);
    try{
        out['label']=document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-copyright')[0].textContent.replace(/℗ \d+ /,'');
    } catch (err){}
    out['numberOfDiscs']="1";

    // tracks
    let tracksText="";
    let songs=document.getElementsByClassName("songs-list")[0].getElementsByClassName('song-name');
    for (i=0;i<songs.length;i++){
        tracksText+=`${i+1}. ${songs[i].textContent.trim()}\n`;
    } 
    out['tracks']=tracksText

    out['description']=out['url']
    try{
        out['description']='\n\n'+document.getElementsByClassName('product-page-header')[0].getElementsByClassName('truncated-content-container')[0].textContent.replace(/Editors’ Notes/,'').trim()
    } catch(err){}

    try{
        let _arr=document.getElementsByClassName('product-info')[0].getElementsByTagName('source')[1].srcset.split(" ");
        out['imgUrl']=_arr[_arr.length-2];
    } catch(err){}
    return out;
}


// ====== Testing ======

let _metaTest={
    'album'         :'album'         ,
    'barcode'       : null           , //"727361514624"
    'albumAltName'  :'albumAltName'  ,
    'artists'       :['artist']       ,
    'genre'         :'genre'         ,
    'releaseType'   :'releaseType'   ,
    'media'         :'media'         ,
    'date'          :'date'          ,
    'label'         :'label'         ,
    'numOfDiscs'    :'numOfDiscs'    ,
    'isrc'          :'isrc'          ,
    'tracks'        :'tracks'        ,
    'description'   :'description'   
}

// console.log("Testing plugin");
// console.log(getCurrentPage());


// ====== Main ======

//let meta=_metaTest;
let currentPage=getCurrentPage();

// Default action: add buttons to bandcamp/discogs/soundcloud/apple pages
switch(currentPage){
    case 'bandcamp':
    case 'discogs':
    case 'apple':
    // case 'soundcloud':
        createButton(currentPage);
    case 'douban-1':
    case 'douban-2':
    case 'douban-3':
        browser.runtime.sendMessage({page:currentPage});
        break;
}

// listens to background script message
// only get message on douban-1 opened by the bandcamp button
browser.runtime.onMessage.addListener(message => {
    console.log("Message from the background script:");
    if (message.meta){
        let metaBackground=JSON.parse(message.meta)
        if(currentPage=='douban-1'){
            fillDouban1(metaBackground,click=true);
            localStorage.setItem(localStorageId, JSON.stringify(metaBackground));
        }
    }

});

// autofill douban-2 if meta is stored to localStorage
let metaStored=localStorage.getItem(localStorageId)
if (metaStored){
    metaStored=JSON.parse(metaStored);
    if (currentPage=='douban-2'){
        fillDouban2(metaStored,click=false);
    }
    localStorage.removeItem(localStorageId);
}

console.log('content script ends');


// TODO
// https://www.discogs.com/Various-Sweet-House-Chicago/master/79323
// https://adaptedrecords.bandcamp.com/album/freedom
// https://music.apple.com/cn/album/%E6%90%96%E6%BB%BE86/1391495014 (date)
// get track duration on apple music
// https://www.discogs.com/Greekboy-Shaolin-Technics/release/11434711 (format)
// https://music.apple.com/us/album/the-palmwine-express/1491006159 (url)
// https://www.discogs.com/Various-Starship-The-De-Lite-Superstars/release/569725 (genre name map)
// https://www.discogs.com/Richard-Groove-Holmes-Soul-Power/release/2997598 (artist)
// [FIXED] bc track list sometimes has extra space (https://lbrecordings.bandcamp.com/album/l-b020-hyperromantic-isle-of-dead-ep)
// Master page on discogs grab label from the first release. 
// Recognize digital on discog from format like this https://www.discogs.com/DJ-Trax-Find-A-Way-EP/release/16466505 
// Recognize artist/duration on apple music like this https://music.apple.com/us/album/lo-fi-house-zip/1490994043
// Auto recognize EP in album title: https://how2make.bandcamp.com/album/vortex-ep
// Recognize label on bandcamp from side column (if label==artist then use self-released)
// Recognize "12''" on discogs https://www.discogs.com/Wax-Doctor-Cruise-Control-EP/release/90227 
// guess a release is EP/album by track count/track list numbering
// Multiple artists on bandcamp? 
// Add tags onto bandcamp description