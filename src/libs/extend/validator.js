import _ from "../tools/lodash_loader";

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
  /**
 * Tests a single input value against a rule.
 *
 * @param{*} name The name of the field.
 * @param{*} valuethe value of the field.
 * @param{object} rule the rule object.
 * @param {scope} scope The field scope.
 * @return {boolean} Whether it passes the check.
 */
/**
 * Checks if the value is an object.
 */
var isObject = function (object) { return object !== null && object && typeof object === 'object' && ! Array.isArray(object); };

/**
 * Checks if a function is callable.
 */
var isCallable = function (func) { return typeof func === 'function'; };
var ValidatorException = (function () {
  function anonymous(msg) {
    this.msg = "[vee-validate]: " + msg;
  }

  anonymous.prototype.toString = function toString () {
    return this.msg;
  };

  return anonymous;
}());
var Rules=Vee.Rules;
Vee.Validator.prototype._test = function _test (name, value, rule, scope,normalizedValues) {
  var this$1 = this;
  if ( scope === void 0 ) scope = '__global__';

  var validator = Rules[rule.name];
  if (! validator || typeof validator !== 'function') {
    throw new ValidatorException(("No such validator '" + (rule.name) + "' exists."));
  }
  var result = validator(value, rule.params, name,normalizedValues);

  // If it is a promise.
  if (isCallable(result.then)) {
    return result.then(function (values) {
      var allValid = true;
      var data = {};
      if (Array.isArray(values)) {
        allValid = values.every(function (t) { return t.valid; });
      } else { // Is a single object.
        allValid = values.valid;
        data = values.data;
      }

      if (! allValid) {
        this$1.errorBag.add(
                      name,
                      this$1._formatErrorMessage(name, rule, data, scope),
                      rule.name,
                      scope
                  );
      }

      return allValid;
    });
  }

  if (! isObject(result)) {
    result = { valid: result, data: {} };
  }

  if (! result.valid) {
    this.errorBag.add(
              name,
              this._formatErrorMessage(name, rule, result.data, scope),
              rule.name,
              scope
          );
  }

  return result.valid;
};
/**
 * Validates a value against a registered field validations.
 *
 * @param{string} name the field name.
 * @param{*} value The value to be validated.
 * @param {String} scope The scope of the field.
 * @param {Boolean} throws If it should throw.
 * @return {Promise}
 */
Vee.Validator.prototype.validate = function validate (name, value, scope, throws,normalizedValues) {
  var this$1 = this;
  if ( scope === void 0 ) scope = '__global__';
  if ( throws === void 0 ) throws = true;

if (this.paused) { return Promise.resolve(true); }

if (name && name.indexOf('.') > -1) {
  // no such field, try the scope form.
  if (! this.$scopes.__global__[name]) {
    var assign$$1;
      (assign$$1 = name.split('.'), scope = assign$$1[0], name = assign$$1[1]);
  }
}
if (! scope) { scope = '__global__'; }
if (! this.$scopes[scope] || ! this.$scopes[scope][name]) {
  if (! this.strictMode) { return Promise.resolve(true); }

  var fullName = scope === '__global__' ? name : (scope + "." + name);
  warn(("Validating a non-existant field: \"" + fullName + "\". Use \"attach()\" first."));

  throw new ValidatorException('Validation Failed');
}

var field = this.$scopes[scope][name];
if (field.flags) {
  field.flags.pending = true;
}
this.errorBag.remove(name, scope);
// if its not required and is empty or null or undefined then it passes.
if (! field.required && ~[null, undefined, ''].indexOf(value)) {
  this._setAriaValidAttribute(field, true);
  if (field.events && isCallable(field.events.after)) {
    field.events.after({ valid: true });
  }

  return Promise.resolve(true);
}

try {
  var promises = Object.keys(field.validations).map(function (rule) {
    var result = this$1._test(
      name,
      value,
      { name: rule, params: field.validations[rule] },
      scope,
      normalizedValues
    );

    if (isCallable(result.then)) {
      return result;
    }

    // Early exit.
    if (! result) {
      if (field.events && isCallable(field.events.after)) {
        field.events.after({ valid: false });
      }
      throw new ValidatorException('Validation Aborted.');
    }

    if (field.events && isCallable(field.events.after)) {
      field.events.after({ valid: true });
    }
    return Promise.resolve(result);
  });

  return Promise.all(promises).then(function (values) {
    var valid = values.every(function (t) { return t; });
    this$1._setAriaValidAttribute(field, valid);

    if (! valid && throws) {
      if (field.events && isCallable(field.events.after)) {
        field.events.after({ valid: false });
      }
      throw new ValidatorException('Failed Validation');
    }
    return valid;
  });
} catch (error) {
  if (error.msg === '[vee-validate]: Validation Aborted.') {
    if (field.events && isCallable(field.events.after)) {
      field.events.after({ valid: false });
    }
    return Promise.resolve(false);
  }

  throw error;
}
};
/**
 * Validates each value against the corresponding field validations.
 * @param{object} values The values to be validated.
 * @param{String} scope The scope to be applied on validation.
 * @return {Promise} Returns a promise with the validation result.
 */
