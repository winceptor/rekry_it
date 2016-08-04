module.exports={
	//give localhost admin rights always
	localhostadmin : false,
	//give admin rights to anyone when there is 0 admin users
	zeroadmins_unrestricted: true,
	
	server_port: 80,
	server_sslport: 443,
	//server_host: "http://rekry.it.lut.fi",
	
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
	
	//CAPTCHA
	captcha_sitekey: '',
	captcha_secretkey: ''
}
