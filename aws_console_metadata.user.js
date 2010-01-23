// ==UserScript==
// @name           aws_console_metadata-test
// @namespace      stink.net/aws
// @description    a hack for meta info in console
// @include        https://console.aws.amazon.com/*
// @include		   http://ec2-174-129-173-128.compute-1.amazonaws.com/*
// ==/UserScript==
//
//Copyright (c) 2010, Jesse Schoch
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted povided that the following conditions are met:
//    * Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//    * Neither the name of the <organization> nor the
//      names of its contributors may be used to endorse or promote products
//      derived from this software without specific prior written permission.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
//ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//DISCLAIMED. IN NO EVENT SHALL Jesse Schoch BE LIABLE FOR ANY
//DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
//SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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
// Need to add server DNS to options.
// Need to implement caching in the gmAjax function, also need to cache the first request
// Add refresh button to tool tip and remove cache timeout
var ajaxQueue = [];
var requests = 0;
var processAjaxQueue = function(){
  if (ajaxQueue.length > 0) {
    for (ajax in ajaxQueue) {
      var obj = ajaxQueue[ajax];
      // http://diveintogreasemonkey.org/api/gm_xmlhttprequest.html
      requests++;
      //$('#totalAjax').text(requests);
      GM_xmlhttpRequest(obj);
    }
    ajaxQueue = [];
  }
}
setInterval(function(){
  processAjaxQueue();
}, 50);

function gmAjax(obj)
	{
	ajaxQueue.push(obj);
	}
// start jQuery Setup
//alert("FOOOO");
var script = document.createElement('script');
script.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.js';
document.getElementsByTagName('head')[0].appendChild(script);
// When jQuery is loaded
script.addEventListener('load', function(){ 
  jQuery = unsafeWindow['jQuery'];
  jQuery.noConflict();

jQuery(document).ready(function($){
	// start jQuery
	
	// setup variables
	var cache = new Object;
	var debug = true;
	var server_url = "http://ec2-174-129-173-128.compute-1.amazonaws.com:80/";
	
	// setup log
	logTarget = $('#yui-layout-bd');
	if (logTarget == null)
		{
		$('body').append("LOG: <BR/>");
		logTarget.append("<div id=logText>Log: <br/><div>");
		}
	else
		{
		$('body').append("<div id=logText>Log: <br/><div>");	
		}
	
	log = $('#logText'); 
	function l(text)
		{
		if(debug)
			{
			//console.log(text);
			if(unsafeWindow.console != undefined)
				{
				unsafeWindow.console.log(text)	
				}
			
			//log.append(text+'<br/>');	
			}
			
		}
	function p(text)
		{
		if(debug)
			{
			$('#logText').append(text);
			}
			
		}
	// end log
	function setup()
		{
		var test_counter = 0;
		$('#instances').click(function()
			{
			$("#instances_datatable_hook th").text("INSTANCE ID"+test_counter);
			//$("#volumes_datatable_hook th").text("xxxxx"+test_counter);
			test_counter++;
			});
		$('#volumes').click(function()
			{
			//$("#instances_datatable_hook th").text("INSTANCE ID"+test_counter);
			$("#volumes_datatable_hook th").text("xxxxx"+test_counter);
			test_counter++;
			});		
		
		}
	function getAWS_ID(obj)
		{
		var idattr = obj.attr("aws_id");
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
	function monitor(target,selector)
		{
		l("starting Monitor for: "+target+" and: "+selector);
		var monitor_counter = 0;
		var originalContent = $(target).text();
		var stopListen = false;
		
		
		var interval = setInterval(function(){
			monitor_counter ++;
			
			if($("#monitor_counter"))
				{
				$("#monitor_counter span").text(monitor_counter);	
				}
			
			if (originalContent != $(target).text()) 
				{
				l(" --Content Changed-- ");
				// stop the monitor since we are changing content.
				clearInterval(interval);
				originalContent = $(target).text();
				var $ids = $(selector);
				addCellClick($ids);
				if ($ids != "") 
					{
					id_count = $ids.length;
					run_count = 0;
					$ids.each(function(){
						run_count++;
						$cell = $(this);
						var url = server_url;
						var aws_id = getAWS_ID($(this));
						url += 't_ms?aws_id='+aws_id;
						l(url);
						var json = false;
						
						if(cache.getJSON(url))
							{
							json = cache.getJSON(url);
							l("Cached Name:"+json.name);
							changeToName($cell,json);
										
							}
						else	
							{
							gmAjax({url: url,method: 'GET',
								//onload: function(response){updateCell(response,url,$cell,target,selector,run_count);} ,
								//onload: (function(response){l(run_count+" "+response.responseText);})(run_count),
								onload: (function (count,mcell,murl){return function (response) {updateCell(response,mcell,murl,count);};})(run_count,$cell,url),
								onerror: function(response,statusText){handleError(response,statusText);}});
							}
						// this sets the timeout for all async to finish loading.
						if (run_count == id_count)
								{
								setTimeout(function(){monitor(target,selector);},2000);	
								}
						});
                    }
				}
			},200);
		}
	function aTest(response)
		{
		l(response.responseText);
		}
	function addCellClick($ids)
		{
		// add click handler using event delegation
		$ids.each(function (){
			var cell = $(this);
			if (!cell.attr("aws_id"))
				{
				cell.click(function(event){
					//$clicked = $(this);
					aws_id = $(this).attr("aws_id");
					alert("AWS_ID: "+ aws_id);
					});
				}
			});
		}
	function Cache()
		{
		var c = new Object;
		var csize = 0;
		this.getJSON = function(url)
			{
			if (c[url])
				{
				l("CACHE HIT");
				return c[url];
				}
			else
				{
				l("CACHE MISS");
				return false;
				}
			}	
		this.setJSON = function(url,json)
			{
			csize++;
			l("set CACHE: "+url+ " "+json.name);
			c[url] = json;	
			}
		this.size
			{
			return csize;	
			}
		}
	function updateCell(response,cell,url,run_count)
		{
		l("response: Cache Size:"+cache.size+" Run Count: "+run_count+" of: "+id_count);
		l(response.responseText);
		var json = "";
		if (response.responseText) 
			{
			l("SUCCESS");
			json = JSON.parse(response.responseText);
			}
		if (json != null)
			{
			//p("Name: "+json.name);
			l("Name: "+json.name);
			cache.setJSON(url,json);
			changeToName(cell,json);
			}
		
		}
	function changeToName($cell,json)
		{
		if (!$cell.attr("aws_id"))
			{
			$cell.attr("aws_id",json.aws_id)
			$cell.text(json.name);	
			}
		 
		}
	
	function handleError(response,statusText)
		{
		l(statusText);
		}
	l('starting jQuery');
	var cache = new Cache();
	// main 
	setup();
	monitor('#instances_datatable_hook',"td.yui-dt-col-instanceId div span");	
	monitor('#volumes_datatable_hook',"td.yui-dt-col-volumeId div span");
	$('body').append("<span id=monitor_counter>Count: <span>0</span></div>");
	l("exit main context");
	// end jQuery
}); 
}, false);


