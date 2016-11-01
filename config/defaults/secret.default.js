module.exports={	
	//person to notify about crash
	notify_email: "user@email.com",
	notify_name: "Administrator",
	
	//give localhost admin rights always
	localhostadmin : false,
	//give admin rights to anyone when there is 0 admin users
	zeroadmins_unrestricted: true,
	
	//SERVER
	server_port: 80,
	server_sslport: 443,

	//DATABASE
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
	captcha_api: 'https://www.google.com/recaptcha/api/siteverify',
	captcha_sitekey: '',
	captcha_secretkey: ''
}
