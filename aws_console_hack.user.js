// ==UserScript==
// @name           aws_console_hack
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
//


var ajaxQueue = [];
var processAjaxQueue = function(){
  if (ajaxQueue.length > 0) {
    for (ajax in ajaxQueue) {
      var obj = ajaxQueue[ajax];
      // http://diveintogreasemonkey.org/api/gm_xmlhttprequest.html
      GM_xmlhttpRequest(obj);
    }
    ajaxQueue = [];
  }
}
setInterval(function(){
  processAjaxQueue();
}, 100);

function gmAjax(obj){
  ajaxQueue.push(obj);
}


(function() {
 	
 	var server_url = "http://ec2-174-129-173-128.compute-1.amazonaws.com/";
 	// insert css we will use for our tool tip stuff
	var tipcss = "FAIL";
	var url = server_url;
	url += "style.html";
	console.log(url);
	gmAjax({
		url: url,
		method: 'GET',
		onload: function(response){
			tipcss = response.responseText;
			console.log(tipcss);
			$('head').append(tipcss);
			},
		onerror: function(response){
                        console.error('ERROR' + response.status );
                    	}
		});
	
 	// insert element we can use to activate our jquery once the instance table loads
	$('#top_nav').append("<span id=activate_aws_hack style='background-color: #FFFF00' > Click Me when Instance List loads to see Meta Data!!! </span> ")
	// listen for hover 
	$('#top_nav span#activate_aws_hack').click( function (c) {
	   $('#top_nav span#activate_aws_hack').text("Meta Hack Activated"); 
	    console.log("Hack Activated");

	    // one liner test for firebug
	    // $("td.yui-dt8-col-instanceId div span").hover(function () {var id = $(this).text();id = jQuery.trim(id);var log = "-- ";log += id;console.log(log);});
	    $("td.yui-dt8-col-instanceId div span").click(function (c) {
		// Set listener for <ctrl> + click so we can edit our meta data
		if (c.ctrlKey)
			{
			//window.open(href, windowName, useParams);	
			var id = $(this).text();
			id = jQuery.trim(id);
			url = server_url;
			url += "dev/edit_dev?aws_id=" + id;
			window.open(url);
			}
		});
	    $("td.yui-dt8-col-instanceId div span").hover(function (e) {
		  
		var id = $(this).text();
		id = jQuery.trim(id);
		var log = "Hovering over Instance ID: ";
		log += id;
		console.log(log);
		

		// found this gmAjax hack here:
		// http://74.125.113.132/search?q=cache:9erBqocLXRUJ:userscripts.org/scripts/review/64286+greasemonkey+jquery+gmAjax&cd=2&hl=en&ct=clnk&gl=us&client=firefox-a
		var url = server_url;
		url += '?aws_id='+id;
		gmAjax({
		
			url: url,
			method: 'GET',
			onload: function(response){
				var responseText = "FAIL";
				responseText = response.responseText;
				var html = '<div id="info">';
				html +=    '<b>Meta Data for: '+id+'</b><span id=close_tip>X</span>';
				html +=	   '<p>'+ responseText +'</p>';
				html +=		'</div>';
				console.log(responseText);
				$('#info').remove();
				$('body').stop().append(html).children('#info').hide().fadeIn(400);
				$('#info').css('top', e.pageY + -20).css('left', e.pageX + 40);
				// close tooltip
				$('span#close_tip').click(function(){
					console.log("close tip clicked");
					$('#info').remove();
					});
				},
			onerror: function(response){
                        	console.error('ERROR' + response.status );
                    		}
			});
	    	}, function(){
			//$('#info').remove();
		}); // end hover

	    		
	    
	    console.log("Listiner should be in place");
	    
	}); // end click

	
}());

