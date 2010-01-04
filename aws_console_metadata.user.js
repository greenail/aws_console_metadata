// ==UserScript==
// @name           aws_console_metadata
// @namespace      stink.net/aws
// @description    a hack for meta info in console
// @include        https://console.aws.amazon.com/*
// @exclude        
// @require       http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==
//
// TODO
//
// Need to check queue to see if request is already there and not add it if that is the case
// May want to figure out how ppl cache ajax generaly
// Need to add volume data
// Good idea to do js popup instead of full window popup
// Might be cool to setup mimetype for .rdp file and button to launch rdp connection
// Don't add clippy object if there is not DNS
// control pannel items: cache timeout, username/pass
// need to make some buttons

var mhash = new Object();

// need a load defaults method
var timeout = 2000;
var table_load_timeout = 500;
var changeNames = true;
var debug = false;
var showLog = false;
var ajaxQueue = [];
var requests = 0;

// this gets us our XSS
var processAjaxQueue = function(){
  if (ajaxQueue.length > 0) {
    for (ajax in ajaxQueue) {
      var obj = ajaxQueue[ajax];
      // http://diveintogreasemonkey.org/api/gm_xmlhttprequest.html
      requests++;
      $('#totalAjax').text(requests);
      GM_xmlhttpRequest(obj);
    }
    ajaxQueue = [];
  }
}
setInterval(function(){
  processAjaxQueue();
}, 50);

// found this gmAjax hack here:
// http://74.125.113.132/search?q=cache:9erBqocLXRUJ:userscripts.org/scripts/review/64286+greasemonkey+jquery+gmAjax&cd=2&hl=en&ct=clnk&gl=us&client=firefox-a
//

function gmAjax(obj)
	{
	l("AJAX: adding " + obj.url + " to queue",1);
  	ajaxQueue.push(obj);
	}
//var server_url = "http://ec2-174-129-173-128.compute-1.amazonaws.com/";
var server_url = "http://localhost/";
function loadCSS()
	{
	var tipcss = "FAIL";
	var dns = "FAIL";
	var url = server_url;
	url += "style.html";
	l(url,1);
	gmAjax({
		url: url,
		method: 'GET',
		onload: function(response){
			tipcss = response.responseText;
			$('head').append(tipcss);
			},
		onerror: function(response){
                        console.error('ERROR' + response.status );
                    	}
		});
	}
function loadOptions()
	{
	var html = "FAIL";
	var dns = "FAIL";
	var url = server_url;
	url += "options.html";
	l("Options: "+url,1);
	gmAjax({
		url: url,
		method: 'GET',
		onload: function(response){
			html = response.responseText;
			$('body').prepend(html);
			$('#timeout').val(timeout);
			$('#table_load_timeout').val(table_load_timeout);
			$('#options').hide();
			$('#closeOptions').click(function()
				{
				//l("close clicked!",1);
				$('#options').hide();
				});
			$('#toggleOptions').click(function ()
				{
				//l("toggled!");
				$('#options').toggle();
				});
			$('#logToggle').click(function()
				{
				$('#mylog').toggle();	
				l("Log Toggled",1);
				});
			$('#nameToggle').click(function()
				{
				l("Name Toggled",1);
				});
			$('#debugToggle').click(function()
				{
				if (debug == false)
					{
					debug = true;
					}
				else { debug = false;}
				l("Debug Toggled",1);
				});
			$('#optionSubmit').click(function()
				{
				l(" --Submit clicked-- ");
				updateOptions();
				});
			},
		onerror: function(response){
                        console.error('ERROR' + response.status );
                    	}
		});
	}
function updateOptions()
	{
	timeout = $('#timeout').val();
	l("timeout set to: "+timeout,1);

	}
function change_id_to_name()
	{
	if (changeNames)
	{
	$("td.yui-dt8-col-instanceId div span").each(function()
		{
		var $cell = $(this);
		var id = $cell.text();
		id = jQuery.trim(id);
		l(id);
		var name = "fun";
		url = server_url;
		url += "dev/name?aws_id=" + id + "&getName=1";
		gmAjax({
			url: url,
			method: 'GET',
			onload: function(response)
				{
				name = response.responseText;
				if (name.search('error') == -1)
					{
					stopListen = true;
					l("NAME: "+name,1);
					// add name to table
					//$cell.parent().parent().parent().append("<td class='yui-dt8-col-funName yui-dt-col-funName yui-dt-sortable yui-dt-resizeable' headers='yui-dt8-th-funname'><div class=yui-dt-liner>"+name+"</div></td>");
					$cell.text(name);
					$cell.attr("id",id);
					l($cell.text(),1);
					$originalContent = $('#instances_datatable_hook').text();
					stopListen = false;
					}
				},
			onerror: function(response){
                       		console.error('ERROR' + response.status );
                   		}
			});
		});
	}
	}
function getAWS_ID(obj)
	{
	var idattr = obj.attr("id");
	if(idattr)
		{
		return idattr;	
		}
	else
		{
		id = obj.text();
		id = jQuery.trim(id);
		return id;
		}
	}
