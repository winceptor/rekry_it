var router = require('express').Router();



var gethtmlfor = function(tag, tagcontent, last)
{
	var htmlcode = "";
	var action = false;
	if (tag =="noparse")
	{
		htmlcode = tagcontent;
	}
	if (tag =="sp" || tag=="spoiler")
	{
		tag = "sp";
		htmlcode = '<div class="spoiler">' + tagcontent + '</div>';
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
		htmlcode = '<a class="link" href="' + tagcontent + '" target="_blank">' + tagcontent + '</a>';
	}
	if (tag =="video" || tag =="vid" || tag =="webm" || tag =="audio" || tag =="track" || tag =="img" || tag =="image" || tag =="media" || tag =="flash" || tag =="sc")
	{
		if (tag =="webm" || tag =="vid" || tag =="video")
		{
			htmlcode = tagcontent;
			action = '<div class="faded resize" ><video controls loop autoplay volume=0.5 src="' + tagcontent + '" width="100%" height="100%"></div>';
		}
		if (tag =="audio" || tag =="track")
		{
			htmlcode = '<div class="" ><audio controls loop volume=0.5 width="640" src="' + tagcontent + '"></div>';
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
					htmlcode = '<iframe class="embed faded resize" src="http://www.youtube.com/embed/' + embedv + '?autoplay=0' + embedparts + '" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>';
				}
			}
		}
		if (tag =="flash")
		{
			var embedurl = tagcontent.split(".swf");
			htmlcode = "Error parsing flash link.";
			if (embedurl[0])
			{
				action = '<div class="faded resize" ><object type="application/x-shockwave-flash" data="' + embedurl[0] + '.swf" width="100%" height="100%"><param name="movie" value="' + embedurl[0] + '.swf" /><param name="quality" value="high"/></object></div>';
			}
		}
		
		if (tag =="sc")
		{
			var soundcloud = tagcontent;
			tagcontent = soundcloud;
			if (tagcontent.length>0)
			{
				var scurl = 'http://api.soundcloud.com/resolve.json?url=' + soundcloud + '&client_id=386b66fb8e6e68704b52ab59edcdccc6';
			
				action = '<div class="faded soundcloud" >' + scurl + '</div></div>';
			}
		}
		
		if (tag =="img" || tag =="image")
		{
			htmlcode = "<img src='" + tagcontent + "' class='expandedimage'>";
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

var parsemessage = function(message)
{
	var parsedmessage = "";
	var toparsemessage = message;

	while(toparsemessage)
	{
		var splitter = toparsemessage.split("[");
		
		var text = splitter[0];
		
		var parsedlinktext = "";
		
		var textlines = text.split("\n");
		
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
			parsedlinktext += parsedline + "<br>";
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

var catparsehelp = "<b>Most things are parsed automatically! No need for tags.</b><br>";	

var taghelp = {};
taghelp["url"] = "webm url";
taghelp["webm"] = "webm url";
taghelp["vid"] = "video url";
taghelp["video"] = "video url";
taghelp["audio"] = "audio url";
taghelp["media"] = "youtube url";
taghelp["image"] = "image url";
taghelp["img"] = "image url";
taghelp["flash"] = "flash url";
taghelp["sc"] = "soundcloud url";
taghelp["wrap"] = "wrap text";
taghelp["noparse"] = "unparsed text";

for (var tag in taghelp)
{
	catparsehelp += "<br><b>[" + tag + "]</b> " + taghelp[tag] + " <b>[/" + tag + "]</b>";
}
catparsehelp += "<br><br>";

router.use(function(req, res, next) {
	res.locals.catparse = parsemessage;
	res.locals.catparsehelp = catparsehelp;
	next();
});

module.exports= router;