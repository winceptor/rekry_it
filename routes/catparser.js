var router = require('express').Router();



var gethtmlfor = function(tag, tagcontent, last)
{
	var htmlcode = "";
	var action = false;
	if (tag =="noparse")
	{
		htmlcode = tagcontent;
	}
	if (tag =="autoparse")
	{
		var pattern1 = /\.mp3|\.wav|\.ogg|dl\.my\-hit\.com\//i;
		var pattern2 = /\.mp4|\.webm|\.webp|\.mkv|\.avi|\.m3u8/i;
		var pattern3 = /\.png|\.jpg|\.jpeg|\.gif|\.apng|\.steamusercontent\.com\/ugc\//i;
		var pattern4 = /\.swf|\.flv/i;
		var pattern5 = /www\.youtube\.com\/watch\?/ig;
		var pattern6 = /soundcloud\.com/ig;
		var result1 = tagcontent.match(pattern1);
		var result2 = tagcontent.match(pattern2);
		var result3 = tagcontent.match(pattern3);
		var result4 = tagcontent.match(pattern4);
		var result5 = tagcontent.match(pattern5);
		var result6 = tagcontent.match(pattern6);
		if (result1)
		{
			tag = "audio";
		}
		else if (result2)
		{
			tag = "video";
		}
		else if (result3)
		{
			tag = "image";
		}
		else if (result4)
		{
			tag = "flash";
		}
		else if (result5)
		{
			tag = "media";
		}
		else if (result6)
		{
			tag = "sc";
		}
		else
		{
			//console.log("tagcontent:" + tagcontent);
			tag = "url";
		}
	}
	if (tag =="url")
	{
		var urlname = tagcontent;
		
		var nameparts = tagcontent.split("#");
		
		var cleanurl = nameparts[0].split("?")[0];
		
		if (cleanurl.slice(-1)=="/")
		{
			cleanurl = cleanurl.slice(0, -1);
		}
		
		var protocolparts = cleanurl.split("://");
		
		if (protocolparts.length>1)
		{
			cleanurl = protocolparts[1];
		}
		
		var urlparts = cleanurl.split("/");
		
		if (nameparts.length>1 && nameparts[1].length>0)
		{
			urlname = nameparts[1].replace(/_/g, ' ');
		}
		else
		{
			//urlname = urlparts[urlparts.length-1];
			urlname = cleanurl;
		}
		if (urlname.length==0)
		{
			urlname = cleanurl;
		}

		htmlcode = '<a class="link" href="' + tagcontent + '" target="_blank">' + urlname + '</a>';
	}
	if (tag =="video" || tag =="vid" || tag =="webm" || tag =="audio" || tag =="track" || tag =="img" || tag =="image" || tag =="media" || tag =="flash" || tag =="sc")
	{
		if (tag =="webm" || tag =="vid" || tag =="video")
		{
			htmlcode = '<div class="wrappercontent embed" ><video controls loop src="' + tagcontent + '">Your browser does not support the video tag.</video></div>';
		}
		if (tag =="audio" || tag =="track")
		{
			htmlcode = '<div class="wrappercontent" ><audio controls loop width="640" src="' + tagcontent + '">Your browser does not support the audio tag.</audio></div>';
		}
		if (tag =="media")
		{
			var embedurl = tagcontent.split("v=");
			htmlcode = "Error parsing youtube link.";
			if (embedurl[1])
			{
				var embedparts = embedurl[1].split("&");
				var embedv = embedparts[0];
				embedparts.shift();
				embedurl = embedparts.join("&");
				if (embedparts.length>0)
				{
					embedparts = "&" + embedparts;
				}

				if (embedv)
				{
					htmlcode = '<div class="wrappercontent embed"><iframe src="http://www.youtube.com/embed/' + embedv + '?autoplay=0' + embedparts + '" allowfullscreen></iframe></div>';
				}
			}
		}
		if (tag =="flash")
		{
			var embedurl = tagcontent.split(".swf");
			htmlcode = "Error parsing flash link.";
			if (embedurl[0])
			{
				action = '<div class="wrappercontent embed" ><object type="application/x-shockwave-flash" data="' + embedurl[0] + '.swf" width="100%" height="100%"><param name="movie" value="' + embedurl[0] + '.swf" /><param name="quality" value="high"/></object></div>';
			}
		}
		
		if (tag =="sc")
		{
			var soundcloud = tagcontent;
			tagcontent = soundcloud;
			if (tagcontent.length>0)
			{
				var scurl = 'http://api.soundcloud.com/resolve.json?url=' + soundcloud + '&client_id=386b66fb8e6e68704b52ab59edcdccc6';
			
				action = '<div class="wrappercontent soundcloud" >' + scurl + '</div></div>';
			}
		}
		
		if (tag =="img" || tag =="image")
		{
			htmlcode = "<img src='" + tagcontent + "' class='expandedimage' alt='" + tagcontent + "' >";
		}
		if (action)
		{
			htmlcode = "<div class='wrapper'><button class='unwrapper' action='" + action + "' ><span class='buttontext'>" + tagcontent + "</span></button></div>";
		}
		else
		{
			htmlcode = "<div class='wrapper'>" + htmlcode + "</div>";
		}
	}
	if (htmlcode.length<1)
	{
		htmlcode = "[" + tag + "]" + tagcontent;
		if (!last)
		{
			htmlcode += "[/" + tag + "]";
		}
	}

	return htmlcode;
}

var ImageExist = function(url) 
{
   var img = new Image();
   img.src = url;
   return img.height != 0;
}



