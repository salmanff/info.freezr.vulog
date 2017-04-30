// vulog for freezr  - web app

var vulog =  vulog? vulog : {
    data: {logs:[], searchresults:[], userMarks:[]}
}

var web_historian = new vulog_historian ({ // used with vulog_historian
    page_type: "online", // can be "local" or "online" - "local" gets results from exising jloss file - online gets results from freezr

    max_items_fetch:200,
    historyResultsDivId: "vulog_all_records",
    marksResultsDivId: "vulog_all_records",
    endOfHistoryDivId: "end_of_history",
    endOfMarksDivId: "end_of_history",
    noHistoryItem: "no_history_warning",
    noHistoryAtAllItem: "no_history_atall_warning",
    moreHistoryDivId: "click_search_history_more",
    moreMarksDivId: "click_search_marks_more",
    idSearchHistoryBox: "idSearchHistoryBox",
    idSearchMarksBox: "idSearchMarksBox",
    resetSearchDivId: "click_resetsearch",
    resetFiltersDivId: "click_resetsearch",

    today_word: "Today",
    })

var removals = {inprogress:false, history_items:[]}
var searchWhat; 

freezr.initPageScripts = function() {
    searchWhat = (web_historian.divs.idSearchMarksBox && document.getElementById(web_historian.divs.idSearchMarksBox))? "marks":"history";
    
    web_historian.doSearch(searchWhat);

    document.addEventListener('click', function(e) { 
        var elSects = e.target.id.split('_');
        if (elSects[0]== "click") {doClick(elSects)}
    }, false);

    var searchBox = document.getElementById(searchWhat=="marks"? web_historian.divs.idSearchMarksBox: web_historian.divs.idSearchHistoryBox)
    if (searchBox) {searchBox.onkeypress= function (evt) {
            if (evt.keyCode == 13 || evt.keyCode == 32) {
                if (evt.keyCode == 13) evt.preventDefault(); 
                web_historian.doSearch(searchWhat); 
            }
        }
    }
}


var doClick = function (args) {
    switch(args[1]) {
        case 'search':
            web_historian.doSearch(args[2]); 
            break;
        case 'resetsearch':
            resetSearch(searchWhat); 
            break;
        case 'meta':
            var aGroup = args.slice(3).join("_");
            web_historian.toggleview(aGroup); 
            break;
        case 'title':
            var aURL = args.slice(3).join("_")
            var theLink = (web_historian.urls[aURL] && web_historian.urls[aURL].url)? web_historian.urls[aURL].url: null;
            if (theLink) {window.open(theLink)} else {console.log("error opening url "+theLink)}
            break;
        case 'filterStar':
            toggleStar("filter",args[2])
            break;
        case 'resetsearch':
            var searchBox = document.getElementById(what=="history"? web_historian.divs.idSearchHistoryBox: web_historian.divs.idSearchMarksBox);
            resetSearch(searchWhat);
            break;
        case 'toggleMarksEditMode':
            if (document.getElementById("click_toggleMarksEditMode")) document.getElementById("click_toggleMarksEditMode").innerHTML = web_historian.editmode? "Back to Edit mode":"Back to View mode";
            if (document.getElementById("userMarks_area")) document.getElementById("userMarks_area").style.display = web_historian.editmode? "block":"none";
            if (document.getElementById("SeachHolder")) document.getElementById("SeachHolder").style.display = web_historian.editmode? "block":"none";
            web_historian.toggleEditMode("marks");
            break;
        case 'toggleHistEditMode':
            if (document.getElementById("click_toggleHistEditMode")) document.getElementById("click_toggleHistEditMode").innerHTML = web_historian.editmode? "Back to Edit mode":"Back to View mode";
            if (document.getElementById("SeachHolder")) document.getElementById("SeachHolder").style.display = web_historian.editmode? "block":"none";
            web_historian.toggleEditMode("history");
            break;
        case 'markChange':
            if (web_historian.editmode) {
                markChangeOnline(args[2],args[3],args.slice(4).join("_")); // type, "id", id
            }
            break;
        case 'removeHistItem':
            var type = args[2]
            args.splice(0,3)
            var id = args.join("_");
            removeHistItem(type,id);
            break;        
        case 'removeMark':
            var type = args[2]
            args.splice(0,3)
            var id = args.join("_");
            removeMark(id);
            break;
        case 'removeMultiple':
            args.splice(0,2)
            var id = args.join("_");
            console.log("todo - implement removal of multiple ids in group",id);
            break;
        default:
             console.log('undefined click ')
    }
}



