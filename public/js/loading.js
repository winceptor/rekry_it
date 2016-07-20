$(document).ready(function(){
	document.getElementById("loadingimage").style.display = "flex";
	$("#loadingimage").fadeOut("slow");
	
	$(window).on('beforeunload', function(){
		$("#loadingimage").fadeIn("slow");
	});
	
});

var showloading = function()
{
	document.getElementById("loadingcontent").className = "loading";
	document.getElementById("loadingimage").className = "loading";
}
window.onbeforeunload = showloading;

var hideloading = function()
{
	document.getElementById("loadingcontent").className = "loaded";
	document.getElementById("loadingimage").className = "loaded";
}
window.onload = hideloading;
	
