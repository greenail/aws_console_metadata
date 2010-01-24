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
function setLogin()
	{
	console.log(username+" : "+password)
	GM_setValue("password", password);
	GM_setValue("username", username);
	}
function getLogin()
	{
	username = GM_getValue("username");
	password = GM_getValue("password");
	console.log(username+" : "+password)
	//return u,p;
	}
var username;
var password;
//window.setTimeout(getLogin,10)
getLogin();
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
	var cache = new Cache();
	var edit_form = "";
	var url = server_url;
	var timeout = 500;
	
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
		 $('#top_nav').append('<div id=mytop_nav><span id=activate_aws_hack > <img src='+server_url+'waiting.gif> </span><span id=toggleOptions class=r-folink>Options</span><span id=refresh class=folink>Refresh</span><div>')
 		url += "style.html";
		fetchPage(url,loadCSS);
		url = server_url;
		url += "edit.html";
		fetchPage(url,loadEditForm);
		url = server_url;
		url += "options.html";
		fetchPage(url,loadOptions);
		
		makeTT();
		}
	function fetchPage(url,callback)
		{
		 gmAjax({
			url: url,
			method: 'GET',
			onload: callback,
			onerror: function(response){
			                        alert('Fetch Page ERROR' + response.status );
			                     }
			});
		}
	function loadCSS(response)
		{
		 $('head').append(response.responseText);	
		}
	function loadOptions(response)
		{
		$('body').prepend(response.responseText);
		$('#options').hide();
		// populate preferences
		$('#timeout').val(timeout);	
		getLogin();
		$('#register').html("<a href="+server_url+"people/new/>Register New Account</a>");
		 if (username != undefined)
			{
			//username = GM_getValue("username");
			l("USERNAME: "+username);
			$('#username').val(username);
			}
		if (password != undefined)
			{
			//password = GM_getValue("password");
			l("PASSWORD: "+password);
			$('#password').val(password);
			}
		if (username == undefined)
			{
			$('#options').show();
			alert("Please enter a valid username and password!");
			//return false;
			}
		if (password == undefined)
			{
			$('#options').show();
			alert("Please enter a valid username and password!");
			//return false;
			}
		do_login();
		 $('#closeOptions').click(function()
			{
			//l("close clicked!",1);
			$('#options').hide();
			});
		$('#toggleOptions').click(function ()
			{
			//l("toggled!");
			$('#totalAjax').text(requests);
			$('#options').toggle();
			});
		$('#refresh').click(function ()
			{
			l("refresh!");
			originalContent = "FOOOOOOOOOOOOOOOOO";
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
		$('#regiser').html('<a href='+server_url+'/people/new>Create New Account</a>');
		$('#login').click(function (){
			if ((username != $('#username').val()) || (password != $('#password').val()))
				{
				
				username = $('#username').val();
				password = $('#password').val();
				l("updating username and password"+username +" : "+password,1);
				// hack for stange GM checks...
				window.setTimeout(setLogin,10);
				
				}
			do_login();
			});
		}
	
	function do_login()
		{
		l("Trying to login!");
		url = server_url;
		url += "login";
		 gmAjax({url: url,method: 'PUT',
		 	data: "login=" + username + "&password=" + password,
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
		 	onload: function(response){
				//$('body').append($('body',response.responseText))
				//l(response.responseText);
				if (response.responseText.search('Please Login') != -1)
					{
					alert("invalid username or password!");
					l(username+" : "+password);
					}
				else
					{
					alert("Welcome to Metum!");
					$('#options').hide();
					}
				},
			onerror: handleError
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
		}// end clippy
	function makeTT()
		{
		var html = '<div id="meta-info">';
		html += '<b>Meta Data for: </b><span id=close_tip class=folink>X</span>';
		html += '<p><b>Name: </b></p><hr>';
		html += '<p><b>Description: </b></p>';
		html += '<p></p>';
		html += '</div>';
		$('body').append(html);
		$('#meta-info').hide();	
		}
	function updateTT(e,dns,json)
		{
		// construct tooltip
		
		var html = '<b>Meta Data for: '+json.aws_id+'</b><span id=close_tip class=folink>X</span>';
		html += '<p><b>Name: </b>'+ json.name +'</p><hr>';
		html += '<p><b>Description: </b>'+ json.description +'</p>';
		html += '<p>'+ json.id +'</p>';
		html += '<p><span class=r-folink id=edit>Edit</span>';
		// don't put clippy object or browse link if there is no DNS
		if (dns != "")
			{
			var clippyObject = clippy(dns);
			html += clippyObject;
			html += '<a href=http://'+dns+'>Browse</a>';
			}
		$('#meta-info').css('top', e.pageY + -20).css('left', e.pageX + 40);
		$('#meta-info').html(html);
		$('#edit').attr("json",JSON.stringify(json));
		//$('#meta-info').append("<div id=json>"+JSON.stringify(json)+"</div>");
		// close tooltip
		$('span#close_tip').click(function(){
			l(" --close tip clicked-- ");
			$('#meta-info').hide();
			});
		$('#edit').click(function(){
			json = JSON.parse($('#edit').attr("json"));
			$('#meta-info').html(edit_form);
			$('#edit_form_name').val(json.name);
			editTT(e,json); 
		});
		}
	function editTT(e,json)
		{
		l(JSON.stringify(json));
		l(json.name);
		//if (json.name != undefined)
		if(false)
			{
			//$('input#edit_form_name').val(json.name);
			$('#edit_form_name').attr("value",json.name);
			}
		if(true)
		//if (json.description != undefined)
			{
			$('textarea#edit_form_description').val(json.description);
			}
		$('#meta-info').css('top', e.pageY + -20).css('left', e.pageX + 40);
		
		$('#edit_form_submit').click(function(){
			l("Edit Form Submit Clicked",1);
			json.name = $('#edit_form_name').val();
			json.description = $('#edit_form_description').val();
			json.group = $('#edit_form_group').val();
			//l(JSON.stringify(json));
			sendJSON(json,e);
			});
		} // end makeTT (make tooltip)
	function sendJSON(json,e)
		{
		 url = server_url;
		url += "t_ms/"+json.aws_id;
		 gmAjax({
			url: url,
			method: 'PUT',
			data: JSON.stringify(json),
			onload: function(response){
			l(response.responseText);
			updateTT(e,"",json);
			 
			},
			onerror: function(response){
			console.error('ERROR' + response.status);
			}
			});	
		}	
	function loadEditForm(response)
		{
		edit_form = response.responseText;	
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
		ready();
		
		
		var interval = setInterval(function(){
			monitor_counter ++;
			
			if($("#monitor_counter"))
				{
				$("#monitor_counter span").text(monitor_counter);	
				}
			
			if (originalContent != $(target).text()) 
				{
				notReady(timeout);
				l(" --Content Changed-- ");
				// stop the monitor since we are changing content.
				clearInterval(interval);
				originalContent = $(target).text();
				// show active
				
				
				
				// update names
				setTimeout((function (t,s){return function(){updateNames(t,s);}})(target,selector),timeout);
				}
			},500);
		}
function notReady(timeout)
	{
	$('#top_nav span#activate_aws_hack').html('<img src='+server_url+'waiting.gif><span id=readyCount></span>');
	var $rc = $('#readyCount');
	var tick = timeout / 100;
	var interval = setInterval(function(){
		
		timeout = timeout - tick;
		if (timeout <= 0)
			{
			clearInterval(interval)
			}
		else
			{
			$rc.html(timeout);
			}
			
	},timeout/100);	
	}
function ready()
	{
	//ready_btn = "<img src='"+server_url+"cooltext446144499.png' onmouseover=\"this.src='"
	//	+server_url+"cooltext446144499MouseOver.png';\" onmouseout=\"this.src='"
	//	+server_url+"cooltext446144499.png';\" />"
	ready_btn = "<b>Ready</b>"
	$('#top_nav span#activate_aws_hack').html(ready_btn);	
	}
function updateNames(target,selector)
	{
	var $ids = $(selector);
				
	if ($ids != "") 
		{
		id_count = $ids.length;
		run_count = 0;
		l("Found "+id_count+" IDs with selector: "+selector)
		$ids.each(function(){
			run_count++;
			l("RUN: "+run_count);
			$cell = $(this);
			cell_text = $cell.text();
			if (cell_text.search("X") != -1 || cell_text.search("Y") != -1)
				{
				// TODO make this search a bit more robust.
				l("BIG ERROR: Already changed foolio");
				//setTimeout(function(){},2000);
				monitor(target,selector);
				return false;
				}
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
					l("restarting monitor in 2 seconds");
					setTimeout(function(){monitor(target,selector);},2000);
						
					}
			});
                 }
	else	
		{
		l("ERROR, nothing matched our selector");
		}
	}
			
	function aTest(response)
		{
		l(response.responseText);
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
	function updateCell(response,$cell,url,run_count)
		{
		l("response: Cache Size:"+cache.size+" Run Count: "+run_count+" of: "+id_count);
		l(response.responseText);
		var json = "";
		if (response.responseText) 
			{
			l("SUCCESS");
			try	
				{
				json = JSON.parse(response.responseText);	
				}
			catch(err)
				{
				l("JSON parsing error: "+err.description);
				json = null;	
				}
			
			}
		if (json != null)
			{
			//p("Name: "+json.name);
			l("Name: "+json.name);
			cache.setJSON(url,json);
			changeToName($cell,json);
			}
		else
			{
			// TODO add pretty pic for edit
			var aws_id = getAWS_ID($cell);
			$cell.append(" <span id=editTT class=btn>?</span>");
			$('#editTT',$cell).click(function(event){
				// TODO add call to edit function here.
				json = new Object;
				json.aws_id = aws_id;
				editTT(event,json);
				$('#meta-info').toggle();
				});
			}
		
		}
	function changeToName($cell,json)
		{
		if (!$cell.attr("aws_id"))
			{
			$cell.attr("aws_id",json.aws_id);
			// TODO add nice graphic
			$cell.text(json.name);
			$cell.append(" <span id=toggleTT class=btn>X</span>");
			}
		$('#toggleTT',$cell).click(function(event){
			aws_id = $cell.attr("aws_id");
			updateTT(event,"",json);
			$('#meta-info').toggle();
			});
		 
		}
	
	function handleError(response,statusText)
		{
		alert("http error");
		l(statusText);
		}
	l('starting jQuery');
	
	
	// main 
	setup();
	monitor('#instances_datatable_hook',"td.yui-dt-col-instanceId div span");	
	monitor('#volumes_datatable_hook',"td.yui-dt-col-volumeId div span");
	if(debug)
		{
		if ($('.yui-content'))
			{
			$('.yui-content').append("<span id=monitor_counter>Count: <span>0</span></div>");	
			}
		else
			{
			$('body').append("<span id=monitor_counter>Count: <span>0</span></div>");	
			}
		}	
	l("exit main context");
	// end jQuery
}); 
}, false);


