const utils = require("./utils");

async function login(response) {
  table_name = response.table;
  
  // check if user exist data in data base
  var auth_method = response.auth_method
  var auth_type = 'email'
  if(response.password === " "){
    auth_type='child_code'
    auth_method=response.auth_method
    table_name="child";
  }
  var login_res = await utils.user_utils.getuserData({auth_method:auth_method,type:auth_type},table_name, response.password);
  if (login_res.result === null) {
      return login_res;
  }
  if (login_res.result!==null){
    login_res.details = {
      success: true,
      message: "Welcome back " + auth_method
    };
  }

  return login_res;
}

exports.login = login;
