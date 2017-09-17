/* 
vulog_historian for info.freezr.vulog

Example of initialisation for pop up
var vulog = new jlos('vulog', {'valueAtInit':vulogValueAtInit}); 
var pop_historian = new vulog_historian ({ // used with vulog_historian
        page_type: "local", // can be "local" or "online" - "local" gets results from exising jloss file - online gets results from freezr

        max_items_fetch:50,
        historyResultsDivId: "vulog_history_records",
        marksResultsDivId: "vulog_marks_records",
        endOfHistoryDivId: "end_of_marksof_history",
        noHistoryItem: "no_history_warning",
        noHistoryAtAllItem: "no_history_atall_warning",
        endOfMarksDivId: "end_of_marks",
        clearSearchDivId: "click_clearsearch",
        clearFiltersDivId: "click_clearfilters",
        moreHistoryDivId: "click_search_history_more",
        moreMarksDivId: "click_search_marks_more",
        idSearchHistoryBox: "idSearchHistoryBox",
        idSearchMarksBox: "idSearchMarksBox",

        today_word: "Today",

        localSearch: backgroundLocalSearch,

        showWarning: showWarning,

    }, vulog.data.logs, vulog.data.userMarks)

*/
var starList = ["fa-bookmark", "fa-star","fa-thumb-tack", "fa-inbox", "fa-bullhorn"]

