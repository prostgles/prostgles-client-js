"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickClone = exports.mergeDeep = void 0;
const prostgles_types_1 = require("prostgles-types");
const hasWnd = typeof window !== "undefined";
const mergeDeep = (_target, _source) => {
    const target = _target ? (0, exports.quickClone)(_target) : _target;
    const source = _source ? (0, exports.quickClone)(_source) : _source;
    const output = (0, prostgles_types_1.isObject)(target) ? { ...target } : {};
    if ((0, prostgles_types_1.isObject)(target) && (0, prostgles_types_1.isObject)(source)) {
        Object.keys(source).forEach((sourceKey) => {
            const sourceValue = source[sourceKey];
            const targetValue = target[sourceKey];
            if ((0, prostgles_types_1.isObject)(sourceValue) && (0, prostgles_types_1.isObject)(targetValue)) {
                output[sourceKey] = (0, exports.mergeDeep)(targetValue, sourceValue);
            }
            else {
                output[sourceKey] = (0, exports.quickClone)(sourceValue);
            }
        });
    }
    return output;
};
exports.mergeDeep = mergeDeep;
const quickClone = (obj) => {
    if (hasWnd && "structuredClone" in window && typeof window.structuredClone === "function") {
        return window.structuredClone(obj);
    }
    if (Array.isArray(obj)) {
        return obj.slice(0).map((v) => (0, exports.quickClone)(v));
    }
    else if ((0, prostgles_types_1.isObject)(obj)) {
        const result = {};
        (0, prostgles_types_1.getKeys)(obj).map((k) => {
            result[k] = (0, exports.quickClone)(obj[k]);
        });
        return result;
    }
    return obj;
};
exports.quickClone = quickClone;
