/**
 * 系统相关配置信息
 */
var http=require("axios");
var _=require("lodash");

if (!window.config) {
  alert("全局配置文件未引入，请检查项目代码");
}

var cachedConfig = null;
/**
* 根据配置项Key获取配置
* @param key 配置项Key
* @returns {*} 配置项的值
*/
function getConfigVal(key) {
    if (cachedConfig == null) {
        alert("配置未正确加载，请通过loadServerConfig加载配置。");
        return;
    }
  return cachedConfig[key];
};

/**
* 同步加载服务端的配置
*/
function loadServerConfig() {
  return new Promise(function(resolve, reject) {
        http.get(getServerConfigUr()).then(function ({data}) {
            cachedConfig = _.extend({}, window.config, data);
            resolve(cachedConfig);
        }).catch(function (error) {
            console.log(error.message);
            if(error.response.status==404){
                alert("请确认配置服务器地址是否正确，配置地址如下：" + getServerConfigUr());
            }
            reject(error);
        });
    });
};

/**
* 获取配置服务地址
* @returns {string}
*/
function getServerConfigUr() {
  if (window.config.configUrl) {
      return window.config.configUrl;
  }
  return window.config.baseServerUrl + "/config";
};

var mergedConfig = _.extend({}, window.config);
/**
* 获取指定key对应的配置项值
* @param key
* @returns {*}
*/
mergedConfig.getConfigVal = function (key) {
  return getConfigVal(key);
}

/**
* 从服务端加载配置项，返回Promise对象，
*/
mergedConfig.loadServerConfig = function () {
  return loadServerConfig();
}
/**
* 获取SSO服务器地址
* @returns {*}
*/
mergedConfig.getSSOServerUrl = function () {
  var key = "oauth2.serverUrl";
  return getConfigVal(key);
};
/**
* 获取SSO服务器版本号
* @returns {*}
*/
mergedConfig.getSSOVersion = function () {
  var key = "oauth2.serverVersion";
  return getConfigVal(key);
};
/**
* SSO中OAuth2的类型：implicit、accessCode、accessCodeProxy
* @returns {*}
*/
mergedConfig.getOAuth2FlowType = function () {
  var key = "oauth2.flow";
  var type = getConfigVal(key);
  if (!_.isEmpty(type)) {
      return type;
  }
  //计算type的默认值
  var authAccessCodeProxyUrl = this.getAuthAccessCodeProxyUrl();
  if (authAccessCodeProxyUrl != null && authAccessCodeProxyUrl.length > 0) {
      type = "accessCodeProxy";
  } else {
      var clientSecret = this.getClientSecret();
      if (clientSecret != null && clientSecret.length > 0) {
          type = "accessCode";
      } else {
          type = "implicit";
      }
  }
};
/**
* 登录地址
* @returns {*}
*/
mergedConfig.getLoginUrl = function () {
  var key = "tplLoginUrl";
  return getConfigVal(key);
};
/**
*
* @returns {*}
*/
mergedConfig.getLoginUrl = function () {
  var key = "tplLoginUrl";
  return getConfigVal(key);
};
/**
* 获取服务器端代理验证授权码（accessCode）的地址
* @returns {*}
*/
mergedConfig.getAuthAccessCodeProxyUrl = function () {
  var key = "oauth2.accessCode.proxyUrl";
  return getConfigVal(key);
};
/**
*  获取API服务器地址
* @returns {*}
*/
mergedConfig.getApiBaseUrl = function () {
  var url = "";
  var key = "apiBaseUrl";
  url = getConfigVal(key);
  if (!_.isEmpty(url)) {
      return url;
  }
  //未配置时，使用配置的基地址为api地址
  url = window.config.baseServerUrl;
};

/**
* 获取网关地址
* @returns {*}
*/
mergedConfig.getGatewayUrl = function () {
  var url = "";
  var key = "service.gateway.endpoint";
  url = getConfigVal(key);
  if (!_.isEmpty(url)) {
      return url;
  }
  //未配置时，使用配置的基地址为网关地址
  url = window.config.baseServerUrl;
};

/**
* 获取查询当前用户信息的接口
* @returns {*}
*/
mergedConfig.getUserInfoUrl = function () {
  var url = "";
  var key = "service.uam.endpoint";
  url = getConfigVal(key);
  if (url != null || url.length > 0) {
      return url + "/userinfo";
  }
  //未配置时，默认使用oauth2的userInfo接口
  url = this.getSSOServerUrl() + "/oauth2/userinfo";
};

/**
* 获取客户端的ClientId
* @returns {*}
*/
mergedConfig.getClientId = function () {
  var key = "oauth2.clientId";
  return getConfigVal(key);
};
/**
* 获取客户端密钥
* @returns {*}
*/
mergedConfig.getClientSecret = function () {
  var key = "oauth2.clientSecret";
  return getConfigVal(key);
};
/**
* 获取元数据服务的地址，包括表单、视图、套件和项目等基本信息获取接口
* @returns {*}
*/
mergedConfig.getMetaserviceUrl = function () {
  return getConfigVal("service.metabase.endpoint");
};
/**
* 获取上传下载的服务器地址
* @returns {*}
*/
mergedConfig.getUploadUrl = function () {
  var key = "service.stream.endpoint";
  return getConfigVal(key);
};

/**
* 导入导出工具等工具服务地址
* @returns {*}
*/
mergedConfig.getToolEndpoint = function () {
  return getConfigVal("service.tool.endpoint");
};
/**
* 统一服务地址
* @returns {*}
*/
mergedConfig.getUumEndpoint = function () {
  return getConfigVal("service.uum.endpoint");
};
/**
* link web程序根路径
*/
mergedConfig.getLinkWebEndpoint = function () {
  return getConfigVal("service.linkweb.endpoint");
};
/**
* 用户api访问地址
* @returns {*}
*/
mergedConfig.getUserApiUrl = function () {
  var base = this.getUumEndpoint();
  if(!base){
    return getConfigVal("userApiUrl");
  }
  return `${base}/user`;
};
/**
* 部门api访问地址
* @returns {*}
*/
mergedConfig.getOrgApiUrl = function () {
  var base = this.getUumEndpoint();
  if(!base){
    return getConfigVal("orgApiUrl");
  }
  return `${base}/organization`;
};
/**
* 发表api访问地址
* @returns {*}
*/
mergedConfig.getBlogApiUrl = function () {
  return getConfigVal("service.blog.endpoint");
};
/** * 获取link的基础地址 */
mergedConfig.getLinkEndpoint = function () {
  return getConfigVal("service.link.endpoint");
};
module.exports = mergedConfig;