function vulog_historian(options, logs, userMarks) {
  this.initialize(options, logs, userMarks);
}
vulog_historian.prototype.initialize = function (options, logs, userMarks) {
    this.divs = options? options:{};
    this.groupings = {};
    this.last_words_searched= "";
    this.star_filters =[];
    this.today_string = new Date().toDateString();
    this.oldest_record =new Date().getTime();
    this.itemsfetched = 0;

    this.historyGrouping =  "domain_app"; // alternatives are "purl" and "domain_app"

    this.removals = {
        inprogress:false,
        history_items: []
    }
    
    this.editmode =  false;
};
vulog_historian.prototype.showEndOfHistory = function (what){
    var elToshow = document.getElementById(what=="history"? this.divs.endOfHistoryDivId:this.divs.endOfMarksDivId)
    if (elToshow) elToshow.style.display = "block";
    var elToHide = document.getElementById(what=="history"? this.divs.moreHistoryDivId:this.divs.moreMarksDivId  )
    if (elToHide) {elToHide.style = "display:none";}
    function isEmpty(obj) {
        //stackoverflow.com/questions/4994201/is-object-empty
        if (obj == null) return true;
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;
        if (typeof obj !== "object") return true;
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    }
    if (isEmpty(this.groupings) && what=="history") {
        if (elToshow) elToshow.style.display = "none";
        var elToshow = document.getElementById(this.divs.noHistoryItem);
        if (elToshow) elToshow.style.display = "block";
        if (this.last_words_searched==  "") {
            var elToshow = document.getElementById(this.divs.noHistoryAtAllItem);
            if (elToshow) elToshow.style.display = "block";
        }
    }
}
vulog_historian.prototype.showHistoryItems = function(what, returndata) {
    //onsole.log("showHistoryItems "+returndata.results.length);
    if (returndata.err) {
        var el = document.createElement('div');
        el.innerHTML= "<br/>"+JSON.stringify(d.err);
        document.getElementById(self.divs.historyResultsDivId).appendChild(el);
    } else if (!returndata || !returndata.results || returndata.results.length==0){
        this.showEndOfHistory(what);
    } else {
        var theItems = returndata.results
        this.itemsfetched += theItems.length;
        var date_string, el, log, timeArray, elToAppend;

        var elToShow = document.getElementById(what=="history"? this.divs.moreHistoryDivId:this.divs.moreMarksDivId  )
        if (elToShow) elToShow.style.display = "block";
        
        if (returndata.results.length < this.divs.max_items_fetch) this.showEndOfHistory(what);
        
        var self=this;
        if (what=="history") {
            theItems.forEach(function (log) {
                //onsole.log({log});
                if (!log || !log.vulog_timestamp || !log.url) {
                    console.log("Got erred item "+JSON.stringify(log)+" ");
                } else {
                    // todo - if groupings is domainapp, this needs bug fixing
                    date_string = vulog_textOps.get_date_string(log.vulog_timestamp);
                    if (log._date_Modified < self.oldest_record) self.oldest_record = log._date_Modified;

                    grIndex = vulog_textOps.jsonifyUrl(log[self.historyGrouping]? log[self.historyGrouping]:log.purl);
                    
                    if (!(self.groupings[grIndex]) && !document.getElementById("date_"+date_string.replace(/ /g,'_')) ) {
                        el = document.createElement('div');
                        el.id = "date_"+date_string.replace(/ /g,'_');
                        el.className = "vulog_logitem";
                        el.innerHTML = " &nbsp; <span class='vulog_date'> "+date_string+"</span>";
                        elToAppend = document.getElementById(self.divs.historyResultsDivId)
                        if (elToAppend) elToAppend.appendChild(el)
                    }
                    
                    if (self.groupings[grIndex]) {
                        self.groupings[grIndex].vulog_visits+=(log.vulog_visits?log.vulog_visits:1);
                        self.groupings[grIndex].vulog_ttl_time +=  log.vulog_ttl_time;
                        self.groupings[grIndex].vulog_visit_details.push({'time':log.vulog_ttl_time, 'date':log.vulog_timestamp, 'visits':log.vulog_visits, '_id':log._id, 'mod':log.fj_modified_locally});
                        self.groupings[grIndex].vulog_ids.push(log._id)
                        el = document.getElementById("click_meta_}{_"+grIndex);
                        if (el) el.innerHTML = vulog_textOps.meta_desc(self.groupings[grIndex]);
                        if (!el) console.log("Error getting div for updating stats of "+grIndex);
                        el = document.getElementById("click_meta_details}{_"+grIndex);
                        if (el) el.innerHTML = vulog_textOps.details_desc(self.groupings[grIndex],{editmode:self.editmode});
                        if (!el) console.log("Error getting div for updating details of "+grIndex);

                    } else {
                        self.groupings[grIndex] = log;
                        self.groupings[grIndex].visits = self.groupings[grIndex].vulog_visits? self.groupings[grIndex].vulog_visits:1;
                        self.groupings[grIndex].vulog_visit_details =[{'time':log.vulog_ttl_time, 'date':log.vulog_timestamp, 'visits':log.vulog_visits,'_id':log._id, 'mod':log.fj_modified_locally}];
                        self.groupings[grIndex].vulog_ttl_time = log.vulog_ttl_time;
                        self.groupings[grIndex].vulog_ids = [log._id]
                        el = document.createElement('div');
                        el.id = "log}{"+grIndex;
                        el.className = "vulog_logitem";
                        el.innerHTML = vulog_textOps.all_log_div_do(log, grIndex, {editmode:self.editmode});

                        elToAppend = document.getElementById(self.divs.historyResultsDivId)
                        if (elToAppend) elToAppend.appendChild(el);

                    }
               }
            });

            var self=this;
            setTimeout(function () {
                var favicoEl, aUrl, domain, resetfavico;
                theItems.forEach(function (log) {
                    if (log && log.vulog_timestamp && log.purl) {
                        aUrl = vulog_textOps.jsonifyUrl(log.purl);
                        favicoEl = document.getElementById("favico}{"+log._id);
                        domain=vulog_textOps.getdomain(log.purl);
                        if (favicoEl) {
                            favicoEl.src = domain + "/favicon.ico";  
                            var isOnline = (self.divs.page_type=="online")
                            favicoEl.onerror = function() {
                                //onsole.log("couldnt get favicon for "+domain)
                                this.onerror = null;
                                this.src= (isOnline)? '/app_files/info.freezr.vulog/static/favicon_www.png':'favicon_www.png';
                            }
                        } 
                    } 
                });
            }, 120);


        } else if (what=="marks") {
            
            for (var i=0; i<theItems.length;i++){
                var log = theItems[i];
                if (log  && !log.purl) {log.purl=log.url} // legacy
                if (!log  || !log.purl) {
                    console.log("Got ERRED item ");
                } else if ( log.fj_deleted){
                    //onsole.log("deleted item - will not be shown "+log._id)
                } else {
                    var num = self.itemsfetched +i;
                    if (!log.vulog_timestamp) log.vulog_timestamp = log._date_Modified; // temp error fix
                    aUrl = vulog_textOps.jsonifyUrl(log.purl);
                    if (log._date_Modified < self.oldest_record) self.oldest_record = log._date_Modified;

                    el = document.createElement('div');
                    el.id = "log}{"+log._id;
                    el.className = "vulog_logitem";
                    el.innerHTML = vulog_textOps.all_mark_div_do(aUrl, log, self.divs.page_type, num);

                    elToAppend = document.getElementById(self.divs.marksResultsDivId)
                    if (elToAppend) elToAppend.appendChild(el);
                }

            }

            var self=this;
            setTimeout(function () {
                var favicoEl, aUrl, domain, resetfavico;
                for (var i=0; i<theItems.length; i++){
                    var log = theItems[i];
                    if (log && log.vulog_timestamp && log.url) {
                        favicoEl = document.getElementById("favico}{"+log._id);
                        domain=vulog_textOps.getdomain(log.url);
                        if (favicoEl) {
                            favicoEl.src = domain + "/favicon.ico";  
                            var isOnline = (self.divs.page_type=="online")
                            favicoEl.onerror = function() {
                                this.onerror = null;
                                this.src= (isOnline)? '/app_files/info.freezr.vulog/static/favicon_www.png':'favicon_www.png';
                            }
                        } 
                    } 
                };
            }, 120);

        }
    }
}
vulog_historian.prototype.doSearch = function(what) {
    var searchBox = document.getElementById(what=="history"? this.divs.idSearchHistoryBox: this.divs.idSearchMarksBox);
    var searchTerms = (searchBox && searchBox.textContent)? vulog_textOps.removeSpaces(searchBox.textContent.toLowerCase()): "";
    var elToshow = document.getElementById(this.divs.noHistoryItem);
    if (elToshow) elToshow.style = "display:none";
    if (this.last_words_searched!=searchTerms) this.clearSearch(what);
    this.last_words_searched=searchTerms;
    this.nowVulogSearch(what, searchTerms, ((this.divs.max_items_fetch)? this.divs.max_items_fetch:20 ) ) ;
}
vulog_historian.prototype.nowVulogSearch = function (what, searchTerms, max_items) {
    var self=this;
    if (self.divs.page_type=="online"){
        var query_params = {'_date_Modified':{'$lt':self.oldest_record}  ,"url":{$exists:true} , 'fj_deleted':false}
        if (what=="marks" && self.star_filters &&  self.star_filters.length>0) {
            query_params.vulog_mark_stars = {$all:self.star_filters}
        }
        if (searchTerms) {
            var searchTermsArray = searchTerms.split(" ");
            if (searchTermsArray.length==1) {
                query_params.vulog_kword2 = searchTermsArray[0];
            } else {
                var searchArray=[];
                searchTermsArray.forEach(function(anItem) {if (anItem!=" ") searchArray.push({vulog_kword2:anItem}) });
                query_params.$and = searchArray;
            }
            //query_params._date_Modified.$lt = self.oldest_record;
        }
        //onsole.log("query params are "+JSON.stringify(query_params))
        if (what == "history" && self.divs.resetSearchDivId && document.getElementById(self.divs.resetSearchDivId)) {
            document.getElementById(self.divs.resetSearchDivId).style = "display:"+  ( (searchTerms)? "block":"none");
        } else if (what=="marks" && self.divs.resetFiltersDivId && document.getElementById(self.divs.resetFiltersDivId)){
            document.getElementById(self.divs.resetFiltersDivId).style = "display:"+  ( (searchTerms || (self.star_filters && self.star_filters.length>0))? "block":"none");
        }
        freezr.db.query(
            {'collection':(what=="history"?'logs':"userMarks"), 'count':self.divs.max_items_fetch, 'query_params':query_params  },
            function (returndata) {
            returndata = JSON.parse(returndata);
            self.showHistoryItems(what, returndata);
            }
        );

    } else  if (what=="marks" && self.divs.page_type=="public"){
        //onsole.log("public marks returned",self.divs.max_items_fetch,self.itemsfetched)
        freezr.db.publicquery(
            {'count':self.divs.max_items_fetch, 'skip': self.itemsfetched, 'app_name':'info.freezr.vulog'},
            function (returndata) {
                returndata = JSON.parse(returndata);
                self.showHistoryItems("marks", returndata);
            }
        );
    } else  { // extension
        var query_params = {
            what            : what,
            wordsToFind     : ((searchTerms && searchTerms.length>0)? searchTerms.split(" "):[]),
            itemsfetched    : self.itemsfetched,
            oldest_record   : self.oldest_record,
            max_items_fetch : self.divs.max_items_fetch,
            star_filters    : self.star_filters
        }
        if (!self.divs.localSearch) {
            console.log("ERROR - NO localSearch function defined")
        } else {
            self.divs.localSearch(query_params)
        }

    }
}