var parsecontent = function(textcontent)
{	

	var splitter = textcontent.split("]");
	
	var beforetags = "";
	var parsed = "";
	var aftertags = splitter[splitter.length-1];
	
	if (splitter.length>1)
	{
		splitter.pop();
		if (splitter) {
			var lastsplit = splitter[splitter.length-1];
			var toparse = splitter.join("]");
			var tagnamesplitter = toparse.split("[/");
			if (tagnamesplitter.length>1) {
				var tagname = tagnamesplitter[tagnamesplitter.length-1];
				tagnamesplitter.pop()
				if (tagnamesplitter)
				{
					var inparse = tagnamesplitter.join("[/");
					var tag = "["+tagname+"]";
					var tagcontentparts = inparse.split(tag);
					if (tagcontentparts.length>1) {
						var tagcontent = tagcontentparts[tagcontentparts.length-1];
						tagcontentparts.pop();
						parsed = gethtmlfor(tagname, tagcontent);
						if (tagcontentparts)
						{
							beforetags = parsecontent(tagcontentparts.join(tag));	
						}
					}
					else
					{
						parsed = inparse + "[/";
					}
				}
			}
			else
			{
				parsed = toparse + "]";
			}
		}
	}
	else
	{
		parsed = "";
	}
	
	return beforetags + parsed + parsetext(aftertags);
}

	
var parsetext = function(input) {
	var textlines = input.split(/\r\n|\r|\n/g);
	
	for (v in textlines)
	{
		var textline = textlines[v];
		
		var textstrings = textline.split(" ");
		
		for (k in textstrings)
		{
			var textstring = textstrings[k];
			var linksplitter = textstring.split("://");
			if (linksplitter.length>1)
			{
				var protocol = linksplitter[0];
				var tagcontent = linksplitter[1];
				var html = gethtmlfor("autoparse", protocol + "://" + tagcontent);
				textstrings[k] = html;
			}
			
		}
		
		textlines[v] = textstrings.join(" ");
	}
	var output = textlines.join("<br>");

	return output;
}

var parsemessage = function(message)
{
	var parsedmessage = parsecontent(message);
	return parsedmessage || "";
}

/*
var parsemessage0 = function(message)
{
	var parsedmessage = "";
	var toparsemessage = message;

	while(toparsemessage)
	{
		var splitter = toparsemessage.split("[");
		
		var text = splitter[0];
		
		var parsedlinktext = "";
		
		var textlines = text.split(/\r\n|\r|\n/g);
		
		for (k in textlines)
		{
			var toparselinktext = textlines[k];
			var parsedline = "";
		
			while(toparselinktext)
			{
				var splitter2 = toparselinktext.split("://");
				var linktext = splitter2[0];
				var splitter3 = linktext.split(" ");

				splitter2.shift();
				toparselinktext = splitter2.join("://");
				
				var htmlparse = "";
				if (toparselinktext)
				{
					var protocol = splitter3[splitter3.length-1];
					
					splitter3.pop()
					linktext = splitter3.join(" ") + " ";
					
					splitter2 = toparselinktext.split(" ");
					var tagcontent = splitter2[0];
					splitter2.shift();
					toparselinktext = " " + splitter2.join(" ");
					htmlparse = protocol + "://" + tagcontent;
					htmlparse = gethtmlfor("autoparse",htmlparse);
				}
				
				parsedline += linktext + htmlparse;
			}
			parsedlinktext += parsedline;
			parsedlinktext += "<br>";
		}	
		
		parsedmessage = parsedmessage + parsedlinktext;
		splitter.shift();
		toparsemessage = splitter.join("[");
		
		if (toparsemessage)
		{
			var toparsemessagefallback = toparsemessage;
			splitter = toparsemessage.split("]");
			
			var tag = splitter[0];
			splitter.shift();
			toparsemessage = splitter.join("]");
			if (toparsemessage)
			{
				splitter = toparsemessage.split("[/" + tag + "]");
				var tagcontent = splitter[0];
				splitter.shift();
				toparsemessage = splitter.join("[/" + tag + "]");
				parsedmessage = parsedmessage + " " + gethtmlfor(tag,tagcontent,!toparsemessage);
			}
			else
			{
				parsedmessage = parsedmessage + " [" + toparsemessagefallback;
			}
		}
	}
	return parsedmessage;
}
*/

var catparsehelp = "<strong>Most things are parsed automatically! No need for tags, just write the link.<br>When posting links you can append </strong>#link_name_here <strong>to the link.</strong><br><strong>Example:</strong> http://exampleurl.com/somelink#Some_named_link <strong>makes a link with name:</strong> 'Some named link'.<br>";	

var taghelp = {};
taghelp["url"] = "basic link";
taghelp["webm"] = "webm link";
taghelp["vid"] = "video link";
taghelp["video"] = "video link";
taghelp["audio"] = "audio link";
taghelp["media"] = "youtube link";
taghelp["image"] = "image link";
taghelp["img"] = "image link";
taghelp["flash"] = "flash link";
taghelp["sc"] = "soundcloud link";
taghelp["wrap"] = "wrap text";
taghelp["noparse"] = "force unparsed text";

for (var tag in taghelp)
{
	catparsehelp += "<br><b>[" + tag + "]</b> " + taghelp[tag] + " <b>[/" + tag + "]</b>";
}
catparsehelp += "<br>";

router.use(function(req, res, next) {
	res.locals.catparse = parsemessage;
	res.locals.catparsehelp = catparsehelp;
	next();
});

module.exports= router;