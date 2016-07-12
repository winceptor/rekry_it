$(document).ready(function(){
	document.getElementById("loadingimage").style.display = "block";
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
	document.getElementById("loadingcontent").className = "";
	document.getElementById("loadingimage").className = "";
}
window.onload = hideloading;
	
