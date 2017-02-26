var fs = require('fs');
var path = require('path');
var file_dir =  path.join(__dirname,'/user_data.json');
/*读取上一次存储的用户数据*/
exports.readInitData = function(){
    var data = "";
    try{
      data = fs.readFileSync(file_dir);
      data = data.toString();
    }catch(e){
      //初始化数据
      data = {
            stuid:"",
            stupassword:"",
            ids:[]
      };
      data = JSON.stringify(data);
      fs.writeFileSync(file_dir,data);
    }
    
    console.log(data);

    if(data.trim().length == 0){
        return {
            stuid:"",
            stupassword:"",
            ids:[]
      };
    }else{
        data = JSON.parse(data);    
    }
    //
    console.log(data);
    return data;
}

//保存数据
exports.saveData = function(data){
    data = JSON.stringify(data);
    fs.writeFileSync(file_dir,data);
}
