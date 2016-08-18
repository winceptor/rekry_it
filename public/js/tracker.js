$(document).ready(function(){
	
	var showseconds = 15;
	var fadeseconds = 3;
	var entries = $('#trackerlist').children().length;
	var refreshseconds = showseconds*entries+fadeseconds;

	setInterval(function(){ 
		var s = $('#trackerlist');
		var e = $("#trackerlist").children().eq(0);
		$(e).fadeOut(1000*fadeseconds, function(){
			$(s).append($(e));
			$(e).fadeIn("slow");
		});
		
		
	},1000*showseconds);//15s interval
	
	setTimeout(function(){ 
		location.reload(true);
	}, 1000*refreshseconds);
	
});