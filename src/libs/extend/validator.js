var Zh = require("../../i18n/vee_validator/zh_CN.js");
export  default  function CustomValidator(Vue, Vee) {
  var dictionary = {
    zh_CN: {
      messages: Zh
    }
  };
  Vue.use(Vee, {
    fieldsBagName: 'vee-fields',
    locale: 'zh_CN',
    dictionary: dictionary
  });
  
  Vee.Validator.extend("lowercase_num", {
    getMessage: function (field) {
      return '只允许小写字母、数字和下划线';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      return /^[a-z0-9_]+$/.test(value);
    }
  });

  Vee.Validator.extend("alphabegin_lowercase_num", {
    getMessage: function (field) {
      return '只允许小写字母开头、小写字母、数字、中划线、下划线';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      return /^[a-z][a-z0-9_\-]*$/.test(value);
    }
  });

  Vee.Validator.extend("code", {
    getMessage: function (field) {
      return '只允字母、数字、中划线、下划线、中划线';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      return /^[a-zA-Z0-9_\-]+$/.test(value);
    }
  });

  var specialCharactors = ['(', ')', '?', '&', ':', '!', ' ', '=', ',', '%'];
  Vee.Validator.extend("name_or_title", {
    getMessage: function (field) {
      return '不允许含有空格' + specialCharactors.join("") + '等特殊字符';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      for (var i = 0; i < specialCharactors.length; ++i) {
        if (value.indexOf(specialCharactors[i]) > -1) {
          return false;
        }
      }
      return true;
    }
  });
  Vee.Validator.extend("slash_started_path", {
    getMessage: function (field) {
      return '基础路径以/开头';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      if (!_.startsWith(value, "/")) {
        return false;
      }
      return true;
    }
  });
  Vee.Validator.extend("integer_range", {
    validate: function (value) {
      if(value===undefined){
        return true;
      }
      if(value.min){
        let isInt=_.isInteger(value.min);
        if(!isInt){
          return new Promise(resolve => {
            resolve({
              valid:false,
              data:{message:"下限必须为整数"}
            });
          });
        }
      }
      if(value.max){
        let isInt=_.isInteger(value.max);
        if(!isInt){
          return {
            valid:false,
            data:{message:"上限必须为整数"}
          };
        }
      }
      if((value.max||value.max===0)&&(value.min||value.min===0)&&value.min>value.max){
        return {
          valid:false,
          data:{message:"上限必须大于等于上限"}
        };
      }
      return true;
    },
    getMessage: function (field,params,data) {
      return (data && data.message)||"请输入整数范围";
    }
  });
  Vee.Validator.extend("number_range", {
    validate: function (value) {
      if(value===undefined){
        return true;
      }
      if(value.min){
        let isInt=_.isFinite(value.min);
        if(!isInt){
          return new Promise(resolve => {
            resolve({
              valid:false,
              data:{message:"下限必须为数值"}
            });
          });
        }
      }
      if(value.max){
        let isInt=_.isFinite(value.max);
        if(!isInt){
          return {
            valid:false,
            data:{message:"上限必须为数值"}
          };
        }
      }
      if((value.max||value.max===0)&&(value.min||value.min===0)&&value.min>value.max){
        return {
          valid:false,
          data:{message:"上限必须大于等于上限"}
        };
      }
      return true;
    },
    getMessage: function (field,params,data) {
      return (data && data.message)||"请输入数值范围";
    }
  });
  //egg:attach(fieldName, {verify_field_unique:["name value","nameField",{name:''}]})
  Vee.Validator.extend("verify_field_unique", {
    getMessage: function (field,params,data) {
      return (data && data.message)||"名称已经被占用";
    },
    validate: function (value, args) {
      if (!value) {
        return true;
      }
      if(!args||args.length<2){
        return;
      }
      if(args.length==2){
        args.push({});
      }
      var url=args[0];
      var isQueryUrl=false;
      //如果校验url是query接口而不是特写的check接口，params参数需转换为filters方式
      if(_.startsWith(url,"query:")){
        isQueryUrl=true;
        url=url.substr(url.indexOf("query:")+6);
      }
      var fieldName=args[1];
      var params=args[2];
      params[fieldName]=value;
      var id="";
      if(args.length>3){
        id=args[3];
      }
      let _params={};
      if(isQueryUrl){
        let _filters=[];
        _.each(params,function(value,key){
          _filters.push(`${key} eq ${value}`);
        });
        _params.filters=_filters.join(" and ");
      }else{
        _params=params;
      }
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          ax.get(url, _params, function (res) {
            var valid = true;
            if(!res){
              res={};
            }
            //通过query接口校验的，返回结果是数组
            if(_.isArray(res)){
              if(res.length>1){//有多个记录表示重复，校验失败
                valid=false;
                resolve({valid: valid});
                return;
              }else if(res.length==1){//换换成单记录返回
                res=res[0];
              }else{//空数据转换
                res={};
              }
            }
            if (id&&id=== res.id) {//如果是编辑的和返回的是同一条数据，是有效的
              valid = true;
            } else {//如果有数据返回，则证明重复了
              valid = !res.id;
            }
            resolve({valid: valid});
          },function(){
            resolve({
              valid: false,
              data:{message:"网络异常,请联系管理员"}
            });
          });
        }, 100);
      })
    }
  });

  Vee.Validator.setStrictMode(false);
};
