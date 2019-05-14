import config from './config/config';
import session from './libs/security/session';
import ssoclient from './libs/security/ssoclient';
import resource,{defaultOption,http} from './libs/http/resource';
import validator from './libs/extend/validator';
import  utils from './libs/utils';
import  router from './libs/extend/router';
import  directives from './libs/extend/directives';
import context from './libs/extend/context';
import moduleManager from './libs/module-manager';
import  urlTemplate from "./libs/http/url_template";

const mvueToolkit={
    moduleManager,
    session: session,
    ssoclient: ssoclient,
    config:config,
    resource: resource,
    urlTemplate,
    http,
    router:router,
    utils:utils,
    install:function (vue,options) {
        if (mvueToolkit.installed) return;
        context.init(new vue({
            data: {  }
        }));
        const  self=this;
        vue.prototype.$mvueToolkit=self;
        if(options.vee){
            new validator(vue,options.vee);
        }
        if(options.baseUrlForResource){
            let _opts={baseUrl:options.baseUrlForResource};
            //合并web应用的全局设置
            if(options.appSettings&&options.appSettings.http){
                let httpSettings=options.appSettings.http;
                _.assign(_opts,httpSettings);
            }
            defaultOption(_opts);
        }
        new directives(vue);
    }
}

export default mvueToolkit;