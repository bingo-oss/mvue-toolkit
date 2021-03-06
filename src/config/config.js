/**
 * 系统相关配置信息
 */
let http=require("axios");
let _=require("../libs/tools/lodash_loader").default;
let utils=require('../libs/utils').default;

if (!window.config) {
  console.error("全局配置文件未引入，请检查项目代码");
}
let mergedConfig = _.extend({}, window.config);

function cachedConfigKey(){
  return "_cachedConfig"+utils.getWebContext();
}

/**
* 根据配置项Key获取配置
* @param key 配置项Key
* @returns {*} 配置项的值
*/
function getConfigVal(key) {
  return mergedConfig[key];
};

/**
* 加载服务端的配置
*/
function loadServerConfig() {
  return new Promise(function(resolve, reject) {
        let configUrl=getServerConfigUrl();
        if(_.isEmpty(configUrl)){
            resolve(mergedConfig);
            return ;
        }
        http.get(getServerConfigUrl()).then(function ({data}) {
            if(window.config.apiBaseUrl){
                delete data["apiBaseUrl"];
            }
            mergedConfig=_.assign(mergedConfig, data);
            resolve(mergedConfig);
        }).catch(function (error) {
            let msg=`配置加载信息失败：${error.config.url}`;
            console.error(msg);
            if(error.response.status==404){
                console.error("请确认配置服务器地址是否正确，配置地址如下：" + getServerConfigUrl());
            }else{
                alert(msg);
            }
            reject(error);
        });
    });
};

/**
* 获取配置服务地址
* @returns {string}
*/
function getServerConfigUrl() {
  if(!window.config){
      return null;
  }
  if (window.config.configUrl) {
      return window.config.configUrl;
  }
  if(window.config.apiBaseUrl){
      return window.config.apiBaseUrl+"/web.json";
  }
  return null;
};


/**
* 获取指定key对应的配置项值
* @param key
* @returns {*}
*/
mergedConfig.getConfigVal = function (key) {
  return getConfigVal(key);
}

/**
* 从服务端加载配置项，返回Promise对象
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
 * 授权码模式自定义tokenUrl
 */
mergedConfig.getOAuth2TokenUrl = function () {
  var key = "oauth2.tokenUrl";
  return getConfigVal(key);
};

/**
 * 获取Token授权地址
 * @returns {*}
 */
mergedConfig.getSSOAuthorizeUrl = function () {
    var key = "oauth2.authorizeUrl";
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
  if (!isEmpty(type)) {
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
mergedConfig.getLocalLoginUrl = function () {
  var key = "loginUrl";
  return getConfigVal(key);
};

mergedConfig.getLocalLogoutUrl = function () {
    var key = "logoutUrl";
    return getConfigVal(key);
};

/**
 * 判断是否启用本地登录，oauth2.ssoServerUrl为空，并且loginUrl不为空，启用本地登录
 * @returns {boolean}
 */
mergedConfig.isLocalLogin=function () {
    var loginLoginUrl=this.getLocalLoginUrl();
    var ssoServerUrl=this.getSSOServerUrl();
    if(_.isEmpty(ssoServerUrl) && !_.isEmpty(loginLoginUrl)){
        return true;
    }
    return false;
}

/**
 *
 * @returns {*}
 */
mergedConfig.getLocalUserInfoUrl = function () {
    var key = "userInfoUrl";
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

mergedConfig.getCookieName = function () {
    let key = "cookie.name";
    let cookieName= getConfigVal(key);
    if(isEmpty(cookieName)){
        cookieName="m_vue_session_id";
    }
    return cookieName;
};

/**
*  获取API服务器地址
* @returns {*}
*/
mergedConfig.getApiBaseUrl = function () {
  let key = "apiBaseUrl";
  let url = getConfigVal(key);
  if (!isEmpty(url)) {
      return url;
  }
  return getConfigVal("service.metad.api.endpoint");
};

/**
* 获取网关地址
* @returns {*}
*/
mergedConfig.getGatewayUrl = function () {
  let key = "service.gateway.endpoint";
  let url = getConfigVal(key);
  if(isEmpty(url)){
      url=this.getApiBaseUrl();
  }
  return url;
};

/**
* 获取查询当前用户信息的接口
* @returns {*}
*/
mergedConfig.getUserInfoUrl = function () {
  var key = "service.uam.endpoint";
  let url = getConfigVal(key);
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
    var url = getConfigVal("userApiUrl");
    if (!isEmpty(url)) {
        return url;
    }
    var base = this.getUumEndpoint();
    if (isEmpty(base)) {
        return 'user';
    }
  return `${base}/user`;
};
/**
* 部门api访问地址
* @returns {*}
*/
mergedConfig.getOrgApiUrl = function () {
    var url = getConfigVal("orgApiUrl");
    if (!isEmpty(url)) {
        return url;
    }
    var base = this.getUumEndpoint();
    if (isEmpty(base)) {
        return 'organization';
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
/**
 * 获取元数据api接口地址
 * @return {*}
 */
mergedConfig.getMetadApiEndpoint = function () {
  return getConfigVal("service.metad.api.endpoint");
}

function isEmpty(obj) {
    if(obj==null|| typeof(obj)=="undefined"){
        return true;
    }
    if(typeof(obj)=="string" && obj.length==0){
        return true;
    }
    return false;
}
module.exports = mergedConfig;
