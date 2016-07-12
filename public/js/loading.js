document.write('<style type="text/css">#loadingcontent {display: none;} #loadingimage {display: block; position: fixed; height: 100%; width: 100%; z-index: 9999; background-image: url("/loading.svg"); background-repeat: no-repeat; background-position: 50%; top: 0; left: 0;}</style>');

var showloading = function()
{
	$("#loadingcontent").fadeOut();
	$("#loadingimage").fadeIn('fast');
}

window.onbeforeunload = showloading;
	
$(document).ready(function(){
	$("#loadingcontent").fadeIn('slow');
});
