$(document).ready(function(){
	$(document).on('click', '.unwrapper', function() {
		if ($(this).prop("open")!="true")
		{
			$(this).prop("open","true");
			
			var wrapper  = $(this).parent();

			$(wrapper).append($(this).attr("action"));
			var content = $(wrapper).children(".wrappercontent")[0];
			$(content).hide();
			$(content).fadeIn('fast', function(){
				if ($(content).hasClass("soundcloud"))
				{
					var apiurl = $(content).text();
					$.ajax({
						url: apiurl,
						dataType: 'json',
						success: function(result) {
						   var newcontent = '<iframe width="500" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + result.uri + '&amp;color=ff5500&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false"></iframe>';
						   $(content).html(newcontent);
						}
					});
				}
			});
		}
		else
		{
			var wrapper  = $(this).parent();
			var content = $(wrapper).children(".wrappercontent")[0];
			$(this).prop( "open", "false" );
			$(content).fadeOut('fast', function(){
					$(content).remove();
			});
		}
	});
	
	$(document).on('click', '.resizeable', function() {
		if ($(this).prop("open")!="true")
		{
			$(this).prop("open","true");
			$(this).addClass( "expandedimage" );
			$(this).removeClass( "thumbnail" );
			
			$(this).hide();
			$(this).fadeIn('fast', function(){
				//huh
			})
		}
		else
		{
			$(this).fadeOut('fast', function(){
				$(this).prop( "open", "false" );
				$(this).addClass( "thumbnail" );
				$(this).removeClass( "expandedimage" );
				$(this).show();
			});
		}
	});
	
	var playpause = function(obj)
	{
		obj.paused?obj.play():obj.pause();
	}
	$(document).on('click', 'video', function(){playpause(this)});
	$(document).on('click', 'audio', function(){playpause(this)});
});