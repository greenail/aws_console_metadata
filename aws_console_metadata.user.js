// ==UserScript==
// @name           aws_console_metadata
// @namespace      stink.net/aws
// @description    a hack for meta info in console
// @include        https://console.aws.amazon.com/*
// @exclude        
// @require       http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==
//
//Copyright (c) 2010, Jesse Schoch
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
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

var mhash = new Object();

// need a load defaults method
var timeout = 2000;
var table_load_timeout = 500;
var changeNames = true;
var debug = false;
var showLog = false;
var ajaxQueue = [];
var requests = 0;
var username;
var password;
var json = new Object();
json.name;
json.description = "<span class=rl-folink id=edit>Click here to Enter Meta Information</span>";
var edit_form = "Server Error";
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
var server_url = "http://ec2-174-129-173-128.compute-1.amazonaws.com:8080/";
//var server_url = "http://localhost/";
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
function loadEditForm()
	{
	edit_form = "FAIL";
	var url = server_url;
	url += "edit.html";
	l(url,1);
	gmAjax({
		url: url,
		method: 'GET',
		onload: function(response){
			edit_form = response.responseText;
			l(edit_form);
			//$('body').append(edit_form);
			//$('#edit_form').hide();
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
			if (GM_getValue("username"))
				{
				//username = 	GM_getValue("username");
				$('#username').val(username);
				}
			if (GM_getValue("password"))
				{
				//password = GM_getValue("password");
				$('#password').val(password);	
				}
			
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
			$('#login').click(do_login);
			
			},
		onerror: function(response){
                        console.error('ERROR' + response.status );
                    	}
		});
	}
