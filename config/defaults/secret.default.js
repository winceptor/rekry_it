module.exports={
	localhostadmin : false,
	server_port: 80,
	
	//DATABASE
	//db_database: 'mongodb://root:pass@server.com:8080/directory',
	db_database: 'mongodb://localhost:27017/rekry_it_portal',
	db_secretKey: "password",
	
	//EMAIL
	email_host: 'localhost',
    email_port: 465,
	email_secure: true, // use SSL
	email_user: 'user@email.com',
    email_pass: 'password',
	
	email_sender: 'LUT Collaborative Portal'
}