var toggleStar = function(which, theStar) { // nb only used for toggling filters here
    var starDiv = document.getElementById("click_"+which+"Star_"+theStar+"_0");
    var starIsChosen = (starDiv && starDiv.className.indexOf("unchosen")<0);
    if (!starDiv) console.log("ERROR - no stardiv")
    if (!theStar) {
        console.log("Error - no stars")
    } else if (!starIsChosen) {
        starDiv.className = "fa "+theStar+" stars chosen-star"
        if (which=="mark" && stats.current_userMark.vulog_mark_stars.indexOf(theStar) < 0) stats.current_userMark.vulog_mark_stars.push(theStar);
        if (which=="filter" && web_historian.star_filters.indexOf(theStar) < 0) web_historian.star_filters.push(theStar)
    } else {
        starDiv.className = "fa "+theStar+" stars unchosen-star";
        if (which == "mark") {
            var idx = stats.current_userMark.vulog_mark_stars.indexOf(theStar);
            stats.current_userMark.vulog_mark_stars.splice(idx,1);
        } else if (which == "filter") {
            var idx = web_historian.star_filters.indexOf(theStar);
            web_historian.star_filters.splice(idx,1);
        }
    }

    if (which == "mark") message_mark_page('vulog_mark_stars',stats.current_userMark.vulog_mark_stars, stats.couldNotConnectToFreezr);
    if (which == "filter") {web_historian.clearSearch(); web_historian.doSearch("marks");}
}


var markChangeOnline = function (type, id_type, purl) {
    console.log({type, id_type, purl});
    var element = document.getElementById("click_markChange_"+type+"_"+id_type+"_"+purl);
    var doAdd = element.classList.contains("unchosen-star");
    if (id_type=="hasid"){
        freezr.db.query(function(returnJson) {
            returnJson = freezr.utils.parse(returnJson);
            console.log({returnJson})
            if (returnJson.error || !returnJson.results || !returnJson.results.length>0) {
                showWarning("Error making change. Make sure you are online")
            } else {
                var updatedRecord = returnJson.results[0];
                console.log({updatedRecord})

                var logdiv = document.getElementById("log}{"+updatedRecord._id);
                var reservedKeys = ["_date_Created","_date_Modified","_creator","_accessible_By"]
                for (aKey in reservedKeys) {delete updatedRecord[reservedKeys[aKey]];}
                console.log({updatedRecord});
                if (doAdd) {
                    updatedRecord.vulog_mark_stars = addToListAsUnique(updatedRecord.vulog_mark_stars,type)
                } else {
                    var idx = updatedRecord.vulog_mark_stars.indexOf(type);
                    updatedRecord.vulog_mark_stars.splice(idx,1);
                } 
                console.log("updatedRecord.vulog_mark_stars now ",updatedRecord.vulog_mark_stars)
                freezr.db.update(updatedRecord, function(returnJson) {
                    returnJson=freezr.utils.parse(returnJson);
                    console.log("wrote item",returnJson)
                    if (returnJson && returnJson.success) {
                        element.classList.remove(doAdd?"unchosen-star":"chosen-star")
                        element.classList.add(doAdd?"chosen-star":"unchosen-star")
                        if (type=="fa-bullhorn") {
                            if (returnJson.confirmed_fields && returnJson.confirmed_fields._id){
                                console.log("it is a fa-bullhorn steobject access for id "+returnJson._id,returnJson);
                                var options = { 'action': (doAdd?"grant":"deny"), 'shared_with_group':'public', 'collection': 'userMarks'}
                                freezr.perms.setObjectAccess(function (returndata) {
                                  var d = freezr.utils.parse(returndata);
                                  if (d) console.log("returndata from setObjectAccess ",d)
                                  if (d.issues) console.log("INTERNAL ERROR: "+d.issues)
                                  if (d.err || d.error) {
                                    console.log("got err "+d.code)
                                    if (d.code=="PermissionNotGranted" || d.code=="PermissionMissing") {
                                        showWarning("You have not granted the permission to make marks public. Please click on the freezr logo and grant the permission");
                                    } else {
                                        showWarning("The mark was not made public due to an internal error - try unmarking and marking again");
                                    }
                                  } else {
                                    console.log("success markign as public")
                                  }
                                }, 'publish_favorites', returnJson.confirmed_fields._id, options)
                            } else {
                                    showWarning("The mark was not made public due to an internal error - try unmarking and marking again");
                                    console.log("Error marking public - no _id returned from server when marking");
                            }
                        }
                    } else {
                        console.log("err deleting ",returnJson)
                        showWarning("Error removing log from server.");
                    }
                },  "userMarks" )
            }
        }, null, {collection:"userMarks", query_params:{'purl':purl}} )
    }
}
var resetSearch = function(what) {
    var searchBox = document.getElementById(what=="history"? web_historian.divs.idSearchHistoryBox: web_historian.divs.idSearchMarksBox);
    if (searchBox) searchBox.textContent="";
    if (what=="marks"){
        web_historian.star_filters.forEach(function(theStar) {
            var starDiv = document.getElementById("click_filterStar_"+theStar+"_0");
            if (theStar && theStar!=" " && starDiv) {
              starDiv.className = "fa "+theStar+" stars unchosen-star";  
            } 
        });
        web_historian.star_filters=[];
    } 
    web_historian.clearSearch(what);
    web_historian.doSearch(what);

}
var addToListAsUnique = function(aList,anItem) {
  if (!anItem) {
    return aList
  } else if (!aList) {
    return [anItem]
  } else if (aList.indexOf(anItem) < 0) {
    aList.push(anItem);
  } 
  return aList
}
var showWarning = function(aText) {
    document.getElementById("warnings").innerHTML = (aText);
    document.getElementById("warnings").style.display="block";
    setTimeout(function(){ document.getElementById("warnings").style.display="none"; }, 5000);
}




