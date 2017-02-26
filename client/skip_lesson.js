var request = require('request')
var fs = require('fs');
var cheerio = require('cheerio');
var _jar  = request.jar();
request = request.defaults({jar:_jar});
var class_data = require('./lesson_data.js').lessonJSONs;

var EventEmitter = require('events').EventEmitter; 
var events = new EventEmitter();

//一些设置
var setting ={
    f:1600,//选每一门课的频率
    d:false,//是否查看具体的错误信息
    n:true,//是否立即执行选课,
}

var url = [
    'http://eamis.nankai.edu.cn/eams/login.action',
    'http://eamis.nankai.edu.cn/eams/stdElectCourse!batchOperator.action?profileId=89',
    'http://eamis.nankai.edu.cn/eams/stdElectCourse!defaultPage.action?electionProfile.id=89'
]

var login = function(username,password,cb){
    request.post(url[0],function(err,req,body){
        cb(err,body);
        // console.log(req);
    }).form({
        username:username,
        password:password,
        encodedPassword:'',
        session_locale:'zh_CN'
    });
}

//选课
var select = function(classid,cb){
    request.post(url[1],function(err,req,body){
        cb(err,body);
    }).form({
        optype:'true',
        operator0:classid+':true:0'
    });
};

//退课
var close = function(classid,cb){
    request.post(url[1],function(err,req,body){
        cb(err,body);
    }).form({
        optype:'false',
        operator0:classid+':false'
    }); 
}


//根据Id获取课程的真正Id
var get_classid = function(id){
    for(var i in class_data){
        if(class_data[i].no == id){
            return class_data[i].id;
        }
    }
}

//根据Id获取课程的名字
var get_class_name = function(id){
    for(var i in class_data){
        if(class_data[i].no == id){
            return class_data[i].name;
        }
    }   
}

//确认所有的课都被选完
function is_all_selected(){
    //所有课都被选完，则返回正确
    for(var i in ids_state){
        if(ids_state[i].ready == false){
            return false;
        }
    }
    return true;
}

//处理每次选课返回的信息
function process_info(info,id){
    var _e_info = get_class_name(id);
    if(info == ""){
        var _info = id + ":选课未开放或者其他错误:"+info;
        events.emit('skip',_e_info + _info);
        return ;
    }

    if(typeof info != 'string'){
        var _info = "链接或其他错误";
        events.emit('skip',_e_info + _info);
        console.log("链接或其他错误");
        return ;
    }

    if(info.indexOf('成功') >= 0){
        
        var _info = id+':选课成功';
        events.emit('skip',_e_info + _info);
        events.emit('success',id);

        console.log(id+':选课成功');
        ids_state[id].ready = true;
        return ;
    }

    if(info.indexOf('过快') >= 0){
        //时间每一次增加50
        setting.f += 50;
        
        var _info = id+':选课成功';
        events.emit('skip',_e_info + _info);

        console.log(id+':点击过快');
        return ;
    }
    
    if(info.indexOf('失败') >= 0){
        //打开详细信息
        if(setting.d){
            console.log(info);
        }
        setting.f -= 20;
        
        var _info = id + '选课失败';
        events.emit('skip',_e_info + _info);

        console.log(id + '选课失败');
        return ;
    }
}

function select_all(_ids){
    var length = _ids.length;
    var no = 0;
    //每600ms选一门课(系统设定的)
    var clock = setInterval(function(){
        
        if(is_all_selected()){
            clearInterval(clock);
        }

        select_one(_ids[no]);
        no++;
        no%=length;
    },setting.f);
}

//选择某一门课
function select_one(el){
    var classid = get_classid(el);  
    //这门课如果已经被选上了
    if(ids_state[el].ready == true){
        return;
    }
    try{
        request(url[2],function(){
        try{
        //选课                
            select(classid,function(err,body){
                if(err){
                    console.log("error" + err);
                    return ;
                }
                //处理消息
                var $ = cheerio.load(body);
                // console.log("info" + $('body').text());
                process_info(body,el);
            });
            }catch(e){
                console.log(e);
            }
        }); 
        }catch(e){
            console.log(e);
        }   
}

//用于记录每一个课程是否被选上的变量
var ids_state = {};

//登陆
exports.main = function(info,ids,type){
    if(type == 'PE'){
        url = [
        'http://eamis.nankai.edu.cn/eams/login.action',
        'http://eamis.nankai.edu.cn/eams/stdElectCourse!batchOperator.action?profileId=92',
        'http://eamis.nankai.edu.cn/eams/stdElectCourse!defaultPage.action?electionProfile.id=92'
        ];
    };

    login(info.username,info.password,function(err,body){
        if(err){
            console.log("error" + err);
            return ;
        }
        //初始化所有的课程状态
        for(var i in ids){
            ids_state[ids[i]] = {
                ready:false
            };
        }
        select_all(ids);
    });

    //返回一个事件监听
    return events;
}