$(document).ready(function(){

	setInterval(function(){ 
		var s = $('#trackerlist');
		var e = $("#trackerlist").children().eq(0);
		$(e).fadeOut(3000, function(){
			$(s).append($(e));
			$(e).fadeIn("slow");
		});
		
		
	},1000*15);//15s interval
	
});