var removeHistItem  = function(type, id) {
    console.log("trying to remove ",type," _ ",id)
    if (type=="id"){
        if (this.syncing) {
            this.divs.showWarning("Please retry after syncing is complete.")
        } else {
            var theDiv = document.getElementById("click_removeHistItem_id_"+id)
            if (theDiv && theDiv.className=="removeHistItem" && !removals.inprogress) {
                removals.history_items.push(type+"_"+id);
                removeNextHistoryItem();
            } else {
                this.divs.showWarning("Error fnding id "+id+" - item already removed??")
            }   
        }
        // make sure freezr is not syncing and ping to make sure online
    } else if (type=="mod") {
        console.log("removing mod time ",id)
        if (this.syncing) {
            this.divs.showWarning("Please retry after syncing is complete.")
        } else {
            var theDiv = document.getElementById("click_removeHistItem_mod_"+id)
            if (theDiv) theDiv.className="removedItem";
            this.divs.removeOfflineItem(id, "logs", function(response) {
                console.log("Successful removal - change div here for id "+id)
                if (response && response.success && theDiv) {
                    if (theDiv) theDiv.innerHTML="Removed";
                } else {
                    console.log("err deleting ",response)
                    if (theDiv) theDiv.innerHTML="Error - try later";
                    this.divs.showWarning("Error removing item - please refresh")
                }            
            });
        }
    }
}
var removeNextHistoryItem  = function() {
    if (removals.history_items.length>0) {
        var type_id=removals.history_items.pop();
        if (type_id.split("_").length<2 || type_id.indexOf("id_"!=0)) {
            this.divs.showWarning("Error in type_id "+type_id)
            this.removeNextHistoryItem();
        } else {
            var type = type_id.split('_')[0];
            var id = type_id.split('_').splice(0,1)[0];
            var theDiv = document.getElementById("click_removeHistItem_"+type_id);
            if (theDiv) theDiv.className="removedItem";
            console.log("removing ",type," _ ",id);
            freezr.db.getById(id, function(returnJson) {
                returnJson=freezr.utils.parse(returnJson);
                console.log({returnJson})
                if (returnJson.error || !returnJson.results || !returnJson.results._id) {
                    this.divs.showWarning("could not find item in your freezr - id:"+id)
                    if (theDiv) theDiv.innerHTML="Error";
                    this.removeNextHistoryItem();
                } else {
                    console.log("deleting id "+returnJson.results._id)
                    var updatedRecord = {}
                    var reservedKeys = ["_date_Created","_date_Modified","_creator","_public","_sharing"]
                    for (aKey in returnJson.results) {
                        if (returnJson.results.hasOwnProperty(aKey) && reservedKeys.indexOf(aKey)<0) {updatedRecord[aKey]=null;}
                    }
                    updatedRecord._id = returnJson.results._id;
                    updatedRecord.fj_deleted =true;
                    console.log({updatedRecord})
                    freezr.db.update(updatedRecord, function(returnJson) {
                        returnJson=freezr.utils.parse(returnJson);
                        if (returnJson && returnJson.success) {
                            if (theDiv) theDiv.innerHTML="Removed";
                        } else {
                            console.log("err deleting ",returnJson)
                            this.divs.showWarning("Error removing item "+id);
                        }
                        this.removeNextHistoryItem();
                    }, "logs")
                }
            }, "logs") 
        }
    } else {
        removals.inprogress = false;
        if (this.divs.changeItemsCallBack) {this.divs.changeItemsCallBack();}

    }
}
var removeMark  = function(id) {
    freezr.db.getById(encodeURIComponent(id), function(returnJson) {
        returnJson=freezr.utils.parse(returnJson);
        var logdiv = document.getElementById("log}{"+id);
        console.log({returnJson})
        if (returnJson.error || !returnJson.results || !returnJson.results._id) {
            logdiv.innerHTML=logdiv.innerHTML+"<div class='removeError'>Error finding log on server - could not change this.</div>"
        } else {
            console.log("deleting id "+returnJson.results._id)
            var updatedRecord = {}
            var reservedKeys = ["_date_Created","_date_Modified","_creator","_public","_sharing"]
            for (aKey in returnJson.results) {
                if (returnJson.results.hasOwnProperty(aKey) && reservedKeys.indexOf(aKey)<0) {updatedRecord[aKey]=null;}
            }
            updatedRecord._id = returnJson.results._id;
            updatedRecord.fj_deleted =true;
            console.log({updatedRecord})
            freezr.db.update(updatedRecord, function(returnJson) {
                returnJson=freezr.utils.parse(returnJson);
                if (returnJson && returnJson.success) {
                    logdiv.style.display="none"
                } else {
                    console.log("err deleting ",returnJson)
                    logdiv.innerHTML=logdiv.innerHTML+"<div class='removeError'>Error removing log from server.</div>"
                }
            }, "userMarks")
        }
    }, "userMarks")
}
