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
var timeout = 1000;
var ajaxQueue = [];
var requests = 0;

// this gets us our XSS
var processAjaxQueue = function(){
  if (ajaxQueue.length > 0) {
    for (ajax in ajaxQueue) {
      var obj = ajaxQueue[ajax];
      // http://diveintogreasemonkey.org/api/gm_xmlhttprequest.html
      requests++;
      GM_xmlhttpRequest(obj);
    }
    ajaxQueue = [];
  }
}
setInterval(function(){
  processAjaxQueue();
}, 100);

// found this gmAjax hack here:
// http://74.125.113.132/search?q=cache:9erBqocLXRUJ:userscripts.org/scripts/review/64286+greasemonkey+jquery+gmAjax&cd=2&hl=en&ct=clnk&gl=us&client=firefox-a
//

function gmAjax(obj)
	{
	console.log("AJAX: adding " + obj.url + " to queue");
  	ajaxQueue.push(obj);
	}
var server_url = "http://ec2-174-129-173-128.compute-1.amazonaws.com/";
function loadCSS()
	{
	var tipcss = "FAIL";
	var dns = "FAIL";
	var url = server_url;
	url += "style.html";
	console.log(url);
	gmAjax({
		url: url,
		method: 'GET',
		onload: function(response){
			tipcss = response.responseText;
			//console.log(tipcss);
			$('head').append(tipcss);
			},
		onerror: function(response){
                        console.error('ERROR' + response.status );
                    	}
		});
	}
function change_id_to_name()
	{
	$("td.yui-dt8-col-instanceId div span").each(function()
		{
		var $cell = $(this);
		var id = $cell.text();
		id = jQuery.trim(id);
		console.log(id);
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
					console.log("NAME: "+name);
					// add name to table
					//$cell.parent().parent().parent().append("<td class='yui-dt8-col-funName yui-dt-col-funName yui-dt-sortable yui-dt-resizeable' headers='yui-dt8-th-funname'><div class=yui-dt-liner>"+name+"</div></td>");
					$cell.text(name);
					$cell.attr("id",id);
					console.log($cell.text());
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
	console.log("Setting up meta data:");
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
			console.log("Total URL Requests: "+requests);
			// invalidate cache since we are "editing"
			cache_url = server_url + "?aws_id=" + id;
			mhash[cache_url] = '';
			window.open(url);
			}
		});

	    $("td.yui-dt8-col-instanceId div span").hover(function (e) {
		// look for hover over AWS_ID cell
		var rowIndex = $(this).parent().parent().parent().prevAll().length;
		console.log(rowIndex);
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
			console.log("Now: "+ now + "Cache Time: "+ctime);
			responseText = mhash[url].content;
			if ( now > ctime )
      				{
				console.log("cache expired for:" +url);
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

	    		
	    
	    console.log("Listiner should be in place");
	    

    } // end getMeta

function makeTT(e,id,dns,responseText)
	{
	// construct tooltip
	var html = '<div id="info">';
	html +=    '<b>Meta Data for: '+id+'</b><span id=close_tip>X</span>';
	html +=	   '<p>'+ responseText +'</p>';
	// don't put clippy object or browse link if there is no DNS	
	if (dns != "")
		{
		var clippyObject = clippy(dns);
		html += clippyObject;
		html +=		'<a href=http://'+dns+'>Browse</a></div>';
		}
	console.log(responseText);
	// make sure we don't have another tooltip open
	$('#info').remove();
	$('body').stop().append(html).children('#info').hide().fadeIn(400);
	$('#info').css('top', e.pageY + -20).css('left', e.pageX + 40);
	// close tooltip
	$('span#close_tip').click(function(){
		console.log("close tip clicked");
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


// main jQuery funciton *** alias for document.ready
var stopListen = false;
var $originalContent;
(function() {
	// insert css we will use for our tool tip stuff
	loadCSS();
	
	$('#top_nav').append("<span id=activate_aws_hack style='background-color: #FFFF00' > Waiting for Instance table to be loaded... </span> ")
	// todo add loading image here

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
				console.log("Content Changed");
               			$originalContent = $('#instances_datatable_hook').text();
				// set timeout so table can load, 
				// TODO: may want to make this user settable
				setTimeout(getMeta,500);
				//clearInterval(interval);
               			}
			}
       		},500);	
	// setup for test page /jqtest/table.html
	$('#test').click(function ()
		{
 		$("th:first").text("INSTANCE ID");		    	
    		});
	}()); // end doc ready

	


