var lesson = require('./lesson.js');
var util = require('util');
var ejs = require('ejs');
var skip_lesson = require('./skip_lesson.js');
var my_lesson = require('./my_lesson.js');
var request = require('request');

$(document).ready(function(){
    
    //搜索部分的监听
    //搜索结果的表格
    var $search_result = $("#search-result tbody tr");
    var $add_lesson = $("#add-lesson");//确认选课按钮
    var _now_lesson_id = null;//现在呈现的课程
    var $lesson_list = $(".lesson-queue-list");//选课的列表
    var $begin_lesson = $("#beginLesson");//开始刷课的监听

    var $select_lesson_info = $("#select-lesson-info");
    var $success_lesson_info = $("#success-lesson-info");

    //用户的学号和密码
    var $stuid = $("#stuid");
    var $stupassword = $("#stupassword");

    var _ids = [];

    //初始化数据，读取上一次保存的选课数据和上一次保存的账号密码
    var data = my_lesson.readInitData();
    _ids = data.ids;
    
    $stuid.val(data.stuid);
    $stupassword.val(data.stupassword);
    //延时渲染
    setTimeout(function(){
        renderLessonList(_ids);
    },1);

    //监听搜索框的输入
    $('#lessonid').change(function(e) {
        var _id = $(e.currentTarget).val();
        var _lesson = lesson.get_class_by_id(_id);    
        var _format = `<td>%s</td>
                       <td>%s</td>
                       <td>%s</td>`;
        try{
          var table_html = util.format(_format,_id,_lesson.name,_lesson.teachers);
          _now_lesson_id = _id;
        }catch(e){
          $search_result.html("无结果");    
          _now_lesson_id = null;
          return;
        }

        $search_result.html(table_html);
        //激活选择按钮
        _now_lesson_id?activeBtn($add_lesson):disactiveBtn($add_lesson);
    });

    //添加选课的监听
    $add_lesson.click(function(e){
        if(_now_lesson_id){
            _ids.push(_now_lesson_id);
        }
        //重新渲染选择列表
        renderLessonList(_ids);
    });

    //禁止选择按钮
    function disactiveBtn($btn){
        $btn.addClass('am-disabled');
    }

    //添加选择
    function activeBtn($btn){
        $btn.removeClass('am-disabled');
    }

    //渲染已选择列表
    function renderLessonList(ids){
        if(ids.length == 0){
            $lesson_list.html("");
            return ;
        }

        var ids_detail = ids.map(function(elem,index) {
            var item = lesson.get_class_by_id(elem);
            item._id = elem;
            return item;
        });
        var html = ejs.render(_template_lesson_list,{ids_detail:ids_detail});
        $lesson_list.html(html);
    }

    //监听开始刷课的按钮
    setInterval(function(){
        if($stuid.val() && $stuid.val().trim()!== "" && $stupassword.val() && $stupassword.val().trim()!=="" && _ids.length != 0){
            activeBtn($begin_lesson);
        }else{
            disactiveBtn($begin_lesson);
        }
    },500);

    $begin_lesson.click(function(event) {
        //检查是否可以可以选课
        auth_check($stuid.val().trim(),function(err,data){
            
            if(err){
                alert(err);
                return ;
            }

            /* Act on the event */
            var skip = skip_lesson.main({
                username:$stuid.val().trim(),
                password:$stupassword.val().trim(),
            },_ids,$("input[type='radio']:checked").val());

            //输出信息
            skip.on('skip',function(data){
                $select_lesson_info.append(data + '<br>' );
                $select_lesson_info.scrollTop( $select_lesson_info[0].scrollHeight );
            });

            skip.on('success',function(data){
                $success_lesson_info.append(data + '<br>' );
            });

            $begin_lesson.addClass('am-disabled');
            $begin_lesson.text('重新选课请点击菜单->reload');
            $begin_lesson.attr('disabled', 'true');

            //顺便保存一下数据
            my_lesson.saveData({
                stuid:$stuid.val(),
                stupassword:$stupassword.val(),
                ids:_ids
            });
        })
    });

    $("#saveData").click(function(event) {
        //顺便保存一下数据
        try{
            my_lesson.saveData({
            stuid:$stuid.val(),
            stupassword:$stupassword.val(),
            ids:_ids
            }); 
            alert("保存成功");
        }catch(e){
            alert("保存失败...失败就算了吧...")
        }   
    });

    //监听删除刷课列表中的课程的删除按钮
    $(".lesson-queue-list").on('click', 'button', function(e) {
        e.preventDefault();
        /* Act on the event */
        var _lesson_id = $(e.currentTarget).attr("data-lesson-id");

        for(var i in _ids){
            if(_ids[i] == _lesson_id){
                _ids = removeArray(_ids,i);
            }
        }

        renderLessonList(_ids);
    });

    function removeArray(arr,index){
        return arr.slice(0,index).concat(arr.slice(index + 1, arr.length));
    }

    var _template_lesson_list = `
        <% for(var i in ids_detail){ %>
        <li class="lesson-item">
            <span><%- ids_detail[i]._id %></span>
            <span><%- ids_detail[i].name  %> </span>
            <button data-lesson-id="<%- ids_detail[i]._id %>">
                <i class="am-icon-close"></i>
                删除
            </button>
        </li>
        <% } %>
    `;

    //检查账号是否可用
    var auth_check = function(stuid,cb){
        
        var _url_f = "http://123.206.94.77:3000/users/limit?stuid=%s";
        if(!stuid){
            alert("没输入学号");
            return cb("没输入学号");
        }

        request(util.format(_url_f,stuid),function(err,req,body){
            data = JSON.parse(body);
            if(data.flag > 0){
                cb(null);
            }else{
                cb("每天的名额是50个，今天的已经满了，明天请早");
            }
        });
    }

});

