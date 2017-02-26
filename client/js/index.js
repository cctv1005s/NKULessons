var request = require('request');
var eventproxy = require('eventproxy');
var fs = require('fs');
var path = require('path');

var config_url = "https://coding.net/u/cctv1005s/p/NKULessons/git/raw/master/config.json";
var $body = $('#app-main');

//防止main函数不执行
var _main_second = false;


//请求配置文件
request(config_url,function(err,req,body){
    if(err){
        $body.html("读取配置文件出错，请检查网络或重启程序");
    }
    try{
        initConfig(JSON.parse(body));    
    }catch(e){
        console.log(e);
        $body.html("读取配置文件出错，请检查网络或重启程序");   
    }
    
});

var initConfig = function(config){
    var ep_main = new eventproxy();
    var ep_dep = new eventproxy();

    request(config.index,function(err,req,body){
        ep_main.emit('index',body);
    });

    request(config.main,function(err,req,body){
        ep_main.emit('main',body);
    });

    //保存依赖
    config.dependence.map(function(ele, i){
        request(ele.url,function(err,req,body){
            if(err){
                console.log(err);
            }
            fs.writeFileSync(path.join(__dirname,ele.name),body);
            ep_dep.emit('dep','');
        });
    })

    //主页面和主进程
    ep_main.all('index','main',function(index,main){
        $body.html(index);
        
        setTimeout(function(){
            $("#app-loading").fadeOut('slow');
        },500);

        setTimeout(function(){
            if(!_main_second){
                eval(main);
            }
        },1000);
    });
}