function getMeta ()
	{
	l("Setting up meta data:",1);
	change_id_to_name();
	$('#top_nav span#activate_aws_hack').text("Meta Hack Activated"); 

	// Set listener for <ctrl> + click so we can edit our meta data
	$("td.yui-dt8-col-instanceId div span").click(function (c) {
		if (c.ctrlKey)
			{
			//window.open(href, windowName, useParams);	
			var id = getAWS_ID($(this));
			url = server_url;
			url += "dev/edit_dev?aws_id=" + id;
			l("Total URL Requests: "+requests,1);
			// invalidate cache since we are "editing"
			cache_url = server_url + "?aws_id=" + id;
			mhash[cache_url] = '';
			window.open(url);
			}
		});

	    $("td.yui-dt8-col-instanceId div span").hover(function (e) {
		// look for hover over AWS_ID cell
		var rowIndex = $(this).parent().parent().parent().prevAll().length;
		l(rowIndex);
		// find public dns
		var $trs = $(this).parent().parent().parent();
		var dns = $trs.children('td.yui-dt8-col-dnsName').text();
		// grab the AWS id in the current cell
		var id = getAWS_ID($(this));
		// construct url for ajax	
		var url = server_url;
		url += '?aws_id='+id;
		// check cache for result var timeout is caching time in milliseconds
		var responseText = "FAIL";
		if (mhash[url])
			{
  			var now =  new Date().getTime();
			var ctime = mhash[url].time + timeout;
			l("Now: "+ now + "Cache Time: "+ctime,l);
			responseText = mhash[url].content;
			if ( now > ctime )
      				{
				l("cache expired for:" +url,1);
				mhash[url] = '';
				// this is the old result, need to get a fresh one!
				makeTT(e,id,dns,responseText);
				}
			else
				{
				responseText = mhash[url].content;
				responseText += " C";
				makeTT(e,id,dns,responseText);
				}
			}
		else
			{
			gmAjax({
				url: url,
				method: 'GET',
				onload: function(response){
					responseText = response.responseText;
					mhash[url] = new Object();
					mhash[url].content = responseText;
					mhash[url].time = new Date().getTime();
					makeTT(e,id,dns,responseText);
					},
				onerror: function(response){
                        		console.error('ERROR' + response.status );
                    			}
			});
			}
	    	}, function(){
			//$('#info').remove();
		}); // end hover

	    		
	    
	    l("Listiner should be in place",1);
	    

    } // end getMeta

function makeTT(e,id,dns,responseText)
	{
	// construct tooltip
	var html = '<div id="info">';
	html +=    '<b>Meta Data for: '+id+'</b><span id=close_tip class=folink>X</span>';
	html +=	   '<p>'+ responseText +'</p>';
	// don't put clippy object or browse link if there is no DNS	
	if (dns != "")
		{
		var clippyObject = clippy(dns);
		html += clippyObject;
		html +=		'<a href=http://'+dns+'>Browse</a></div>';
		}
	//console.log(responseText);
	// make sure we don't have another tooltip open
	$('#info').remove();
	$('body').stop().append(html).children('#info').hide().fadeIn(400);
	$('#info').css('top', e.pageY + -20).css('left', e.pageX + 40);
	// close tooltip
	$('span#close_tip').click(function(){
		l(" --close tip clicked-- ");
		$('#info').remove();
		});
	} // end makeTT (make tooltip)

function clippy(url)
	{
	var clippy = ['<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"',
            'width="110"',
           ' height="14"',
            'id="clippy" >',
    	'<param name="movie" value="'+server_url+'clippy.swf"/>',
    	'<param name="allowScriptAccess" value="always" />',
    	'<param name="quality" value="high" />',
    	'<param name="scale" value="noscale" />',
    	'<param NAME="FlashVars" value="text='+url+'">',
    	'<embed src="'+server_url+'clippy.swf"',
           'width="110"',
           'height="14"',
           'name="clippy"',
           'quality="high"',
           'allowScriptAccess="always"',
           'type="application/x-shockwave-flash"',
           'pluginspage="http://www.macromedia.com/go/getflashplayer"',
           'FlashVars="text='+url+'"',
    	'/>',
	'</object>'].join('');
	
	return clippy;
	}// end clippy
function l (s,newline)
	{
	if (debug)
		{	
		console.log(s);
		$('#logtext').append(s);
		if (newline)
			{
			$('#logtext').append("<br/>")
			}
		return;
		}
	}

// main jQuery funciton *** alias for document.ready
var stopListen = false;
var $originalContent;


(function() {
	// insert css we will use for our tool tip stuff
	loadCSS();
	// add navivation
	$('#top_nav').append("<div id=mytop_nav><span id=activate_aws_hack > Waiting for Instance load... </span> <span id=toggleOptions class=folink>Options</span><div>")
	$('body').append('<div id=mylog>Log: <br/><a href="#" id=clearLog>Clear the Log</a><hr /><div id=logtext>');
	$('#mylog').hide();
	// TODO: add loading image here
	
	// load our options html from the server
	loadOptions();
	
	
	
	// This is for our log hack.	
	
	$('#clearLog').click(function()
		{
		$('#logtext').text(" ");
		});
	
 	// Listener for instance table changes
	var interval;
	$originalContent = $('#instances_datatable_hook').text();
	interval = setInterval(function()
		{
		// if we are changing content ignore the changes
		if (stopListen)
			{
			//$originalContent = $('#instances_datatable_hook').text();
			}
		else
			{
    			if($originalContent != $('#instances_datatable_hook').text()) 
				{
				l(" --Content Changed-- ");
               			$originalContent = $('#instances_datatable_hook').text();
				// set timeout so table can load, 
				// TODO: may want to make this user settable
				setTimeout(getMeta,table_load_timeout);
				//clearInterval(interval);
               			}
			}
       		},500);	
	// setup for test page /jqtest/table.html
	$('#test').click(function ()
		{
 		$("th:first").text("INSTANCE ID");		    	
		//setTimeout('th.toggle()',200);
    		});
	}()); // end doc ready

	