Vee.Validator.prototype.validateAll = function validateAll (values, scope) {
  var this$1 = this;
  if ( scope === void 0 ) scope = '__global__';

if (this.paused) { return Promise.resolve(true); }

var normalizedValues;
if (! values || typeof values === 'string') {
  this.errorBag.clear(values);
  normalizedValues = this._resolveValuesFromGetters(values);
} else {
  normalizedValues = {};
  Object.keys(values).forEach(function (key) {
    normalizedValues[key] = {
      value: values[key],
      scope: scope
    };
  });
}
var promises = Object.keys(normalizedValues).map(function (property) { return this$1.validate(
  property,
  normalizedValues[property].value,
  normalizedValues[property].scope,
  false, // do not throw
  normalizedValues
); });

return Promise.all(promises).then(function (results) {
  var valid = results.every(function (t) { return t; });
  if (! valid) {
    throw new ValidatorException('Validation Failed');
  }

  return valid;
});
};

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

  Vee.Validator.extend("alpha_underline_begin", {
    getMessage: function (field) {
      return '字母下划线开头，可包含字母、数字、中划线、下划线';
    },
    validate: function (value) {
      if (!value) {
        return true;
      }
      return /^[a-z\_][a-zA-Z0-9_\-]*$/.test(value);
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
  Vee.Validator.extend('biggerThan', {
    getMessage: function (field,args,data) {
      var fieldTitle=args.length>1?args[1]:args[0];
      return (data && data.message)||`必须大于${fieldTitle}`;
    },
    validate: function (value, args,data,_model) {
      if(_.isNil(value)||value===''){
        return true;
      }
      var targetField=args[0];
      var otherValue=_model&&_model[targetField]&&_model[targetField].value;
      if(_.isNil(otherValue)||otherValue===''){
        return true;
      }
      return value >= otherValue;
    }
  });
  Vee.Validator.extend('lessThan', {
    getMessage: function (field,args,data) {
      var fieldTitle=args.length>1?args[1]:args[0];
      return (data && data.message)||`必须小于${fieldTitle}`;
    },
    validate: function (value, args,data,_model) {
      if(_.isNil(value)||value===''){
        return true;
      }
      var targetField=args[0];
      var otherValue=_model&&_model[targetField]&&_model[targetField].value;
      if(_.isNil(otherValue)||otherValue===''){
        return true;
      }
      return value <= otherValue;
    }
  });
  Vee.Validator.extend('equals', {
    getMessage: function (field,args,data) {
      var fieldTitle=args.length>1?args[1]:args[0];
      return (data && data.message)||`必须等于${fieldTitle}`;
    },
    validate: function (value, args,data,_model) {
      if(_.isNil(value)||value===''){
        return true;
      }
      var targetField=args[0];
      var otherValue=_model&&_model[targetField]&&_model[targetField].value;
      if(_.isNil(otherValue)||otherValue===''){
        return true;
      }
      return value == otherValue;
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
        _.forIn(params,function(value,key){
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
