module.exports={
	localhostadmin : false,
	server_port: 80,
	server_sslport: 443,
	server_host: "http://rekry.it.lut.fi",
	
	//DATABASE
	//db_database: 'mongodb://root:pass@server.com:8080/directory',
	db_database: 'mongodb://localhost:27017/rekry_it_portal',
	db_secretKey: "rekryitportal",
	
	//EMAIL
	email_host: 'localhost',
    email_port: 465,
	email_secure: true, // use SSL
	email_user: 'user@email.com',
    email_pass: 'password',
	email_sender: 'LUT Collaborative Portal',
	
	//DEFAULT ADMIN USER (created when users == 0 on load)
	admin_name: 'Admin',
	admin_email: 'admin@rekry.it.lut.fi',
	admin_pass: 'password',
	
	//CAPTCHA INFO
	captcha_sitekey: '',
	captcha_secretkey: ''
}
