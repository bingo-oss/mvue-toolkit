/*
  @desc: A modern JavaScript utility library delivering modularity, performance, & extras.
  @detail: https://github.com/lodash/lodash
*/

import clone from 'lodash/clone'
import cloneDeep from 'lodash/cloneDeep'
import endsWith from 'lodash/endsWith'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'
import startsWith from 'lodash/startsWith'
import includes from 'lodash/includes'
import each from 'lodash/each'
import isFunction from 'lodash/isFunction'
import forEach from 'lodash/forEach'
import isNull from 'lodash/isNull'
import isString from 'lodash/isString'
import toSafeInteger from 'lodash/toSafeInteger'
import isUndefined from 'lodash/isUndefined'
import extend from 'lodash/extend'
import has from 'lodash/has'
import toNumber from 'lodash/toNumber'
import isInteger from 'lodash/isInteger'
import isFinite from 'lodash/isFinite'
import isNil from 'lodash/isNil'
import isArray from 'lodash/isArray'
import uniqueId from 'lodash/uniqueId'
import assign from 'lodash/assign'
import isEqual from 'lodash/isEqual'
import now from 'lodash/now'
import forIn from 'lodash/forIn'

let _lodash={
    clone,  cloneDeep,  endsWith,    find,
    isEmpty,  merge,  startsWith,  includes,
    each,  isFunction,  forEach,  isNull,  isString,  toSafeInteger,  isUndefined,
    extend,  has,  toNumber,  isInteger,isNil,isFinite,isArray,uniqueId,assign,
    isEqual,now,forIn
};
export default _lodash;
