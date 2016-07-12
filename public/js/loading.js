document.write('<style type="text/css">.loading {opacity: 0.5;} #loadingcontent {display: none;} #loadingimage {display: block; position: fixed; height: 100%; width: 100%; z-index: 9999; background-image: url("/loading.svg"); background-repeat: no-repeat; background-position: 50%; top: 0; left: 0;}</style>');
$(document).ready(function(){
	$lc = $("#loadingcontent");
	$li = $("#loadingimage");

	var showloading = function()
	{
		$lc.fadeOut();
		$li.fadeIn('fast');
	}

	window.onbeforeunload = showloading;
	
	$lc.fadeIn('slow', function(){
	})
});
