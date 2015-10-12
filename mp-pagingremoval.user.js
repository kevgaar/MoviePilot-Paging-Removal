// ==UserScript==
// @name        MoviePilot Paging-Removal
// @namespace   http://www.moviepilot.de/news/*
// @include     http://www.moviepilot.de/news/*
// @exclude     http://www.moviepilot.de/news/*/seite*
// @version     0.1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var baseReq = '';
var reqIter = 1;

var pageCheck = document.getElementsByClassName('pagination--article');
if(pageCheck.length > 0) {
  
  baseReq = window.location.href;
  if(baseReq.search(/#/) > 0) {  //catch hash
    baseReq = baseReq.split('#')[0];
    window.location.href = baseReq;
  } else {  //do execute only if theres no hash existing
    var startReq = baseReq;
    fixMPLayout();
    sendRequest(startReq, handleMPResponse);
    reqIter++;
  }
}

function fixMPLayout() {  
  
  //Remove Pagination
  var pageNavigators = document.getElementsByClassName('is-hide-first is-hide-last');
  if(pageNavigators.length > 0) {
    pageNavigators[0].remove();
  }
  
  var imageNavigation = document.getElementsByClassName('gallery--image-navigation');
  if(imageNavigation.length > 0) {
    imageNavigation[0].remove();
  }
  
  var pagination = document.getElementsByClassName('pagination--article');
  if(pagination.length > 0) {
    for(var i = pagination.length -1; i >= 0 ; i--) {
      pagination[i].remove();
    }
  }
  
  var content = document.getElementsByClassName('article--content-body');
  if(content.length > 0) {
    content[0].innerHTML = '';
  }
  
  //Add Table of Content
  var toc = document.createElement('div');
  toc.id = 'toc';
  var h2 = document.createElement('h2');
  h2.innerHTML = 'Inhaltsverzeichnis';
  toc.appendChild(h2);
  var anchorPoint = document.getElementsByClassName('advertisement--medium-rectangle is-left-sidebar')[0];
  anchorPoint.insertBefore(toc, anchorPoint.firstChild);
}

function addContent(htmlContent) {
  var contentAnker = document.getElementsByClassName('article--content-body');
  var contentDiv = document.createElement('div');
  contentDiv.id = 'req'+reqIter;
  contentDiv.innerHTML = htmlContent;
  contentAnker[0].appendChild(contentDiv);
}

function handleMPResponse(request, response) {
  // Auswerten des Response von MP
  var mpHTML = refineHTML(response.responseText);
  var content = '';
  
  // "Naechste Seite"-Button vorhanden, wenn nein naechsten Request absetzen
  var paginationCheck = mpHTML.search('button is-primary is-next');
  if(paginationCheck >= 0) {
    var newRequest = baseReq + '/seite-' + String(reqIter);
    setTimeout(function() {sendRequest(newRequest, handleMPResponse);}, 2000);
  }
  reqIter++;
  
  
  if(reqIter > 3) { //
    var articleTitle = extractDiv(mpHTML, "<div class='js--user-information'");
    if(articleTitle != null) {
      var articleTitle = articleTitle.match(/article--header--title'>(.)*'/);
      if(articleTitle != null) {
        articleTitle = articleTitle[0].match(/>(.)*?</)[0];
        articleTitle = articleTitle.replace(/(<|>)/g, '');
        var toc = document.getElementById('toc');
        var anchor = document.createElement('a');
        anchor.innerHTML = articleTitle;
        var actIter = reqIter;
        anchor.onclick = function() {
          location.hash = '#req'+ actIter;
          window.scrollBy(0,-60);
        };
        anchor.style.float = 'left';
        toc.appendChild(anchor);
        toc.appendChild(document.createElement('br'));
        
        content = '<h3>'+articleTitle+'</h3>';
      }
    }
  }

  var pageContent = extractDiv(mpHTML, "<div class='article--content-body");
  content = content + pageContent;
  addContent(content);
}

function sendRequest(request, handler) {
  /* Absetzen eines Requests
   *
   * request      Ziel-URL mit Request
   */
  GM_xmlhttpRequest({
    method: 'GET',
    url: request,
    timeout: 5000,
    onreadystatechange: function(response) {
      if(response.readyState == 4) {
        if(response.status == 200) {
          handler(request, response);
        } else {
          alert('Error code: '+response.status);
        }
      }
    },
    ontimeout: function(response) {alert("Timeout(MP): "+request);}
  });
}

function extractDiv(html, selector) {
  /* Extrahieren eines Div Containers mit dessen Inhalt */
  var divPosition = html.search(selector);
  if(divPosition >= 0) {
    var htmlArray = html.split('');
    var i = 0;
    var divs = 0;
    do{
      if(htmlArray[divPosition+i] == '<' && htmlArray[divPosition+i+1] == 'd') {
        divs++;
      }
      if(htmlArray[divPosition+i] == '<' && htmlArray[divPosition+i+1] == '/' && htmlArray[divPosition+i+2] == 'd') {
        divs--;
      }
      i++;
    } while (divs != 0);
    return html.substring(divPosition, divPosition+i+5);
  }
  return null;
}

function refineHTML(html) {
  var encodedHTML = encodeURI(html);
  
  encodedHTML = encodedHTML.replace(/%3C/g,'<');
  encodedHTML = encodedHTML.replace(/%3E/g,'>');
  encodedHTML = encodedHTML.replace(/%22/g,'"');
  encodedHTML = encodedHTML.replace(/%20/g,' ');
  
  // Umlaute
  encodedHTML = encodedHTML.replace(/%C3%84/g,'Ä');
  encodedHTML = encodedHTML.replace(/%C3%A4/g,'ä');
  encodedHTML = encodedHTML.replace(/%C3%96/g,'Ö');
  encodedHTML = encodedHTML.replace(/%C3%B6/g,'ö');
  encodedHTML = encodedHTML.replace(/%C3%9C/g,'Ü');
  encodedHTML = encodedHTML.replace(/%C3%BC/g,'ü');
  encodedHTML = encodedHTML.replace(/%C3%9F/g,'ß');
  encodedHTML = encodedHTML.replace(/%(\d|[ABCDEF])(\d|[ABCDEF])/g,"");
  
  return encodedHTML;
}
