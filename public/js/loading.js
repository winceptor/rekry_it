$(document).ready(function(){
	var spinner = document.getElementById("loadingimage");
	if (spinner)
	{
		spinner.style.display = "flex";
		//$(spinner).fadeOut("slow");
	}

	
	$(window).on('beforeunload', function(){
		$("#loadingimage").fadeIn("slow");
	});
	
});

var showloading = function()
{
	document.getElementById("loadingcontent").className = "loading";
	var spinner = document.getElementById("loadingimage");
	if (spinner)
	{
		document.getElementById("loadingimage").className = "loading";
	}
}
window.onbeforeunload = showloading;

var hideloading = function()
{
	document.getElementById("loadingcontent").className = "loaded";
	var spinner = document.getElementById("loadingimage");
	if (spinner)
	{
		document.getElementById("loadingimage").className = "loaded";
	}
}
window.onload = hideloading;
	
