hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}



function GetLinePattern(time, priority, line) {
    line=line.replace("\t", " ");
    var words=line.split(" ", 21);
    var cut=false;
    if (words.length >= 20) {
        words=words.slice(0, 20);
        cut=true;
    }
    var pattern = [];
    var html_pat = "";
    var wa = false;
    var np_count = 0;
    var table = [
    
        [/^$/i, false, function(m){ 
             return ["", ""]; 
        }],

        [/^[a-z\-_:;,"'\.<>#=\\\/\[\]\(\)!\?&]+$/i, false, function(m){ 
             return [m[0], escapeRegExp(m[0])]; 
        }],
        
        [/^([+-]?[\d]+)([,;\.\(]?)$/i, true, function(m){ 
             return ['<b class="pattern number">'+m[1]+'</b>'+m[2], "([+-]?\\d+)"+escapeRegExp(m[2])]; 
        }],
        
        [/^([+-]?\d*\.\d+)([,;\.\(]?)$/i, true, function(m){ 
             return ['<b class="pattern number">'+m[1]+'</b>'+m[2], "([+-]?\\d*\\.\\d+)"+escapeRegExp(m[2])]; 
        }],
        
//      [/^([^\d]*)[:=,]([\d]+)$/i, true, function(m){ 
//            return [m[1]+'<b style="color: #c0c;">N</b>', escapeRegExp(m[1])+"(\\d+)" ]; 
//      }],
        
        
        [/^(([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2}))$/i, true, function(m){ 
            return ['<b class="pattern address" style="">'+m[0]+'</b>', "(([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2}))" ]; 
        }],
        
        
        
        
        
        
//      [/^([^\d]*)([\d]+)([^\d]*)$/i, true, function(m){ 
//           return [m[1]+'<b style="color: #c0c;">N</b>'+m[3], escapeRegExp(m[1])+"(\\d+)"+escapeRegExp(m[3])]; 
//      }],
        
        
        
//      [/^[a-z0-9\-_\.:;+,\(\)\{\}\[\]#\/<>=!\^$'"]+$/i, true, function(m){
//           var jd = "\\d+";
//           var ph = "N";
//           var nnd = m[0].split(/\d+/);
//           var nnde = [];
            
             
//           for (var i in nnd) {
//               nnde.push(escapeRegExp(nnd[i]));
//           }
//           return [nnd.join('<b style="color: #c0c;">'+ph+'</b>'), nnde.join(jd)]; 
//      }],
        
        

//      [/(\S+)/i, true, function(m){ 
//           return ["(\\S+)", "(\\S+)"]; 
//      }],
    ];
    for (var i in words) {
        var word = words[i];
        var add=false;
        for (var j in table) {
           var r = table[j];
           var m = word.match(r[0]);
           if (m) {
              var pat = r[2](m);
              pattern.push(pat[1]);
              if (pat[1]) np_count++;
              html_pat+=(r[1] ? "<abbr style='' title='"+pat[1]+"'>"+pat[0]+"</abbr>" :  pat[0] )+" "; // &hellip;
              add=true;
              break;
           }
           
        }
        if (!add) {
              var p = "(\\S+)";
              pattern.push(p);
              var pl = word;
              html_pat+="<abbr class='pattern' title='"+p+"'>"+pl+"</abbr>"+" ";
        }
    }
    //console.log(words);
    //console.log(pattern);
    pattern = pattern.join(" ");
    pattern = "^"+pattern+(cut ? "" : "$");

    return {
        hash: hashCode(pattern),
        pattern: pattern,
        time: time,
        priority: priority,
        html_pat: html_pat + (cut ? '<span style="background-color: rgba(255,0,0,.1); color: rgba(255,0,0);">[&hellip;]</span>':""),
        np_count: np_count,
    };
}
    
    var offset=0;
    var lines = 0;
    
    var items = new vis.DataSet({
        type: { start: 'ISODate', end: 'ISODate' }
    });

    var graph_items = [];
    var graph_items_offset = 0;

    var draw_items = [];

    var graphFilter;

    var view = new vis.DataView(items, {
      filter: function (item) {
         return true;
      }
    }); 
  
    var groups = new vis.DataSet();
    groups.add([
  
    {
      id: "main",
      content: 'main',
      order: 0,
    },
    
    ]);
    
    
    
   var item_template;
   
   var log_time = vis.moment();
    
   var options = {
       groupOrder: 'order',  // groupOrder can be a property name or a sorting function
       start: new Date(Date.now() - 1000 * 60 * 60 * 12),
       end: new Date(Date.now() + 1000 * 60 * 60 * 12),
       //zoomMin: 1000 * 60 * 60 * 1,             // one day in milliseconds
       //zoomMax: 1000 * 60 * 60 * 24 * 365*100,     // about three months in milliseconds
       //verticalScroll: true,
       //horizontalScroll: true,
       //zoomKey: 'ctrlKey',
       //multiselect: true,
       height: "700px",
       //moment: function(){return log_time;},
   
    margin: {
        item: {
           horizontal: 0,
        },
    },
   
   editable: false,  // default for all items
   stack: true,
   stackSubgroups: true,
      template: function(item) {
        return item_template(item);
      }, 
   };
   
   var timeline;
   var graph;
   
   
   var target_file = "";
   var search_table=[];
   
   var data_size = {
       processed: 0,
       process_speed: 0,
       max_speed: 0,
       total: 0,
       max: 0,
       
   }
    function GetFileSize() {
        
        $.ajax({
              url: "api?action=get_size&file="+target_file,
              context: document.body,
              success: function(result) {
                var size=parseInt(result);
                if (size > data_size.total) {
                    data_size.total=size;
                }
              }
        });
    }


    
    function HumanSize(offset) {
        var s = ["B", "KB", "MB", "GB"];
        var i = 0;
        var result = parseFloat(offset);
        while (i<s.length) {
            if (result > 1024) {
                ++i;
                result = result/1024;
            } else {
                break;
            }
        }
        
        return Math.floor(result*100)/100+" "+s[i];
    }
    
    function HumanCount(offset) {
        var s = ["", "K", "M", "G"];
        var i = 0;
        var result = parseFloat(offset);
        while (i<s.length) {
            if (result > 1000) {
                ++i;
                result = result/1000;
            } else {
                break;
            }
        }
        
        return Math.floor(result)+s[i];
    }
    
    
    function BadgeCount(offset) {
        var s = ["", "K", "M", "G"];
        var i = 0;
        var result = parseFloat(offset);
        while (i<s.length) {
            if (result > 1000) {
                ++i;
                result = result/1000;
            } else {
                break;
            }
        }
        
        var dv = 10;
        if (result>=100) dv=1;

        return Math.floor(result*dv)/dv+s[i];
    }
    
    function AddCmMac(mac){
        groups.update([{
            id:mac,
            order:2,
            content: "<pre>"+mac+"</pre>",
          }]);
    }
    
    
    var st_regex_cache = {}
    
    function LogHandler(item) {
    
        //var regex = /(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d,\d{3}) ([A-Z]+) (.*)|(.+)/gm;
        
        for (var i in search_table) {
           var entry = search_table[i];
           if (entry.state != "ON") continue;
           var pt_hash = hashCode(entry.pattern);
           if (!st_regex_cache.hasOwnProperty(pt_hash)) {
               st_regex_cache[pt_hash] = {
            		   pattern: entry.pattern,
            		   regex: new RegExp(entry.pattern, "gm")
               };
           }
           var rgxi = st_regex_cache[pt_hash];
           
           // Check for hash collisions
           var regex = (rgxi.pattern == entry.pattern) ? rgxi.regex : new RegExp(entry.pattern, "gm");
           
           var m = regex.exec(item.message.replace("\t", " "));
           if (m) {
               function replacer(match, p1, offset, string) {
                  var i = parseInt(p1);
                  return (i<m.length) ? m[i] : "$"+i;
                }
                
                var rep_rg=/\$(\d+)/g

               item.content=entry.label.replace(rep_rg, replacer);
               item.title='<div class="tl-tooltip">'+entry.tooltip.replace(rep_rg, replacer)+'</div>';
               item.group=entry.group.replace(rep_rg, replacer);
               if (item.group!="main" && item.group!="hide" && item.group!="") {
                 AddCmMac(item.group);
               }
               if (item.group != "hide") {
                  items.add([item]);
             }
               if (entry.name == graphFilter.value) {
                   graph_items.push(item);
               }

               return true;
               break;
           }
        }
        
        return false;
    }
    
    function ClearLogs() {
        $.ajax({
              url: "api?action=truncate&file="+target_file,
              context: document.body,
              success: function(result) {
                 ClearLoadedData();
                 data_size.processed = 0;
                 data_size.max = 0;
                 data_size.total = 0;
                 GetFileSize();
              }
        });
        
    }
    
    

    
    function ClearLoadedData() {
        offset=0;
        lines = 0;
        $("#logs").html("");
        //$("#patterns").html("");
        pattern_table={};
        items.clear();
        graph_items.length = 0;
        graph_items_offset = 0;
        draw_items.length = 0;
        prev_entry = null;
        prev_level = "";
        prev_add = false;
        displayed_logs=0;
        data_size.processed = 0;
        
        DisplayCounters();
    }
    
    var displayed_logs = 0;
    var displayed_groups = 0;
    
    function DisplayCounters() {
        $("#file_size").text(HumanSize(data_size.total));
        $("#offset").text(HumanSize(data_size.processed));
        $("#lines").text(HumanCount(lines));
        $(".id-source-file").text(target_file);
        $("#logs_badge").attr("data-badge", BadgeCount(displayed_logs));
        $("#patterns_badge").attr("data-badge", BadgeCount(Object.keys(pattern_table).length));
        $("#patterns_badge_display").attr("data-badge", BadgeCount(displayed_groups));
        
        
        
        $("#process_speed").text(HumanSize(data_size.process_speed)+"/s");
        
        var data_pb = document.querySelector('#memory_progress');
        var speed_pb = document.querySelector('#speed_progress');
        var data_p = data_size.processed*100/data_size.total;
        
        if (data_size.max_speed) {
            speed_pb.MaterialProgress.setProgress(data_size.process_speed*100/data_size.max_speed);
            $(speed_pb).fadeTo(10, data_size.process_speed>data_size.max_speed*.1 ? 100 : 0 );
            
        }
            
        if (data_size.total > 0) {
            data_pb.MaterialProgress.setProgress(data_p);
            //$(data_pb).fadeTo(50, p<99 ? 50 : 0 );
            data_pb.MaterialProgress.setBuffer(data_size.max*100/data_size.total);
            $(data_pb).fadeTo(10, data_p<(data_size.process_speed>data_size.max_speed*.1 ? 100 : 98) ? 100 : 0 );
        } else {
            data_pb.MaterialProgress.setProgress(0)
            data_pb.MaterialProgress.setBuffer(0);
        }
        OnResize();
    }
    
    function GetDefaultRule() {
      return {
             name:"New rule",
             state:"NEW",
             pattern:"(.*)",
             label:"Label",
             group:"main",
             tooltip:"$0",
        };
    }
    
    
    function IsFiltersEnabled() {
    
        for (var i in search_table) {
            var entry = search_table[i];
            if (entry.state == "ON") return true;
        }
        
        return false;
    }
    
    function AddRuleFromPattern(hash) {
        var p = pattern_table[hash];
        
        var rule = {
            name: hash,
            state: "ON",
            pattern: p.pattern, 
            label: hash,
            group: "hide",
            tooltip: "$0",
        };
        
        AddRule(rule);
        ApplyRules();
    }
    
    
    
    
        
    function IsPatternPresent(pattern) {
    
        for (var i in search_table) {
            var entry = search_table[i];
            if (entry.pattern == pattern) return true;
        }
        
        return false;
    }
    
    
    function RemovePattern(pattern) {
        $( "#rules-table tbody tr" ).each(function() {
             var test_pattern=$( this ).find( "td.pattern").text();
             if (test_pattern == pattern) {
                $(this).remove();
             }
        });
        ApplyRules();
    }
    
    
    function AddRuleFromThis(obj) {
        var hash = parseInt($(obj).attr("data-hash"));
        $(obj).find("i").text("check_box");
        $(obj).attr("onclick", "RemoveRuleFromThis(this); return false;");
        AddRuleFromPattern(hash);
        ApplyRules();
    }
    
    
    function RemoveRuleFromThis(obj) {
        var hash = parseInt($(obj).attr("data-hash"));
        var p = pattern_table[hash];
        $(obj).find("i").text("check_box_outline_blank");
        $(obj).attr("onclick", "AddRuleFromThis(this); return false;");
        RemovePattern(p.pattern);
    }
    
    function AddRule(rule) {
        var tr = $( "<tr></tr>");
        
        var fields = ["name", "state", "pattern", "label", "group", "tooltip"];
        $( "#rules-table").attr("data-upgraded", null);
        $( "#rules-table").removeClass("is-upgraded");
        $( "#rules-table thead th:first").remove();
        //$( "#rules-table tbody tr").remove();
        
        $( "#rules-table tbody tr" ).each(function() {
            $( this ).find("td").first().remove();
        });
        
        //$(tr).append('<td><label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select mdl-js-ripple-effect--ignore-events is-upgraded" data-upgraded=""><input type="checkbox" class="mdl-checkbox__input"><span class="mdl-checkbox__focus-helper"></span><span class="mdl-checkbox__box-outline"><span class="mdl-checkbox__tick-outline"></span></span><span class="mdl-checkbox__ripple-container mdl-js-ripple-effect mdl-ripple--center" data-upgraded=",MaterialRipple"><span class="mdl-ripple"></span></span></label></td>')
        for (var i in fields) {
            var k = fields[i];
            $(tr).append('<td class="mdl-data-table__cell--non-numeric '+k+'">'+rule[k]+'</td>')
        }
        $( "#rules-table tbody").append(tr);
        componentHandler.upgradeDom();
    }
    
    
    function EditRule() {
        var dialog = document.querySelector('#rule-dialog');
        //rule-dialog
        var sel = $( "#rules-table tbody tr.is-selected");
        var rule = GetDefaultRule();
        //console.log(sel[0]);
        for (var k in rule) {
            var value = $(sel).find( "td."+k).text();
            if (k=="state") {
                 if (value == "ON") {
                    document.querySelector('#rule-dialog-enabled-label').MaterialCheckbox.check();
                 } else {
                    document.querySelector('#rule-dialog-enabled-label').MaterialCheckbox.uncheck();
                 }
            } else {
                $("#rule-dialog ."+k).val(value);
            }

            //console.log($(sel).find( "td."+k).text());
        }
        dialog.showModal();
    }
    
    function SaveRule() {
       var rule = GetDefaultRule();
       var sel = $( "#rules-table tbody tr.is-selected");
       for (var k in rule) {
           var value;
           if (k == "state") {
                value=$('#rule-dialog-enabled').prop('checked') ? "ON" : "OFF";
           } else {
                value=$("#rule-dialog ."+k).val();
           }
           $( sel ).find( "td."+k).text(value);
       }
       ApplyRules();
    }
    
    function ApplyRules() {
       search_table=GenerateFilterTable({});
       ClearLoadedData();
       //GetFileSize();
       data_size.processed = 0;
       DisplayCounters();
    }
    
    function RemoveRules() {
       $( "#rules-table tbody tr.is-selected" ).remove();
       ApplyRules();
    }
    
    function EnableRules() {
       $( "#rules-table tbody tr.is-selected td.state" ).text("ON");
       ApplyRules();
    }
    
    function DisableRules() {
       $( "#rules-table tbody tr.is-selected td.state" ).text("OFF");
       ApplyRules();
    }
    
    function DownloadFile() {
        window.location="api?action=get&file="+target_file;
    }
    
    
    
    function GenerateFilterTable(override) {
        var result = [];
        
        $( "#rules-table tbody tr" ).each(function() {
          var rule = GetDefaultRule();
          
          for (var k in rule) {
             rule[k]=$( this ).find( "td."+k).text();
             
          }
        

        for (var k in override) {
            rule[k] = override[k];
        }
        
          result.push(rule);
        });
        return result;
    }
    
    function SaveRules() {
    	
    	SaveToFile(JSON.stringify(GenerateFilterTable({state:"OFF"})), "filters.json", "application/json");
        
        //componentHandler.upgradeDom()
    }
    
    function ImportRules() {
    	ShowLoadFileDialog(function(result){

    		var rules = JSON.parse(result);
            
            for (var i in rules) {
               var rule = rules[i];
               AddRule(rule);
            }

            search_table=GenerateFilterTable({state:"OFF"});
    	});
    	
    }
    
    
    function LoadRules() {
         
         $.ajax({
          type: "GET",
          url: "api?action=get_rules",
          success: function(result) {
              $( "#rules-table tbody").html("");
              //console.log(result);
              var rules = JSON.parse(result);
              
              for (var i in rules) {
                 var rule = rules[i];
                 AddRule(rule);
              }
              
              search_table=GenerateFilterTable({state:"OFF"});
          },
        });

        //componentHandler.upgradeDom()
    }
    
    function SaveToFile(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }
    
    var prev_entry = null;
    var prev_level = "";
    var prev_add = true;
    
    var pattern_table = {};
                 
    function DownloadLogs() {
       var data = $("#logs").text();
       SaveToFile(data, target_file.trim()+"_filtered.txt", "text/plain");
    }
    

    
    function DumpPatternInfo() {
        displayed_groups = 0;
        var html = "";
        var list = []
        for (var h in pattern_table) {
           var p = pattern_table[h];
           if (p.counter > 0) { 
               list.push(p);
           }
        }
        
        var sort_by_time = $("#timesort_patterns").prop("checked");
        list.sort(function(a,b) {
           return sort_by_time ? b.time - a.time : b.counter - a.counter;
        });
        
        for (var i in list) {
           var p = list[i];
        
           var add_link = '<a class="check add" href="#" data-hash="'+p.hash+'" onclick="AddRuleFromThis(this); return false;"><i class="material-icons">check_box_outline_blank</i></a>';
           if (IsPatternPresent(p.pattern)) {
               add_link = '<a class="check delete" href="#" data-hash="'+p.hash+'" onclick="RemoveRuleFromThis(this); return false;"><i class="material-icons">check_box</i></a>';
           }
           
           displayed_groups++;
           //html+="<div class='log_line "+p.priority+"'><a style='text-decoration: none;' href='#' onclick='AddRuleFromPattern("+p.hash+"); return false;'>+</a><span style='width: 50px; display: inline-block; text-align: right;'>"+p.counter+"</span> "+p.time.format("YYYY-MM-DD HH:mm:ss,SSS")+" "+p.priority+" <span>"+p.html_pat+"</span></div>";
           html+='<div class="log_line '+p.priority.toLowerCase()+'"> '+add_link+' <span class="count">'+p.counter+' </span><span class="time">'+p.time.format("YYYY-MM-DD HH:mm:ss,SSS")+'</span> <span class="priority">'+p.priority+'</span> <span class="message">'+p.html_pat+'\n</span></div>';
        }
        

        $("#patterns").html(html);
    }
    
    function HandleProcessedBytes(size) {
        
        data_size.processed+=size;
        if (data_size.processed > data_size.max) {
            data_size.max=data_size.processed;
        }
        
        if (data_size.max > data_size.total) {
            data_size.total = data_size.max;
        }
    }
    
    var log_root_regex = /((\d{4}-\d\d-\d\d \d\d:\d\d:\d\d,\d{3})|(\d\d\/\d\d\/\d{4} \d\d:\d\d:\d\d\.\d{3})) ([A-Za-z]+) (.*)|(.+)/gm;
    
    function HandleData(result) {
        offset+=result.length;
             HandleProcessedBytes(result.length);
             var d = $('#logs');
             var need_scroll = (d[0].scrollHeight - d.scrollTop() - d.outerHeight()) < 5;
             
             if (result.length>0) {
                 
                 
                 var m;
                 
                 
     
                 while ((m = log_root_regex.exec(result)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === log_root_regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    lines+=1;
                    
    
                if (m[6]) {
                    if (prev_add && prev_entry) {
                         prev_entry.find(".message").append(m[6]).append("\n");
                         //$("#logs").append('<span class="log_line '+prev_level.toLowerCase()+'"><span>'+m[6]+'</span></span>');
                    } else {
                        //console.log("Entry wasn't added", prev_add, prev_entry, m[6]);
                    }
                } else {
                    
                    var link_id = 'log_line_'+lines;
                    var start = vis.moment();
                    if (m[2]) {
                       start = vis.moment(m[2], "YYYY-MM-DD HH:mm:ss,SSS");
                       log_time=start;
                    } else if (m[3]) {
                       start = vis.moment(m[3], "MM/DD/YYYY HH:mm:ss.SSS");
                       log_time=start;
                    }
                    
                    
                    var item = {
                      id: lines,
                      content:m[4],
                      start: start,
                      type: "box",
                      group: "main",
                      subgroup: m[4],
                      priority: m[4],
                      message: m[5],
                    };
                    prev_add=true;
                    prev_level = m[4] ? m[4] : "";
                    var p = GetLinePattern(start, item.priority, item.message);
                    if (!pattern_table.hasOwnProperty(p.hash)) {
                        p.counter = 0;
                        pattern_table[p.hash] = p;
                        
                        //$("#patterns").append('<div id="pattern'+p.hash+'"><span class="counter"></span><span class="pattern"></span></div>');
                    }
                    
                    var pe=pattern_table[p.hash];
                    pe.counter++;
                    pe.time = p.time;
                    pe.html_pat = p.html_pat;
                    
                    if (filters_enabled) {
                       try {
                           prev_add=LogHandler(item);
                       } catch (e) {
                           console.log(e);
                           console.log(item);
                       }
                    }

                    if (prev_add) {
                        displayed_logs++;
                        prev_entry = $('<div class="log_line '+m[4].toLowerCase()+'"><span class="time">'+m[1]+'</span> <span class="priority">'+m[4]+'</span> <span class="message">'+m[5]+'\n</span></div>');
                        $("#logs").append(prev_entry);
                    }
                }
                

                    // The result can be accessed through the `m`-variable.
                    //m.forEach((match, groupIndex) => {
                    //    console.log(`Found match, group ${groupIndex}: ${match}`);
                    //});
                }
                 
                try {
                    updateGraph();
                } catch (e) {
                    console.log("updateGraph failed");
                    console.log(e);
                }

                 //$('#logs').text( $('#logs').text() + result )

                 if (need_scroll) {
                     d.scrollTop(d.prop("scrollHeight"));
                 }
                 
                
                 
                 setTimeout(Loader, 10);
                 

             } else {
                 setTimeout(Loader, 50);
                 if (need_scroll) {
                     //timeline.fit();
                 }
                 
             }
             
             var load_end = vis.moment();
             var duration = vis.moment.duration(load_end.diff(load_start)).add(50, 'milliseconds');
             
             var bps = duration.asSeconds() ? result.length/duration.asSeconds() : 0;
             
             data_size.process_speed = bps ? (data_size.process_speed+bps)/2 : 0;
             if (((data_size.max_speed+bps)/2) > data_size.max_speed) {
                 data_size.max_speed = (data_size.max_speed+bps)/2;
             }
             DisplayCounters();
             
             if (result.length>0) {
                  request_size = Math.round(bps*0.9+1);
             }
             
             
             GetFileSize();
             
             if ($("#autoload_patterns").prop("checked")) {
                DumpPatternInfo();
             }
        
    }
    
    var filters_enabled = true; //IsFiltersEnabled();
    var load_start = vis.moment();
    
    var request_size = 10*1024*1024;
    
    function Loader() {
       OnResize();
       if (target_file.trim()=="") return;
       filters_enabled = true; //IsFiltersEnabled();
       load_start = vis.moment();
       $.ajax({
          url: "api?action=get&file="+target_file+"&offset="+offset+"&length="+request_size,
          context: document.body,
          success: HandleData,
          statusCode: {
        	    404: function() {
        	        //ShowMessage("File not found, creating new one...");
        	    	$.ajax({
        	            type: "POST",
        	            data:"",
        	            url: "api?action=log&file="+target_file,
        	            success: function(result){
        	            	ShowMessage("New file created: " + target_file);
        	                Loader();
        	            }
        	    	});
        	    	
        	    },
        	  }
       }).done(function() {
          //$( this ).addClass( "done" );
          //Loader();
          
       });
    }
    
    
    
    
    function ShowFilenameDialog() {
        var c_filename = Cookies.get('filename');

        var filename_dialog = document.querySelector('#filename-dialog');
        $("#filename-dialog input.id-filename").val(c_filename ? c_filename : "");
        RequestFileList(".");
        filename_dialog.showModal();
    }
    
    function SetFilename(filename) {
        var start = (target_file.trim()=="");
        target_file=filename.trim();
        Cookies.set('filename', filename.trim(), { path: '' });
        ClearLoadedData();
        GetFileSize();
        data_size.processed = 0;
        data_size.max = 0;
        data_size.total = 0;
        DisplayCounters();
        if (start) {
            Loader();
        }
    }

    function OnResize() {
       var h = $(window).height()-$("#timeline").offset().top;
       if (h<0) h=0;
       timeline.setOptions({ height: h,  maxHeight: h});
       
       var h = $(window).height()-$("#logs").offset().top-10;
       if (h<0) h=0;
       $("#logs").height(h);
     }
   
    $(window).resize(OnResize);

    
    $( document ).ready(function() {
        console.log( "ready!" );
        item_template = Handlebars.compile(document.getElementById('item-template').innerHTML);
        var container = document.getElementById('timeline');
        timeline = new vis.Timeline(container, view, groups, options);
        timeline.setOptions({ orientation: {axis: "both", item: "top"} });
        
        var filename_dialog = document.querySelector('#filename-dialog');
        var showDialogButton = document.querySelector('#show-filename-dialog');
        if (! filename_dialog.showModal) {
          dialogPolyfill.registerDialog(filename_dialog);
        }
        showDialogButton.addEventListener('click', function() {
          ShowFilenameDialog();
          
        });
        
        filename_dialog.querySelector('.select').addEventListener('click', function() {
          var new_filename = $("#filename-dialog input.id-filename").val();
          ChooseFilename(new_filename);
        });
        
        filename_dialog.querySelector('.close').addEventListener('click', function() {
          filename_dialog.close();
        });

        graphFilter = document.getElementById('graph-filter-name');

        var dialog = document.querySelector('#rule-dialog');
       
        if (!dialog.showModal) {
          dialogPolyfill.registerDialog(dialog);
        }
        
        dialog.querySelector('.save').addEventListener('click', function() {
          SaveRule();
          dialog.close();
        });
        
        dialog.querySelector('.close').addEventListener('click', function() {
          dialog.close();
        });

        setTimeout(function(){
        OnResize();
        LoadRules();
        
        if (target_file.trim()=="") {
            ShowFilenameDialog();
            
        }
        }, 1000);
        
        
        
         document.querySelector('#memory_progress').addEventListener('mdl-componentupgraded', function() {
            if (data_size.total > 0) {
                this.MaterialProgress.setProgress(0);
                this.MaterialProgress.setBuffer(0);
            }
            
            
        });

    });

//$("label[for=option-rate]").click(function(){
//        console.log("RATE onClick");
//        $("#graph-rate-settings").show();
//        $("#graph-count-settings").hide();
//        $("#graph-value-settings").hide();
//        });

function onClickRateRadio(radio) {
        $("#graph-rate-settings").show();
        $("#graph-count-settings").hide();
        $("#graph-value-settings").hide();
}
    
function onClickCountRadio(radio) {
        $("#graph-rate-settings").hide();
        $("#graph-count-settings").show();
        $("#graph-value-settings").hide();
}

function onClickValueRadio(radio) {
        $("#graph-rate-settings").hide();
        $("#graph-count-settings").hide();
        $("#graph-value-settings").show();
}

function updateGraph() {
    console.log("updateGraph");
    if (! graph_items[0]) {
        console.log("no graph items");
        return;
    }
    var graph_options = {
        drawPoints: false,
        interpolation: false
    };
    //draw_items.length = 0;
    //console.log(graph_items_offset);
    if (document.getElementById("option-rate").checked) {
        updateRateGraph();
        //graph_options.style = 'bar';
        //graph_options.barChart  = {width:10, minWidth:10, align:'left', sideBySide:false};
    } else if (document.getElementById("option-count").checked) {
        updateCountGraph();
    } else if (document.getElementById("option-value").checked) {
        updateValueGraph();
    }
    //console.log(draw_items);
    if (draw_items.length != 0) {
        graph_options.start = draw_items[0].x;
        graph_options.end = draw_items[draw_items.length - 1].x;

        var graph_dataset = new vis.DataSet(draw_items);
        var graph_container = document.getElementById('graph-drawing');
        graph_container.innerHTML = "";

        var graph2d = new vis.Graph2d(graph_container, graph_dataset, graph_options);
    }
}


function updateRateGraph() {
    console.log("updateRateGr");
    var interval = document.getElementById('graph-rate-interval').value;
    var interval_start = graph_items[0].start;
    var interval_end = interval_start.clone();
    interval_end.add(interval, 's');
    var count = 0;
    for (var i = graph_items_offset; i < graph_items.length; ) {
    //for (var i = 0; i < graph_items.length; ++i) {
        //console.log(interval);
        //console.log(interval_start);
        //console.log(interval_end);
        //console.log(graph_items[i].start);
        //console.log("**********************");
        if (graph_items[i].start < interval_end) {
            ++count;
            ++i;
        } else {
            var date_time = interval_end.format('MM/DD/YYYY HH:mm:ss');
            draw_items.push({
                x: date_time,
                y: count
            });
            count = 1;
            interval_start.add(interval, 's');
            interval_end.add(interval, 's');
            graph_items_offset = i;
        }
    }
    /*draw_items.push({
        x: interval_end.format('MM/DD/YYYY HH:mm:ss'),
        y: count
    });*/
}

function updateCountGraph() {
    console.log("updateCountGr");
    for (var i = graph_items_offset; i < graph_items.length; ++i) {
        var date_time = graph_items[i].start.format('MM/DD/YYYY HH:mm:ss');
        if (draw_items.length == 0 || date_time != draw_items[draw_items.length - 1].x) {
            draw_items.push({
                x: date_time,
                y: i
            });
        } else {
            //console.log("Date match")
            draw_items[draw_items.length - 1].y = i;
        }
    }
    graph_items_offset = graph_items.length;
}

function updateValueGraph() {
    console.log("updateValueGr");
    var pattern = new RegExp(document.getElementById('graph-value-pattern').value);
    for (var i = graph_items_offset; i < graph_items.length; ++i) {
        var date_time = graph_items[i].start.format('MM/DD/YYYY HH:mm:ss');
        var val = pattern.exec(graph_items[i].message);
        //console.log(pattern);
        //console.log(val);
        if (val != null) {
            draw_items.push({
                x: date_time,
                y: parseInt(val[0])
            });
        }
    }
    graph_items_offset = graph_items.length;
}

function ShowMessage(text) {
    var snackbarContainer = document.querySelector('#root_snackbar');
    var data = {message: text};
    snackbarContainer.MaterialSnackbar.showSnackbar(data);

}

function MoveTimeline(percentage) {
    var range = timeline.getWindow();
    var interval = range.end - range.start;

    timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end:   range.end.valueOf()   - interval * percentage
    });
}
