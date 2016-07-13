module.exports={
	default_listlimit: 100,
	default_searchlimit: 20,
	
	default_searchquery: "(hidden:false AND displayDate:>now)",
	
	default_sort: "_score:desc",
	sortmethods: ["displayDate:asc","date:asc","date:desc","_score:desc"],
	
	default_language : 'english',
	
	log_filename : 'server.log'
}
