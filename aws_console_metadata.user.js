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
//

var mhash = new Object();
var timeout = 1000;
var ajaxQueue = [];
var requests = 0;
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


(function() {
 	// Listener for instances table
	var interval;
	$originalContent = $('#instances_datatable_hook').text();
	interval = setInterval(function()
		{
		console.log("testing");
    		if($originalContent != $('#instances_datatable_hook').text()) 
			{
			console.log("Content Changed");
               		$originalContent = $('#instances_datatable_hook').text();
			clearInterval(interval);
               		}
       		},500);	
	 
 	
 	// insert css we will use for our tool tip stuff
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
	
 	// insert element we can use to activate our jquery once the instance table loads
	$('#top_nav').append("<span id=activate_aws_hack style='background-color: #FFFF00' > Click Me when Instance List loads to see Meta Data!!! </span> ")
	// listen for hover 
	//$('#top_nav span#activate_aws_hack').click( function (c) {
	$('#nav_link_19').click(function (c) {
	   $('#top_nav span#activate_aws_hack').text("Meta Hack Activated"); 
		
	    $("td.yui-dt8-col-instanceId div span").click(function (c) {
		// Set listener for <ctrl> + click so we can edit our meta data
		if (c.ctrlKey)
			{
			//window.open(href, windowName, useParams);	
			var id = $(this).text();
			id = jQuery.trim(id);
			url = server_url;
			url += "dev/edit_dev?aws_id=" + id;
			console.log("Total URL Requests: "+requests);
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
		var id = $(this).text();
		id = jQuery.trim(id);
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
	    
	}); // end click
    $('#test').click(function (){
 	$("th:first").text("INSTANCE ID");		    	
    	});
	
}()); // end doc ready
function makeTT(e,id,dns,responseText)
	{
	// construct tooltip
	var html = '<div id="info">';
	html +=    '<b>Meta Data for: '+id+'</b><span id=close_tip>X</span>';
	html +=	   '<p>'+ responseText +'</p>';
	var clippyObject = clippy(dns);
	html += clippyObject;
	if (dns != "")
		{
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
	}

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
	}