function do_login(){
	if (username != $('#username').val() && password != $('#password').val())
		{
		username = $('#username').val();
		password = $('#password').val();
		GM_setValue("username", username);
		GM_setValue("password", password);	
		}
	if (GM_getValue("username"))
		{
		username = 	GM_getValue("username");
		$('#username').val(username);
		}
	if (GM_getValue("password"))
		{
		password = GM_getValue("password");
		$('#password').val(password);	
		}
	
	url = server_url;
	url += "login";
	l("u&p" + username + " : " + password)
	gmAjax({
		url: url,
		method: 'POST',
		data: "_method=PUT&login=" + username + "&password=" + password,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload: function(response){
			l("login did not throw error");
			if (response.responseText.search('please login') != -1)
				{
				alert("Please enter your username and password!");
				l(response.responseText)
				$('#options').show();
				}
			else
				{
				alert("server may be down: "+e.description);
				}
		},
		onerror: function(response){
			console.error('ERROR' + response.status);
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
		var name = "error";
		
		url = server_url;
		url += "t_ms/?aws_id=" + id + "&getName=1";
		gmAjax({
			url: url,
			method: 'GET',
			onload: function(response)
				{
				//name = response.responseText;
				data = response.responseText;
				if (data != null) 
					{
					try {
						t_json = JSON.parse(data);
						if (t_json != null)
							{
							json = t_json;
							}
						name = json.name;
						} 
					catch (e) {
						if (response.responseText.search('please login') != -1) {
							alert("Please enter your username and password! " + e.description);
							l(response.responseText);
							$('#options').show();
						}
						else {
							//alert("server may be down: " + e.description);
							l("Server ERROR requesting meta info for aws_id: "+id)
							}
						}
					}
				//description = json.description;
				if (name.search('error') == -1)
					{
					stopListen = true;
					l("NAME: "+name,1);
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
			}); // end ajax
		
		}); // end each
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
		ready_btn = "<img src='cooltext446144499.png' onmouseover=\"this.src='cooltext446144499MouseOver.png';\" onmouseout=\"this.src='cooltext446144499.png';\" />"
		$('#top_nav span#activate_aws_hack').html(ready_btn+'<span id=toggleOptions class=r-folink>Options</span></span>'); 
		$('#toggleOptions').click(function ()
				{
				//l("toggled!");
				$('#options').toggle();
				});
		// Set listener for <ctrl> + click so we can edit our meta data
		$("td.yui-dt8-col-instanceId div span").click(function (c) {
			if (c.ctrlKey)
				{
				//window.open(href, windowName, useParams);	
				var id = getAWS_ID($(this));
				url = server_url;
				url += "t_ms/?aws_id=" + id;
				l("Total URL Requests: "+requests,1);
				// invalidate cache since we are "editing"
				cache_url = server_url + "t_ms/?aws_id=" + id;
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
		var aws_id = getAWS_ID($(this));
		// construct url for ajax	
		var url = server_url;
		url += 't_ms/?aws_id='+aws_id;
		// check cache for result var timeout is caching time in milliseconds
		var responseText = "FAIL";
		if (mhash[url])
			{
  			var now =  new Date().getTime();
			var ctime = mhash[url].time + timeout;
			l("Now: "+ now + "Cache Time: "+ctime,l);
			json = mhash[url].content;
			if ( now > ctime )
      				{
				l("cache expired for:" +url,1);
				mhash[url] = '';
				// this is the old result, need to get a fresh one!
				makeTT(e,dns,json);
				}
			else
				{
				json = mhash[url].content;
				//responseText += " C";
				makeTT(e,dns,json);
				}
			}
		else
			{
			gmAjax({
				url: url,
				method: 'GET',
				onload: function(response){
					responseText = response.responseText;
					data = response.responseText;
					t_json = JSON.parse(data);
					if (t_json != null)
						{
						json = t_json;
						}
					if (json.name) {
						mhash[url] = new Object();
						mhash[url].content = json;
						mhash[url].time = new Date().getTime();
						makeTT(e, dns, json);
						}
					else
						{
						json.aws_id = aws_id;
						//json.description = "Server may be down, or your username/password may be wrong";
						makeTT(e, dns, json);	
						}
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

// make tool tip
function makeTT(e,dns,json)
	{
	// construct tooltip
	l("in makeTT ");
	id = json.id;
	aws_id = json.aws_id;
	
	var html = '<div id="meta-info">';
	html +=    '<b>Meta Data for: '+aws_id+'</b><span id=close_tip class=folink>X</span>';
	html +=	   '<p>'+ json.name +'</p>';
	html +=	   '<p>'+ json.description +'</p>';
	html +=	   '<p>'+ json.id +'</p>';
	// don't put clippy object or browse link if there is no DNS	
	if (dns != "")
		{
		var clippyObject = clippy(dns);
		html += clippyObject;
		html +=		'<a href=http://'+dns+'>Browse</a>';
		}
	html += '</div>'
	// make sure we don't have another tooltip open
	$('#meta-info').remove();
	$('body').stop().append(html).children('#meta-info').hide().fadeIn(400);
	$('#meta-info').css('top', e.pageY + -20).css('left', e.pageX + 40);
	// close tooltip
	$('span#close_tip').click(function(){
		l(" --close tip clicked-- ");
		$('#meta-info').remove();
		});
	
	// setup editing
	$('#edit').click(function(){
		$('#meta-info').html(edit_form);
		$('#edit_form_submit').click(function(){
			json.name = $('#edit_form_name').val();
			json.description = $('#edit_form_description').val();
			updateMeta(json);
			});
		});
	} // end makeTT (make tooltip)
function updateMeta(json)
	{
	url = server_url;
	url += "t_ms?edit=1&name=" + json.name + "&description=" + json.description + "&fuckyou="+json.id+"&aws_id="+json.aws_id;
	gmAjax({
		url: url,
		method: 'GET',
		//data: "edit=1&name=" + json.name + "&description=" + json.description + "&fuckyou="+json.id+"&aws_id="+json.aws_id,
		
		onload: function(response){
			l(response.responseText);
			
		},
		onerror: function(response){
			console.error('ERROR' + response.status);
			}
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
	// grab edit meta form
	loadEditForm();
	// add navivation
	$('#top_nav').append('<div id=mytop_nav><span id=activate_aws_hack > <img src='+server_url+'waiting.gif> <span id=toggleOptions class=r-folink>Options</span></span><div>')
	$('body').append('<div id=mylog>Log: <br/><a href="#" id=clearLog>Clear the Log</a><hr /><div id=logtext>');
	$('#mylog').hide();
	do_login();
	
	// load our options html from the server
	loadOptions();
	
	
	
	// This is for our log hack.	
	
	$('#clearLog').click(function(){
		$('#logtext').text(" ");
	});
	
	// Listener for instance table changes
	var interval;
	$originalContent = $('#instances_datatable_hook').text();
	interval = setInterval(function(){
		// if we are changing content ignore the changes
		if (stopListen) {
			//$originalContent = $('#instances_datatable_hook').text();
		}
		else {
			if ($originalContent != $('#instances_datatable_hook').text()) {
				l(" --Content Changed-- ");
				$originalContent = $('#instances_datatable_hook').text();
				// set timeout so table can load, 
				// TODO: may want to make this user settable
				setTimeout(getMeta, table_load_timeout);
				//clearInterval(interval);
			}
		}
	}, 500);
	// setup for test page /jqtest/table.html
	$('#test').click(function(){
		$("th:first").text("INSTANCE ID");
		//setTimeout('th.toggle()',200);
	});
	}()); // end doc ready

	