vulog_historian.prototype.clearSearch = function(what){
    this.groupings = {};
    this.oldest_record = new Date().getTime();
    this.itemsfetched = 0;
    this.last_words_searched ="";

    if (document.getElementById(this.divs.endOfHistoryDivId)) document.getElementById(this.divs.endOfHistoryDivId).style = "display:none";
    if (document.getElementById(this.divs.endOfMarksDivId)) {
        document.getElementById(this.divs.endOfMarksDivId).style = "display:none";}
    if (document.getElementById(this.divs.resetSearchDivId)) document.getElementById(this.divs.resetSearchDivId).style = "display:none";
    if (document.getElementById(this.divs.resetFiltersDivId)) document.getElementById(this.divs.resetFiltersDivId).style = "display:none";
    if (document.getElementById(this.divs.moreHistoryDivId)) document.getElementById(this.divs.moreHistoryDivId).style = "display:block";
    if (document.getElementById(this.divs.moreMarksDivId)) document.getElementById(this.divs.moreMarksDivId).style = "display:block";
    if (document.getElementById(this.divs.marksResultsDivId)) document.getElementById(this.divs.marksResultsDivId).innerHTML="";
    if (document.getElementById(this.divs.historyResultsDivId)) document.getElementById(this.divs.historyResultsDivId).innerHTML="";
}
vulog_historian.prototype.toggleview = function (aURL) {
    var theClass;
    var metaDiv = document.getElementById("click_meta_}{_"+aURL);
    var detailsDiv = document.getElementById("click_meta_details}{_"+aURL);
    if (metaDiv && detailsDiv) {
        theClass = metaDiv.className;
        if (metaDiv.className.indexOf("fa-chevron-right")>=0) {
            metaDiv.className = metaDiv.className.replace("fa-chevron-right","fa-chevron-up");
            detailsDiv.style = "display:block";
        } else {
            metaDiv.className = metaDiv.className.replace("fa-chevron-up","fa-chevron-right");
            detailsDiv.style = "display:none";
        }
    }   else {
            console.log("Error No meta or details div")
    }
}


