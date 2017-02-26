var fs = require('fs');

var class_data = require('./lesson_data.js').lessonJSONs;

//根据Id获取课程的真正Id
exports.get_class_by_id = function(id){
    for(var i in class_data){
        if(class_data[i].no == id){
            return class_data[i];
        }
    }
}

