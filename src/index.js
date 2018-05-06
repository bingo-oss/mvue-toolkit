import config from './config/config';
import session from './libs/security/session';
import ssoclient from './libs/security/ssoclient';
import resource,{defaultOption} from './libs/http/resource';
import validator from './libs/extend/validator';
import  utils from './libs/utils';
import  router from './libs/extend/router';
import  directives from './libs/extend/directives';
import context from './libs/extend/context';


export default {
    session: session,
    ssoclient: ssoclient,
    config:config,
    resource: resource,
    router:router,
    validator: validator,
    utils:utils,
    install:function (vue,options) {
        context.init(new vue({
            data: {  }
        }));
        if(options.vee){
            new validator(vue,options.vee);
        }
        if(options.baseUrlForResource){
            defaultOption({
                baseUrl:options.baseUrlForResource
            })
        }
        new directives(vue);
    }
};