vulog_historian.prototype.toggleEditMode  = function(what) {
    if (what=="marks"){
        var goToEdit = !this.editmode;
        var removeItemButs = document.getElementsByClassName("removeMark");
        for (i = 0; i < removeItemButs.length; i++) {
            removeItemButs[i].style.display = goToEdit?"inline-block":"none";
        }
        var starButs = document.getElementsByClassName((goToEdit?"littlestars":"stars"));
        for (i = starButs.length-1; i>=0; i--) {
            var aBut = starButs[i];
            if (aBut.id.indexOf("filter")<0){
                aBut.classList.remove(goToEdit?"littlestars":"stars");
                aBut.classList.add(goToEdit?"stars":"littlestars");
                aBut.style.display = (goToEdit || aBut.classList.contains('chosen-star'))?"inline-block":"none";
            }
        }
        var emptyHolders = document.getElementsByClassName("emptyStarHolder");
        for (i =0; i< emptyHolders.length; i++) { emptyHolders[i].style.display = (goToEdit?"block":"none")}
        var textButs; // todo - allow for editing these too
        this.editmode = goToEdit;
    } else if (what=="history") {
        var goToEdit = !this.editmode;
        var removeItemButs = document.getElementsByClassName("removeHistItem");
        for (i = 0; i < removeItemButs.length; i++) {
            removeItemButs[i].style.display = goToEdit?"inline-block":"none";
        }
        /* Todo - to add elegantly
        var removeItemButs = document.getElementsByClassName("removeMultiple");
        for (i = 0; i < removeItemButs.length; i++) {
            removeItemButs[i].style.display = goToEdit?"inline-block":"none";
        }
        */
        this.editmode = goToEdit;
    }
}

