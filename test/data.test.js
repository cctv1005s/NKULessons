describe('选课数据检测',function(){
    it('选课数据存在',function(){
        var lesson_data  = require('../client/lesson_data.js');
        if(!lesson_data.lessonJSONs){
            throw Error('选课数据不存在');
        }
    });
});

var my_lesson = require('../client/lesson_data.js');
describe('用户选课数据监测',function(){
    it('初始化用户读取数据',function(){
        
    });
});