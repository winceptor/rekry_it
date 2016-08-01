module.exports={
	default_listlimit: 100,
	default_searchlimit: 20,
	resultlimits: [10,20,50,100,250,1000],
	
	default_searchquery: "(hidden:false OR featured:true)",
	
	default_sort: "_score:desc",
	sortmethods: ["displayDate:asc","date:asc","date:desc","_score:desc","views:desc","apps:desc"],
	
	default_language : 'english',
	
	log_filename : 'server.log',
	
	allowed_emailhosts : ["lut.fi","student.lut.fi","student.saimia.fi","saimia.fi"]
}