var vulog_textOps = {
    removeSpaces: function(aText) {
        aText = aText.replace(/&nbsp;/g," ").trim();
        while (aText.indexOf("  ")>-1) {
            aText = aText.replace(/  /," ");
        }
        return aText;
    },
    jsonifyUrl: function(aUrl) {
        var temp = aUrl+"";
        return temp.trim().replace(/'/g,'_').replace(/"/g,'_').replace(/ /g,"_").split("/").join("_").split("#")[0]
    },
    getdomain: function(aUrl) {
        // 8 represents "h t t p s://" - todo - make algo mroe robust
        if(!aUrl) return "Missing aUrl";
        var start = aUrl.indexOf("//")+2
        var stop = aUrl.slice(start).indexOf("/");
        return aUrl.slice(0,stop+start);
    },
    timeSpentify: function (aTime) {
        //
        return (Math.floor(aTime/60000)>0? (Math.floor(aTime/60000)+"mins" ):"" )+(Math.round((aTime%60000)/1000,0))+"s"
    },
    details_desc: function (aLog, options  ) {
        var tempret = "";
        var novisits = (options && options.novisits)
        tempret += (aLog.title?("<div >"+aLog.url+"</div>"):"");
        tempret += (aLog.author?("<div >"+aLog.author+"</div>"):"");
        tempret += aLog.description?("<div >"+aLog.description+"</div>"):"";
        tempret += (aLog.keywords && aLog.keywords.length>0)? ("<div>Key words: "+aLog.keywords.join(", ")+"</div>"):""; 
        var timeArray;
        if (!novisits && aLog.vulog_visit_details && aLog.vulog_visit_details.length>0) {
            aLog.vulog_visit_details.forEach(function(aVisit) {
                timeArray = (new Date(aVisit.date).toTimeString()).split(":");
                tempret += "<div class='visit_detail'>"+vulog_textOps.get_date_string(aVisit.date)+" "+timeArray[0]+":"+ timeArray[1]+" - "+vulog_textOps.timeSpentify(aVisit.time)+(aVisit.visits>1?(" ("+aVisit.visits+" visits)"):"")+" - "+aLog.url
                tempret+="<span class='removeHistItem'  id ='click_removeHistItem_"+(aVisit._id?("id_"+aVisit._id):("mod_"+aVisit.mod))+"' style='display:"+((options && options.editmode)?"inline-block":"none")+"' >remove from history</span>" +"</div>"
            })
        }
        //tempret += ("<div>all: "+JSON.stringify(aLog)+"</div>"); 
        return tempret;
    },
    meta_desc: function (aLog, options) {
        //
        var visit_qualifier = (options && options.visit_qualifier)? options.visit_qualifier:"visits";
        return (aLog.vulog_visits>1?(aLog.vulog_visits+" "+visit_qualifier+" - "):"")+"Viewed for "+ vulog_textOps.timeSpentify(aLog.vulog_ttl_time) + (aLog.vulog_max_scroll? " - Scrolled:"+Math.round(100*aLog.vulog_max_scroll/aLog.vuLog_height)+"% ": "")
    },
    all_log_div_do: function(aLog, grIndex,options) {
        var tempret = "";  
        var timeArray = (new Date(aLog.vulog_timestamp).toTimeString()).split(":");
        var domain=vulog_textOps.getdomain(aLog.url);
        if (!options || !options.notime) {
            tempret += "<span class='vulog_time"+(aLog._id?" ideed":"")+"'>"+timeArray[0]+":"+ timeArray[1]+"</span>"
            tempret += "<img id='favico}{"+aLog._id+"' class='vulog_favicon' />"
        }
        tempret += "<a class='vulog_title "+(aLog.title?" vulog_title_emph":"")+"' href='"+aLog.url+"' target='_blank' >"+(aLog.title? (aLog.domain_app+" - "+aLog.title): aLog.url)+"</a>"; 
        tempret+="&nbsp;&nbsp;&nbsp;&nbsp;<span class='removeMultiple'  id ='click_removeMultiple_"+(grIndex)+"' style='display:"+(false && options && options.editmode?"inline-block":"none")+"' >remove all</span>" 
        tempret += "<div class='vulog_Hdetails' id='"+"click_meta_details}{_"+grIndex+"' style='display:none'>"+vulog_textOps.details_desc(aLog, options)+"</div>";
        tempret += "<span class='fa-chevron-right vulog_meta meta_for_hist' id='"+"click_meta_}{_"+grIndex+"'> "+vulog_textOps.meta_desc(aLog, options)+"</span>";
        return tempret;
    },    
    all_mark_div_do: function(aUrl, aLog, page_type, num) {
        var tempret = "";  
        var timeArray = (new Date(aLog.vulog_timestamp).toTimeString()).split(":");
        var domain=vulog_textOps.getdomain(aLog.url);
        tempret += "<img id='favico}{"+aLog._id+"' class='vulog_favicon' />"
        tempret += "<a class='vulog_mark_title "+(aLog.title?" vulog_title_emph":"")+"' href='"+aLog.purl+"' target='_blank' >"+(aLog.title? (aLog.domain_app+" - "+aLog.title): aLog.purl)+"</a>" 
        tempret += "<div class='mark_star_holder' id='markHolder_"+(aLog._id? ("id_"+aLog._id): ("purl_"+aLog.purl) )+"'>"
        var allStars = aLog.vulog_mark_stars;
        if (page_type!="public") {
            if(!allStars) allStars=[];
            tempret+="<span "+(allStars.length>0?"":"class='emptyStarHolder' style='display:none'")+">"
            starList.forEach(function(anItem) {tempret+="<span id='click_markChange_"+anItem+(aLog._id?"_hasid_":"_noid_")+aLog.purl+"' class='fa "+anItem+" littlestars "+(allStars.indexOf(anItem)>-1?" chosen-star'":" unchosen-star' style='display:none'")+" ></span>" });
            tempret+="&nbsp;&nbsp;&nbsp;&nbsp;<span class='removeMark'  id ='click_removeMark_"+(aLog._id? ("id_"+aLog._id): ("purl_"+aLog.purl) )+"' style='display:"+(this.editmode?"inline-block":"none")+"' >remove item</span>" 
            tempret+="</span>"
        }
        if (aLog.vulog_mark_tags && aLog.vulog_mark_tags.length>0) tempret += "<div> Tags: "+aLog.vulog_mark_tags+"</div>"
        if (aLog.vulog_mark_notes && aLog.vulog_mark_notes.length>0) tempret += "<div> Notes: "+aLog.vulog_mark_notes+"</div>"
        tempret += "</div>"
        tempret += "<div class='vulog_Mdetails' id='"+"click_meta_details}{_"+aLog.purl+"' style='display:none'>"+vulog_textOps.details_desc(aLog, {'novisits':(page_type=="public"? true:false)})+"</div>";
        tempret += "<span class='fa-chevron-right vulog_meta meta_for_marks' id='"+"click_meta_}{_"+aLog.purl+"'> Details </span>";
        return tempret;
    },
    get_date_string: function(timestamp){
        var theString = new Date(timestamp).toDateString();
        if (theString == this.today_string) {return this.divs.today_word} else {return theString;}
    }
}



