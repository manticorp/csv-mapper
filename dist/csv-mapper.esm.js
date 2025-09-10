// @ts-ignore - This will be replaced by Rollup
const limitString = (str, length, rest = '...') => {
    if (str.length <= length)
        return str;
    return str.slice(0, length - rest.length) + rest;
};
const normalize = (s) => String(s || '').toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
const classSafeString = (str) => str.replace(/[^a-zA-Z0-9-_]+/g, '-');
const logger = console ;
const debug = console.debug.bind(console) ;
const debugTable = console.table.bind(console) ;

class CsvRow {
    constructor(index, data, headers = null) {
        this.index = 0;
        this.iterIndex = 0;
        this.genIndex = 0;
        this.index = index;
        this.headers = headers;
        this.data = data;
        if (this.headers) {
            this._checkHeaderLength();
        }
    }
    _checkHeaderLength() {
        if (this.headers) {
            if (this.headers.length < this.data.length) {
                throw new Error('Not enough headers for data');
            }
            if (this.headers.length > this.data.length) {
                throw new Error('Too many headers for data');
            }
        }
    }
    get(idx) {
        if (typeof idx === 'number') {
            return this.data[idx] ?? null;
        }
        if (!this.headers) {
            throw new Error(`Cannot get header "${idx}" by name without headers`);
        }
        const values = [];
        this.headers.forEach((ourHeader, ourIndex) => {
            if (idx === ourHeader) {
                values.push(this.data[ourIndex]);
            }
        });
        if (values.length === 0) {
            return null;
        }
        if (values.length === 1) {
            return values[0];
        }
        return values;
    }
    set(idx, value) {
        if (typeof idx === 'number') {
            this.data[idx] = value;
        }
        else if (this.headers) {
            this.headers.forEach((ourHeader, ourIndex) => {
                if (idx === ourHeader) {
                    this.data[ourIndex] = value;
                }
            });
        }
        else {
            throw new Error(`Cannot set header "${idx}" by name without headers`);
        }
        return this;
    }
    /** Special Iterator functions */
    [Symbol.iterator]() {
        return this;
    }
    next() {
        if (this.iterIndex < this.data.length) {
            return { value: this.data[this.iterIndex++], done: false };
        }
        return { done: true, value: undefined };
    }
    return(value) {
        this.iterIndex = 0;
        return { done: true, value };
    }
    throw(exception) {
        this.iterIndex = 0;
        return { done: true, value: undefined };
    }
    /** end Special Iterator functions */
    *entries() {
        let idx = 0;
        while (idx < this.data.length) {
            if (this.headers) {
                yield [idx, this.data[idx], this.headers[idx]];
            }
            else {
                yield [idx, this.data[idx], null];
            }
            idx++;
        }
    }
    arrange(headers) {
        if (this.headers) {
            const ourHeaders = this.headers.slice();
            const ourData = this.data.slice();
            const outData = [];
            for (const header of headers) {
                const index = ourHeaders.indexOf(header);
                if (index === -1) {
                    throw new Error(`Header "${header}" not found`);
                }
                if (typeof ourData[index] === 'undefined') {
                    throw new Error(`Data at at index ${index} for header "${header}" not found`);
                }
                outData.push(ourData[index]);
                ourHeaders.splice(index, 1);
                ourData.splice(index, 1);
            }
            return outData;
        }
        throw new Error('Headers not defined - cannot arrange');
    }
    toPlainObject() {
        if (!this.headers) {
            return this.data;
        }
        const out = {};
        if (this.headers) {
            for (const idx in this.headers) {
                const header = this.headers[idx];
                if (typeof out[header] !== 'undefined') {
                    if (Array.isArray(out[header])) {
                        out[header].push(this.data[idx] ?? null);
                    }
                    else {
                        out[header] = [out[header], this.data[idx] ?? null];
                    }
                }
                else {
                    out[header] = this.data[idx] ?? null;
                }
            }
        }
        return out;
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var papaparse_min = {exports: {}};

/* @license
Papa Parse
v5.5.3
https://github.com/mholt/PapaParse
License: MIT
*/

(function (module, exports) {
	((e,t)=>{module.exports=t();})(commonjsGlobal,function r(){var n="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==n?n:{};var d,s=!n.document&&!!n.postMessage,a=n.IS_PAPA_WORKER||false,o={},h=0,v={};function u(e){this._handle=null,this._finished=false,this._completed=false,this._halted=false,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=true,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=b(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t;}.call(this,e),this.parseChunk=function(t,e){var i=parseInt(this._config.skipFirstNLines)||0;if(this.isFirstChunk&&0<i){let e=this._config.newline;e||(r=this._config.quoteChar||'"',e=this._handle.guessLineEndings(t,r)),t=[...t.split(e).slice(i)].join(e);}this.isFirstChunk&&U(this._config.beforeFirstChunk)&&void 0!==(r=this._config.beforeFirstChunk(t))&&(t=r),this.isFirstChunk=false,this._halted=false;var i=this._partialLine+t,r=(this._partialLine="",this._handle.parse(i,this._baseIndex,!this._finished));if(!this._handle.paused()&&!this._handle.aborted()){t=r.meta.cursor,i=(this._finished||(this._partialLine=i.substring(t-this._baseIndex),this._baseIndex=t),r&&r.data&&(this._rowCount+=r.data.length),this._finished||this._config.preview&&this._rowCount>=this._config.preview);if(a)n.postMessage({results:r,workerId:v.WORKER_ID,finished:i});else if(U(this._config.chunk)&&!e){if(this._config.chunk(r,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=true);this._completeResults=r=void 0;}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(r.data),this._completeResults.errors=this._completeResults.errors.concat(r.errors),this._completeResults.meta=r.meta),this._completed||!i||!U(this._config.complete)||r&&r.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=true),i||r&&r.meta.paused||this._nextChunk(),r}this._halted=true;},this._sendError=function(e){U(this._config.error)?this._config.error(e):a&&this._config.error&&n.postMessage({workerId:v.WORKER_ID,error:e,finished:false});};}function f(e){var r;(e=e||{}).chunkSize||(e.chunkSize=v.RemoteChunkSize),u.call(this,e),this._nextChunk=s?function(){this._readChunk(),this._chunkLoaded();}:function(){this._readChunk();},this.stream=function(e){this._input=e,this._nextChunk();},this._readChunk=function(){if(this._finished)this._chunkLoaded();else {if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),s||(r.onload=y(this._chunkLoaded,this),r.onerror=y(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!s),this._config.downloadRequestHeaders){var e,t=this._config.downloadRequestHeaders;for(e in t)r.setRequestHeader(e,t[e]);}var i;this._config.chunkSize&&(i=this._start+this._config.chunkSize-1,r.setRequestHeader("Range","bytes="+this._start+"-"+i));try{r.send(this._config.downloadRequestBody);}catch(e){this._chunkError(e.message);}s&&0===r.status&&this._chunkError();}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize||r.responseText.length,this._finished=!this._config.chunkSize||this._start>=(e=>null!==(e=e.getResponseHeader("Content-Range"))?parseInt(e.substring(e.lastIndexOf("/")+1)):-1)(r),this.parseChunk(r.responseText)));},this._chunkError=function(e){e=r.statusText||e;this._sendError(new Error(e));};}function l(e){(e=e||{}).chunkSize||(e.chunkSize=v.LocalChunkSize),u.call(this,e);var i,r,n="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,r=e.slice||e.webkitSlice||e.mozSlice,n?((i=new FileReader).onload=y(this._chunkLoaded,this),i.onerror=y(this._chunkError,this)):i=new FileReaderSync,this._nextChunk();},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk();},this._readChunk=function(){var e=this._input,t=(this._config.chunkSize&&(t=Math.min(this._start+this._config.chunkSize,this._input.size),e=r.call(e,this._start,t)),i.readAsText(e,this._config.encoding));n||this._chunkLoaded({target:{result:t}});},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result);},this._chunkError=function(){this._sendError(i.error);};}function c(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){var e,t;if(!this._finished)return e=this._config.chunkSize,i=e?(t=i.substring(0,e),i.substring(e)):(t=i,""),this._finished=!i,this.parseChunk(t)};}function p(e){u.call(this,e=e||{});var t=[],i=true,r=false;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause();},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume();},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError);},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=true);},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=true;},this._streamData=y(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()));}catch(e){this._streamError(e);}},this),this._streamError=y(function(e){this._streamCleanUp(),this._sendError(e);},this),this._streamEnd=y(function(){this._streamCleanUp(),r=true,this._streamData("");},this),this._streamCleanUp=y(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError);},this);}function i(m){var n,s,a,t,o=Math.pow(2,53),h=-o,u=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,d=/^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/,i=this,r=0,f=0,l=false,e=false,c=[],p={data:[],errors:[],meta:{}};function y(e){return "greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){if(p&&a&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+v.DefaultDelimiter+"'"),a=false),m.skipEmptyLines&&(p.data=p.data.filter(function(e){return !y(e)})),_()){if(p)if(Array.isArray(p.data[0])){for(var e=0;_()&&e<p.data.length;e++)p.data[e].forEach(t);p.data.splice(0,1);}else p.data.forEach(t);function t(e,t){U(m.transformHeader)&&(e=m.transformHeader(e,t)),c.push(e);}}function i(e,t){for(var i=m.header?{}:[],r=0;r<e.length;r++){var n=r,s=e[r],s=((e,t)=>(e=>(m.dynamicTypingFunction&&void 0===m.dynamicTyping[e]&&(m.dynamicTyping[e]=m.dynamicTypingFunction(e)),true===(m.dynamicTyping[e]||m.dynamicTyping)))(e)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&((e=>{if(u.test(e)){e=parseFloat(e);if(h<e&&e<o)return 1}})(t)?parseFloat(t):d.test(t)?new Date(t):""===t?null:t):t)(n=m.header?r>=c.length?"__parsed_extra":c[r]:n,s=m.transform?m.transform(s,n):s);"__parsed_extra"===n?(i[n]=i[n]||[],i[n].push(s)):i[n]=s;}return m.header&&(r>c.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+c.length+" fields but parsed "+r,f+t):r<c.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+c.length+" fields but parsed "+r,f+t)),i}var r;p&&(m.header||m.dynamicTyping||m.transform)&&(r=1,!p.data.length||Array.isArray(p.data[0])?(p.data=p.data.map(i),r=p.data.length):p.data=i(p.data,0),m.header&&p.meta&&(p.meta.fields=c),f+=r);}function _(){return m.header&&0===c.length}function k(e,t,i,r){e={type:e,code:t,message:i};void 0!==r&&(e.row=r),p.errors.push(e);}U(m.step)&&(t=m.step,m.step=function(e){p=e,_()?g():(g(),0!==p.data.length&&(r+=e.data.length,m.preview&&r>m.preview?s.abort():(p.data=p.data[0],t(p,i))));}),this.parse=function(e,t,i){var r=m.quoteChar||'"',r=(m.newline||(m.newline=this.guessLineEndings(e,r)),a=false,m.delimiter?U(m.delimiter)&&(m.delimiter=m.delimiter(e),p.meta.delimiter=m.delimiter):((r=((e,t,i,r,n)=>{var s,a,o,h;n=n||[",","\t","|",";",v.RECORD_SEP,v.UNIT_SEP];for(var u=0;u<n.length;u++){for(var d,f=n[u],l=0,c=0,p=0,g=(o=void 0,new E({comments:r,delimiter:f,newline:t,preview:10}).parse(e)),_=0;_<g.data.length;_++)i&&y(g.data[_])?p++:(d=g.data[_].length,c+=d,void 0===o?o=d:0<d&&(l+=Math.abs(d-o),o=d));0<g.data.length&&(c/=g.data.length-p),(void 0===a||l<=a)&&(void 0===h||h<c)&&1.99<c&&(a=l,s=f,h=c);}return {successful:!!(m.delimiter=s),bestDelimiter:s}})(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess)).successful?m.delimiter=r.bestDelimiter:(a=true,m.delimiter=v.DefaultDelimiter),p.meta.delimiter=m.delimiter),b(m));return m.preview&&m.header&&r.preview++,n=e,s=new E(r),p=s.parse(n,t,i),g(),l?{meta:{paused:true}}:p||{meta:{paused:false}}},this.paused=function(){return l},this.pause=function(){l=true,s.abort(),n=U(m.chunk)?"":n.substring(s.getCharIndex());},this.resume=function(){i.streamer._halted?(l=false,i.streamer.parseChunk(n,true)):setTimeout(i.resume,3);},this.aborted=function(){return e},this.abort=function(){e=true,s.abort(),p.meta.aborted=true,U(m.complete)&&m.complete(p),n="";},this.guessLineEndings=function(e,t){e=e.substring(0,1048576);var t=new RegExp(P(t)+"([^]*?)"+P(t),"gm"),i=(e=e.replace(t,"")).split("\r"),t=e.split("\n"),e=1<t.length&&t[0].length<i[0].length;if(1===i.length||e)return "\n";for(var r=0,n=0;n<i.length;n++)"\n"===i[n][0]&&r++;return r>=i.length/2?"\r\n":"\r"};}function P(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(C){var S=(C=C||{}).delimiter,O=C.newline,x=C.comments,I=C.step,A=C.preview,T=C.fastMode,D=null,L=false,F=null==C.quoteChar?'"':C.quoteChar,j=F;if(void 0!==C.escapeChar&&(j=C.escapeChar),("string"!=typeof S||-1<v.BAD_DELIMITERS.indexOf(S))&&(S=","),x===S)throw new Error("Comment character same as delimiter");true===x?x="#":("string"!=typeof x||-1<v.BAD_DELIMITERS.indexOf(x))&&(x=false),"\n"!==O&&"\r"!==O&&"\r\n"!==O&&(O="\n");var z=0,M=false;this.parse=function(i,t,r){if("string"!=typeof i)throw new Error("Input must be a string");var n=i.length,e=S.length,s=O.length,a=x.length,o=U(I),h=[],u=[],d=[],f=z=0;if(!i)return w();if(T||false!==T&&-1===i.indexOf(F)){for(var l=i.split(O),c=0;c<l.length;c++){if(d=l[c],z+=d.length,c!==l.length-1)z+=O.length;else if(r)return w();if(!x||d.substring(0,a)!==x){if(o){if(h=[],k(d.split(S)),R(),M)return w()}else k(d.split(S));if(A&&A<=c)return h=h.slice(0,A),w(true)}}return w()}for(var p=i.indexOf(S,z),g=i.indexOf(O,z),_=new RegExp(P(j)+P(F),"g"),m=i.indexOf(F,z);;)if(i[z]===F)for(m=z,z++;;){if(-1===(m=i.indexOf(F,m+1)))return r||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:z}),E();if(m===n-1)return E(i.substring(z,m).replace(_,F));if(F===j&&i[m+1]===j)m++;else if(F===j||0===m||i[m-1]!==j){ -1!==p&&p<m+1&&(p=i.indexOf(S,m+1));var y=v(-1===(g=-1!==g&&g<m+1?i.indexOf(O,m+1):g)?p:Math.min(p,g));if(i.substr(m+1+y,e)===S){d.push(i.substring(z,m).replace(_,F)),i[z=m+1+y+e]!==F&&(m=i.indexOf(F,z)),p=i.indexOf(S,z),g=i.indexOf(O,z);break}y=v(g);if(i.substring(m+1+y,m+1+y+s)===O){if(d.push(i.substring(z,m).replace(_,F)),b(m+1+y+s),p=i.indexOf(S,z),m=i.indexOf(F,z),o&&(R(),M))return w();if(A&&h.length>=A)return w(true);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:z}),m++;}}else if(x&&0===d.length&&i.substring(z,z+a)===x){if(-1===g)return w();z=g+s,g=i.indexOf(O,z),p=i.indexOf(S,z);}else if(-1!==p&&(p<g||-1===g))d.push(i.substring(z,p)),z=p+e,p=i.indexOf(S,z);else {if(-1===g)break;if(d.push(i.substring(z,g)),b(g+s),o&&(R(),M))return w();if(A&&h.length>=A)return w(true)}return E();function k(e){h.push(e),f=z;}function v(e){var t=0;return t=-1!==e&&(e=i.substring(m+1,e))&&""===e.trim()?e.length:t}function E(e){return r||(void 0===e&&(e=i.substring(z)),d.push(e),z=n,k(d),o&&R()),w()}function b(e){z=e,k(d),d=[],g=i.indexOf(O,z);}function w(e){if(C.header&&!t&&h.length&&!L){var s=h[0],a=Object.create(null),o=new Set(s);let n=false;for(let r=0;r<s.length;r++){let i=s[r];if(a[i=U(C.transformHeader)?C.transformHeader(i,r):i]){let e,t=a[i];for(;e=i+"_"+t,t++,o.has(e););o.add(e),s[r]=e,a[i]++,n=true,(D=null===D?{}:D)[e]=i;}else a[i]=1,s[r]=i;o.add(i);}n&&console.warn("Duplicate headers found and renamed."),L=true;}return {data:h,errors:u,meta:{delimiter:S,linebreak:O,aborted:M,truncated:!!e,cursor:f+(t||0),renamedHeaders:D}}}function R(){I(w()),h=[],u=[];}},this.abort=function(){M=true;},this.getCharIndex=function(){return z};}function g(e){var t=e.data,i=o[t.workerId],r=false;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=true,_(t.workerId,{data:[],errors:[],meta:{aborted:true}});},pause:m,resume:m};if(U(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results;}else U(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results);}t.finished&&!r&&_(t.workerId,t.results);}function _(e,t){var i=o[e];U(i.userComplete)&&i.userComplete(t),i.terminate(),delete o[e];}function m(){throw new Error("Not implemented.")}function b(e){if("object"!=typeof e||null===e)return e;var t,i=Array.isArray(e)?[]:{};for(t in e)i[t]=b(e[t]);return i}function y(e,t){return function(){e.apply(t,arguments);}}function U(e){return "function"==typeof e}return v.parse=function(e,t){var i=(t=t||{}).dynamicTyping||false;U(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!U(t.transform)&&t.transform,!t.worker||!v.WORKERS_SUPPORTED)return i=null,v.NODE_STREAM_INPUT,"string"==typeof e?(e=(e=>65279!==e.charCodeAt(0)?e:e.slice(1))(e),i=new(t.download?f:c)(t)):true===e.readable&&U(e.read)&&U(e.on)?i=new p(t):(n.File&&e instanceof File||e instanceof Object)&&(i=new l(t)),i.stream(e);(i=(()=>{var e;return !!v.WORKERS_SUPPORTED&&(e=(()=>{var e=n.URL||n.webkitURL||null,t=r.toString();return v.BLOB_URL||(v.BLOB_URL=e.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ","(",t,")();"],{type:"text/javascript"})))})(),(e=new n.Worker(e)).onmessage=g,e.id=h++,o[e.id]=e)})()).userStep=t.step,i.userChunk=t.chunk,i.userComplete=t.complete,i.userError=t.error,t.step=U(t.step),t.chunk=U(t.chunk),t.complete=U(t.complete),t.error=U(t.error),delete t.worker,i.postMessage({input:e,config:t,workerId:i.id});},v.unparse=function(e,t){var n=false,_=true,m=",",y="\r\n",s='"',a=s+s,i=false,r=null,o=false,h=((()=>{if("object"==typeof t){if("string"!=typeof t.delimiter||v.BAD_DELIMITERS.filter(function(e){return  -1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter),"boolean"!=typeof t.quotes&&"function"!=typeof t.quotes&&!Array.isArray(t.quotes)||(n=t.quotes),"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines),"string"==typeof t.newline&&(y=t.newline),"string"==typeof t.quoteChar&&(s=t.quoteChar),"boolean"==typeof t.header&&(_=t.header),Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns;} void 0!==t.escapeChar&&(a=t.escapeChar+s),t.escapeFormulae instanceof RegExp?o=t.escapeFormulae:"boolean"==typeof t.escapeFormulae&&t.escapeFormulae&&(o=/^[=+\-@\t\r].*$/);}})(),new RegExp(P(s),"g"));"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,i);if("object"==typeof e[0])return u(r||Object.keys(e[0]),e,i)}else if("object"==typeof e)return "string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields||r),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e,t,i){var r="",n=("string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t)),Array.isArray(e)&&0<e.length),s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(r+=m),r+=k(e[a],a);0<t.length&&(r+=y);}for(var o=0;o<t.length;o++){var h=(n?e:t[o]).length,u=false,d=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var f=[],l=0;l<h;l++){var c=s?e[l]:l;f.push(t[o][c]);}u=""===f.join("").trim();}if(!u){for(var p=0;p<h;p++){0<p&&!d&&(r+=m);var g=n&&s?e[p]:p;r+=k(t[o][g],p);}o<t.length-1&&(!i||0<h&&!d)&&(r+=y);}}return r}function k(e,t){var i,r;return null==e?"":e.constructor===Date?JSON.stringify(e).slice(1,25):(r=false,o&&"string"==typeof e&&o.test(e)&&(e="'"+e,r=true),i=e.toString().replace(h,a),(r=r||true===n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||((e,t)=>{for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return  true;return  false})(i,v.BAD_DELIMITERS)||-1<i.indexOf(m)||" "===i.charAt(0)||" "===i.charAt(i.length-1))?s+i+s:i)}},v.RECORD_SEP=String.fromCharCode(30),v.UNIT_SEP=String.fromCharCode(31),v.BYTE_ORDER_MARK="\ufeff",v.BAD_DELIMITERS=["\r","\n",'"',v.BYTE_ORDER_MARK],v.WORKERS_SUPPORTED=!s&&!!n.Worker,v.NODE_STREAM_INPUT=1,v.LocalChunkSize=10485760,v.RemoteChunkSize=5242880,v.DefaultDelimiter=",",v.Parser=E,v.ParserHandle=i,v.NetworkStreamer=f,v.FileStreamer=l,v.StringStreamer=c,v.ReadableStreamStreamer=p,n.jQuery&&((d=n.jQuery).fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&n.FileReader)||!this.files||0===this.files.length)return  true;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)});}),e(),this;function e(){if(0===h.length)U(o.complete)&&o.complete();else {var e,t,i,r,n=h[0];if(U(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(U(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config));}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){U(a)&&a(e,n.file,n.inputElem),u();},v.parse(n.file,n.instanceConfig);}}function u(){h.splice(0,1),e();}}),a&&(n.onmessage=function(e){e=e.data;void 0===v.WORKER_ID&&e&&(v.WORKER_ID=e.workerId);"string"==typeof e.input?n.postMessage({workerId:v.WORKER_ID,results:v.parse(e.input,e.config),finished:true}):(n.File&&e.input instanceof File||e.input instanceof Object)&&(e=v.parse(e.input,e.config))&&n.postMessage({workerId:v.WORKER_ID,results:e,finished:true});}),(f.prototype=Object.create(u.prototype)).constructor=f,(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(c.prototype)).constructor=c,(p.prototype=Object.create(u.prototype)).constructor=p,v}); 
} (papaparse_min));

var papaparse_minExports = papaparse_min.exports;
var Papa = /*@__PURE__*/getDefaultExportFromCjs(papaparse_minExports);

class Csv {
    get length() {
        return this.rows.length;
    }
    constructor(rows = [], headers = null) {
        this.index = 0;
        this.rows = [];
        this.rows = rows;
        this.headers = headers;
    }
    clone() {
        return new Csv(this.rows.map(r => r.slice()), this.headers ? this.headers.slice() : null);
    }
    has() {
        return this.index < this.rows.length;
    }
    current() {
        return new CsvRow(this.index, this.rows[this.index], this.headers);
    }
    nextRow() {
        return new CsvRow(this.index, this.rows[this.index++], this.headers);
    }
    /** Special Iterator functions */
    [Symbol.iterator]() {
        return this;
    }
    next() {
        if (this.has()) {
            return { done: false, value: this.nextRow() };
        }
        return { done: true, value: undefined };
    }
    return(value) {
        this.rewind();
        return { done: true, value };
    }
    throw(exception) {
        this.rewind();
        return { done: true, value: undefined };
    }
    /** end Special Iterator functions */
    rewind() {
        this.index = 0;
        return this;
    }
    map(fn) {
        const headers = this.headers ? this.headers.slice() : null;
        const newRows = this.rows.map((row, rowIndex) => fn(row, rowIndex, headers));
        return new Csv(newRows, headers);
    }
    forEach(fn) {
        const headers = this.headers ? this.headers.slice() : null;
        this.rows.forEach((row, rowIndex) => fn(row, rowIndex, headers));
        return this;
    }
    mapRows(fn) {
        const newRows = this.rows.map((row, rowIndex) => fn(new CsvRow(rowIndex, row, this.headers), this.headers).data);
        return new Csv(newRows, this.headers);
    }
    arrange(headers) {
        const newRows = [];
        for (const row of this) {
            newRows.push(row.arrange(headers));
        }
        return new Csv(newRows, headers);
    }
    toPlainObjects() {
        const rows = [];
        for (const row of this) {
            rows.push(row.toPlainObject());
        }
        return rows;
    }
    toRows() {
        const rows = [];
        if (this.headers) {
            rows.push(this.headers);
        }
        return [...rows, ...this.rows];
    }
    toString(options = {}) {
        const rows = this.toRows();
        if (this.headers && !(options.header ?? true)) {
            rows.shift();
        }
        return Papa.unparse(rows, options);
    }
    addColumn(nameOrIndex, where = null, defaultValue = null) {
        if (where === null) {
            if (typeof nameOrIndex === 'number') {
                where = nameOrIndex;
            }
            else {
                where = this.headers?.length ?? -1;
            }
        }
        if (typeof where === 'string') {
            if (this.headers) {
                let idx = this.headers.lastIndexOf(where);
                if (idx === -1) {
                    throw new Error(`Missing column "${where}"`);
                }
                where = idx + 1;
            }
            else {
                where = -1;
            }
        }
        this.headers?.splice(where, 0, String(nameOrIndex));
        for (const row of this.rows) {
            row.splice(where, 0, defaultValue);
        }
        return this;
    }
    renameColumn(from, to) {
        this.headers = this.headers?.map(h => h === from ? to : h) || null;
        return this;
    }
    remap(mapping) {
        mapping.forEach(({ from, to }) => this.renameColumn(from, to));
        return this;
    }
    remapColumns(mapping) {
        if (Array.isArray(mapping)) {
            mapping.forEach(([source, to]) => {
                if (typeof source === 'number') {
                    this.remapColumn(source, to);
                }
                else {
                    this.remapColumn(source, to);
                }
            });
        }
        else {
            Object.entries(mapping).forEach(([source, to]) => this.remapColumn(source, to));
        }
        return this;
    }
    remapColumn(source, to) {
        const hasHeaders = Array.isArray(this.headers) && this.headers.length > 0;
        const rowCount = Array.isArray(this.rows) ? this.rows.length : 0;
        const colCount = this.rows?.[0]?.length ?? (hasHeaders ? this.headers.length : 0);
        if (colCount === 0)
            return this;
        const toNames = Array.isArray(to) ? [...to] : [to];
        if (toNames.length === 0)
            return this;
        // Resolve current source indices (supports duplicates for name source)
        const resolveIndices = () => {
            if (typeof source === 'number') {
                const idx = source < 0 ? colCount + source : source;
                if (!Number.isInteger(idx) || idx < 0 || idx >= colCount) {
                    throw new Error(`remapColumn: index out of range: ${source}`);
                }
                return [idx];
            }
            if (!hasHeaders) {
                throw new Error(`remapColumn: cannot use header names without headers (got "${source}")`);
            }
            const indices = [];
            this.headers.forEach((h, i) => {
                if (h === source)
                    indices.push(i);
            });
            if (indices.length === 0) {
                throw new Error(`remapColumn: header not found: "${source}"`);
            }
            return indices;
        };
        const srcIdxs = resolveIndices();
        // Snapshot source columns' values now to avoid interference while appending
        const takeColumn = (idx) => Array.from({ length: rowCount }, (_, r) => this.rows?.[r]?.[idx]);
        if (srcIdxs.length === 1) {
            const src = srcIdxs[0];
            const srcVals = takeColumn(src);
            // Rename to first name
            if (hasHeaders)
                this.headers[src] = toNames[0];
            // Append duplicates for remaining names
            for (let k = 1; k < toNames.length; k++) {
                const name = toNames[k];
                if (hasHeaders)
                    this.headers.push(name);
                for (let r = 0; r < rowCount; r++) {
                    this.rows[r].push(srcVals[r]);
                }
            }
            return this;
        }
        // Multiple sources
        if (toNames.length === 1) {
            // Rename each source to the same target
            const name = toNames[0];
            if (hasHeaders) {
                for (const i of srcIdxs)
                    this.headers[i] = name;
            }
            return this;
        }
        if (toNames.length !== srcIdxs.length) {
            throw new Error(`remapColumn: mismatched arity (sources=${srcIdxs.length}, targets=${toNames.length}). ` +
                `Use a single target name to rename all, or match lengths.`);
        }
        // One-to-one rename (no duplication)
        if (hasHeaders) {
            srcIdxs.forEach((i, k) => (this.headers[i] = toNames[k]));
        }
        return this;
    }
    remapped(mapping) {
        return this.clone().remap(mapping);
    }
    removeColumn(name) {
        if (typeof name === 'number') {
            if (this.headers) {
                this.headers.splice(name, 1);
            }
            this.rows.forEach(row => row.splice(name, 1));
        }
        else if (this.headers) {
            let index;
            index = this.headers?.indexOf(name);
            while (typeof index !== 'undefined' && index > -1) {
                this.removeColumn(index);
                index = this.headers?.indexOf(name);
            }
        }
        else {
            throw new Error('Cannot remove header by name without headers present.');
        }
    }
    reorderColumns(order) {
        const hasHeaders = Array.isArray(this.headers) && this.headers.length > 0;
        const colCount = this.rows?.[0]?.length ??
            (hasHeaders ? this.headers.length : 0);
        if (!Array.isArray(order) || order.length === 0)
            return this;
        if (colCount === 0)
            return this;
        // Build lookup of header -> queue of indices (handles duplicates)
        const nameToIndices = new Map();
        if (hasHeaders) {
            this.headers.forEach((name, i) => {
                const arr = nameToIndices.get(name) ?? [];
                arr.push(i);
                nameToIndices.set(name, arr);
            });
        }
        const seen = new Set();
        const indices = [];
        const takeIndex = (i) => {
            if (!seen.has(i)) {
                seen.add(i);
                indices.push(i);
            }
        };
        for (const key of order) {
            if (typeof key === 'number') {
                let idx = key < 0 ? colCount + key : key;
                if (!Number.isInteger(idx) || idx < 0 || idx >= colCount) {
                    throw new Error(`reorderColumns: index out of range: ${key}`);
                }
                takeIndex(idx);
            }
            else {
                if (!hasHeaders) {
                    throw new Error(`reorderColumns: cannot use header names without headers (got "${key}")`);
                }
                const queue = nameToIndices.get(key);
                if (!queue || queue.length === 0) {
                    throw new Error(`reorderColumns: unknown header "${key}"`);
                }
                // Pull ALL remaining occurrences for this name, in order
                while (queue.length) {
                    takeIndex(queue.shift());
                }
            }
        }
        // Append any unspecified columns in original order
        for (let i = 0; i < colCount; i++) {
            if (!seen.has(i))
                indices.push(i);
        }
        // Apply reorder
        if (hasHeaders) {
            this.headers = indices.map(i => this.headers[i]);
        }
        if (Array.isArray(this.rows)) {
            this.rows = this.rows.map(row => indices.map(i => row[i]));
        }
        return this;
    }
}

/*
 * Data Transformer – CSV data transformation and validation engine
 * ----------------------------------------------------------------
 * Handles transformation of parsed CSV data according to column specifications,
 * including validation, custom transforms, and output generation in various formats.
 */
class DataTransformer extends EventTarget {
    constructor(options = {}) {
        super();
        this.options = Object.assign({
            generateCsv: true,
            includeErrors: true
        }, options ?? {});
    }
    /**
     * Transform raw CSV data according to column specifications and mapping
     * @param inputCsv Input CSV data
     * @param mapping Source header to target column mapping
     * @param columnSpecs Target column specifications
     * @returns Transformation result with mapped data and optional CSV
     */
    transform(inputCsv, mapping, columnSpecs) {
        // Validate required columns are mapped
        const { isValid, missingRequired, mappedTargets } = this.validateRequiredMapping(mapping, columnSpecs);
        if (!isValid) {
            throw new Error(`Required columns are not mapped: ${missingRequired.join(', ')}`);
        }
        // Handle empty mapping case
        if (Object.keys(mapping).length === 0 && !columnSpecs.some(c => c.required)) {
            return this.handleEmptyMapping(inputCsv, mapping, columnSpecs);
        }
        // Transform rows
        const { data, errors } = this.transformRows(inputCsv, mapping, columnSpecs);
        // Generate CSV if requested (simple format only)
        let csv = null;
        if (this.options.generateCsv) {
            csv = this.generateCsv(data);
        }
        // Calculate validation summary
        const validation = this.calculateValidationSummary(data, errors);
        return { data, csv, validation };
    }
    calculateValidationSummary(csv, errors) {
        const errorsByField = {};
        const errorsByRow = {};
        errors.forEach(error => {
            const field = error.field || 'unknown';
            errorsByField[field] = (errorsByField[field] || 0) + 1;
            errorsByRow[error.rowIndex] = (errorsByRow[error.rowIndex] || 0) + 1;
        });
        return {
            errors: errors,
            totalRows: csv.length,
            errorRows: Object.keys(errorsByRow).length,
            totalErrors: errors.length,
            errorsByField
        };
    }
    _invertMapping(mapping) {
        const inverted = {};
        for (let [source, targets] of Object.entries(mapping)) {
            if (typeof targets === 'string') {
                targets = [targets];
            }
            for (const target of targets) {
                if (Array.isArray(inverted[target])) {
                    inverted[target].push(source);
                }
                else {
                    inverted[target] = [source];
                }
            }
        }
        return inverted;
    }
    /**
     * Transform individual rows according to column specifications
     * @param inputCsv Source data rows
     * @param mapping Target column to source headers mapping
     * @param columnSpecs Column specifications
     * @returns Transformed rows with validation errors
     */
    transformRows(inputCsv, mapping, columnSpecs) {
        let rowIndex = 0;
        const inverseMapping = this._invertMapping(mapping);
        let data = inputCsv.clone();
        data.remapColumns(mapping);
        const headers = columnSpecs.map(spec => spec.outputHeader ?? spec.name ?? spec.title);
        debug({ mapping, inverseMapping });
        if (data.headers) {
            const toRemove = data.headers?.filter(header => !inverseMapping[header]);
            toRemove.forEach(col => data.removeColumn(col));
        }
        const missingColumns = columnSpecs.filter(spec => {
            const sourceHeaders = inverseMapping[spec.name] || [];
            return sourceHeaders.length === 0;
        }).map(a => a.outputHeader ?? a.name);
        missingColumns.forEach(colName => {
            const column = columnSpecs.find(spec => (spec.outputHeader ?? spec.name ?? spec.title) === colName);
            data.addColumn(colName, null, column?.defaultValue ?? null);
        });
        data.reorderColumns(headers);
        const colCache = new Map();
        for (const sourceRow of data) {
            for (const [colIndex, value, header] of sourceRow.entries()) {
                const spec = colCache.get(header) ?? columnSpecs.find(spec => (spec.outputHeader ?? spec.name ?? spec.title) === header);
                colCache.set(header, spec ?? null);
                if (!spec) {
                    logger.warn(`No column spec found for header "${header}".`, { header, spec });
                    throw new Error(`Column spec not found for ${header}`);
                }
                // Apply custom transformation if specified
                let transformedValue = value;
                if (spec.transform && typeof spec.transform === 'function') {
                    try {
                        const rowObject = {};
                        if (inputCsv.headers) {
                            inputCsv.headers.forEach(header => {
                                rowObject[header] = sourceRow.get(header) || '';
                            });
                        }
                        transformedValue = spec.transform(value, rowObject);
                    }
                    catch (error) {
                        const msg = error instanceof Error ? error.message : String(error);
                        this._transformationError(rowIndex, spec.title || spec.name, transformedValue, msg);
                        continue;
                    }
                }
                // Validate the transformed value
                if (spec.validate !== undefined) {
                    const isValid = DataTransformer.validateValue(transformedValue, spec.validate);
                    if (!isValid) {
                        let message;
                        if (typeof spec.validate === 'object' && spec.validate !== null && 'type' in spec.validate) {
                            message = `Value "${transformedValue}" is not a valid ${spec.validate.type}`;
                        }
                        else if (spec.validate instanceof RegExp) {
                            message = `Value "${transformedValue}" does not match pattern ${spec.validate}`;
                        }
                        else if (typeof spec.validate === 'function') {
                            message = `Value "${transformedValue}" failed custom validation`;
                        }
                        else {
                            message = `Value "${transformedValue}" is invalid`;
                        }
                        if (spec.validationMessage) {
                            message = spec.validationMessage;
                        }
                        const result = this._valueValidationError(rowIndex, spec.title || spec.name, transformedValue, message);
                        if (result) {
                            transformedValue = result;
                        }
                    }
                }
                sourceRow.set(colIndex, transformedValue);
            }
            rowIndex++;
        }
        return { data, errors: [] };
    }
    /**
     * Generate CSV output from transformed data
     * @param mappedRows Transformed data rows
     * @param columnSpecs Column specifications
     * @returns CSV string
     */
    generateCsv(csv) {
        return csv.toString({
            quoteChar: this.options.quoteChar,
            escapeChar: this.options.escapeChar,
            delimiter: this.options.delimiter,
            newline: this.options.newline,
        });
    }
    /**
     * Handle case where no columns are mapped but none are required
     * @param inputCsv Source data rows
     * @param columnSpecs Column specifications
     * @returns Transform result with empty mapped columns
     */
    handleEmptyMapping(inputCsv, mapping, columnSpecs) {
        const rows = [];
        // Create empty rows for each input row
        for (let i = 0; i < inputCsv.length; i++) {
            const row = [];
            for (const spec of columnSpecs) {
                row.push('');
            }
            rows.push(row);
        }
        const headers = columnSpecs.map(spec => spec.outputHeader ?? spec.name ?? spec.title);
        const emptyCsv = new Csv(rows, headers);
        const { data, errors } = this.transformRows(emptyCsv, mapping, columnSpecs);
        let csv = null;
        if (this.options.generateCsv) {
            csv = this.generateCsv(emptyCsv);
        }
        const validation = this.calculateValidationSummary(data, errors);
        return { data, csv, validation };
    }
    /**
     * Validate that all required columns are mapped
     * @param mapping Source to target mapping
     * @param columnSpecs Column specifications
     * @returns Array of missing required column names
     */
    validateRequiredMapping(mapping, columnSpecs) {
        const missingRequired = [];
        // Get all mapped targets using the helper method
        const mappedTargets = this.getAllMappedTargets(mapping);
        const mappedTargetsSet = new Set(mappedTargets);
        for (const spec of columnSpecs) {
            if ((spec.required && (typeof spec.defaultValue === 'undefined')) && !mappedTargetsSet.has(spec.name)) {
                missingRequired.push(spec.name);
            }
        }
        return {
            isValid: missingRequired.length === 0,
            missingRequired,
            mappedTargets
        };
    }
    getAllMappedTargets(mapping) {
        const targets = new Set();
        Object.values(mapping).forEach(value => {
            if (typeof value === 'string') {
                targets.add(value);
            }
            else {
                value.forEach(col => targets.add(col));
            }
        });
        return Array.from(targets);
    }
    /**
     * Validate a single value against various validation types
     * @param fieldValue Value to validate
     * @param validator Validation rule
     * @returns True if valid, false otherwise
     */
    static validateValue(fieldValue, validator) {
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            return true; // Empty values are considered valid unless required
        }
        if (validator instanceof RegExp) {
            return DataTransformer._validateRegex(fieldValue, validator);
        }
        if (typeof validator === 'function') {
            try {
                return validator(fieldValue);
            }
            catch (error) {
                return false;
            }
        }
        if (typeof validator === 'object' && validator !== null) {
            const rule = validator;
            // Handle ValidationRule based on its type
            switch (rule.type) {
                case 'email':
                    return DataTransformer._validateRegex(fieldValue, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
                case 'number':
                    const num = Number(fieldValue);
                    if (isNaN(num) || !isFinite(num))
                        return false;
                    if (rule.min !== undefined && num < rule.min)
                        return false;
                    if (rule.max !== undefined && num > rule.max)
                        return false;
                    return true;
                case 'boolean':
                    return ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(String(fieldValue).toLowerCase());
                case 'date':
                    if (rule.format) {
                        const regex = DataTransformer.dateFormatToRegex(rule.format);
                        return regex.test(String(fieldValue));
                    }
                    return !isNaN(Date.parse(fieldValue));
                case 'phone':
                case 'tel':
                case 'telephone':
                    return DataTransformer._validateRegex(fieldValue, /^[\+]?[\d\s\-\(\)\.]{7,15}$/);
                case 'time':
                    return DataTransformer._validateRegex(fieldValue, /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/);
                case 'datetime':
                    return !isNaN(Date.parse(fieldValue));
                default:
                    return true;
            }
        }
        return true;
    }
    /**
     * Convert date format string to RegExp for validation
     * @param format Date format string (e.g., 'YYYY-MM-DD')
     * @param options Validation options
     * @returns RegExp for validation
     */
    static dateFormatToRegex(format, { allowSeparators = true, strictLength = false } = {}) {
        // Common format mappings
        const patterns = {
            'YYYY': '\\d{4}',
            'YY': '\\d{2}',
            'MM': '\\d{1,2}',
            'DD': '\\d{1,2}',
            'HH': '\\d{1,2}',
            'mm': '\\d{1,2}',
            'ss': '\\d{1,2}'
        };
        if (strictLength) {
            patterns['MM'] = '\\d{2}';
            patterns['DD'] = '\\d{2}';
            patterns['HH'] = '\\d{2}';
            patterns['mm'] = '\\d{2}';
            patterns['ss'] = '\\d{2}';
        }
        let regex = format;
        // Replace format tokens with regex patterns
        for (const [token, pattern] of Object.entries(patterns)) {
            regex = regex.replace(new RegExp(token, 'g'), pattern);
        }
        // Handle separators
        if (allowSeparators) {
            regex = regex.replace(/[-\/\.\s:]/g, '[-\\/\\.\\s:]');
        }
        return new RegExp(`^${regex}$`);
    }
    /**
     * Validate value against regex pattern
     * @param value Value to validate
     * @param regex Regular expression pattern
     * @returns True if valid, false otherwise
     */
    static _validateRegex(value, regex) {
        return regex.test(String(value));
    }
    /**
     * Update transformer options
     * @param options Partial options to update
     */
    updateOptions(options) {
        Object.assign(this.options, options);
    }
    /**
     * Get current transformer options
     * @returns Current options
     */
    getOptions() {
        return { ...this.options };
    }
    /**
     * Convert array of values to CSV row string
     * @param arr Values to convert
     * @param sep Field separator
     * @param quote Quote character
     * @param esc Escape character
     * @returns CSV row string
     */
    static toCsvRow(arr, sep = ',', quote = '"', esc = null) {
        return arr.map(v => {
            const str = String(v ?? '');
            if (str.includes(sep) || str.includes(quote) || str.includes('\n') || str.includes('\r')) {
                const escaped = esc ? str.replace(new RegExp(quote, 'g'), esc + quote) : str.replace(new RegExp(quote, 'g'), quote + quote);
                return quote + escaped + quote;
            }
            return str;
        }).join(sep);
    }
    /**
     * Handle transformation errors
     * @param rowIndex Row index where error occurred
     * @param columnName Column name where error occurred
     * @param value Value that caused the error
     * @param message Error message
     */
    _transformationError(rowIndex, columnName, value, message) {
        this.dispatchEvent(new CustomEvent('transformationError', {
            detail: { rowIndex, columnName, value, message }
        }));
    }
    /**
     * Handle value validation errors
     * @param rowIndex Row index where error occurred
     * @param columnName Column name where error occurred
     * @param value Value that failed validation
     * @param message Error message
     * @returns Corrected value if any, otherwise original value
     */
    _valueValidationError(rowIndex, columnName, value, message) {
        const event = new CustomEvent('valueValidationError', {
            detail: { rowIndex, columnName, value, message }
        });
        this.dispatchEvent(event);
        return value; // Return original value by default
    }
}

class AutoMapper {
    static map(headers, columns, mode = 'csvToConfig', autoThreshold = 0.9, existingMapping = {}) {
        const mappingMode = mode || 'csvToConfig';
        const used = new Map();
        if (mappingMode === 'csvToConfig') {
            for (const src of headers) {
                let best = '';
                let score = 0;
                for (const spec of columns) {
                    const count = used.get(spec.name) || 0;
                    const canUse = spec.allowDuplicates === true || count === 0;
                    if (!canUse)
                        continue;
                    const s = AutoMapper.matchScore(src, spec);
                    if (s > score) {
                        score = s;
                        best = spec.name;
                    }
                }
                if (score >= autoThreshold) {
                    AutoMapper.addMapping(existingMapping, src, best);
                    used.set(best, (used.get(best) || 0) + 1);
                }
            }
        }
        else {
            // Reverse mode: Config columns -> CSV headers
            for (const spec of columns) {
                let best = '';
                let score = 0;
                for (const header of headers) {
                    const count = used.get(header) || 0;
                    const canUse = count === 0; // Each CSV header can only be used once
                    if (!canUse)
                        continue;
                    const s = AutoMapper.matchScore(header, spec);
                    if (s > score) {
                        score = s;
                        best = header;
                    }
                }
                if (score >= autoThreshold) {
                    AutoMapper.addMapping(existingMapping, best, spec.name); // Still CSV header -> config column
                    used.set(best, (used.get(best) || 0) + 1);
                }
            }
        }
        return existingMapping;
    }
    static matchScore(srcHeader, spec) {
        const norm = normalize(srcHeader);
        const title = normalize(spec.title || '');
        const name = normalize(spec.name || '');
        let score = 0;
        if (spec.match instanceof RegExp) {
            if (spec.match.test(srcHeader) || spec.match.test(norm))
                score = Math.max(score, 1.0);
        }
        else if (typeof spec.match === 'function') {
            try {
                if (spec.match(srcHeader) || spec.match(norm))
                    score = Math.max(score, 1.0);
            }
            catch (e) { }
        }
        if (norm === name || norm === title)
            score = Math.max(score, 0.98);
        if (norm.includes(name) || norm.includes(title))
            score = Math.max(score, 0.9);
        score = Math.max(score, AutoMapper.similarity(norm, name) * 0.85);
        score = Math.max(score, AutoMapper.similarity(norm, title) * 0.85);
        return score;
    }
    static similarity(a, b) {
        a = normalize(a);
        b = normalize(b);
        if (!a || !b)
            return 0;
        if (a === b)
            return 1;
        const grams = (str) => {
            const m = new Map();
            for (let i = 0; i < str.length - 1; i++) {
                const g = str.slice(i, i + 2);
                m.set(g, (m.get(g) || 0) + 1);
            }
            return m;
        };
        const A = grams(a), B = grams(b);
        let inter = 0, total = 0;
        for (const [g, c] of A) {
            if (B.has(g))
                inter += Math.min(c, B.get(g));
            total += c;
        }
        for (const [, c] of B)
            total += c;
        return (2 * inter) / (total || 1);
    }
    static addMapping(mapping, csvHeader, configColumn) {
        const current = mapping[csvHeader];
        if (!current) {
            mapping[csvHeader] = configColumn;
        }
        else if (typeof current === 'string') {
            // Convert single value to array if adding another
            if (current !== configColumn) {
                mapping[csvHeader] = [current, configColumn];
            }
        }
        else {
            // Already an array, add if not present
            if (!current.includes(configColumn)) {
                current.push(configColumn);
            }
        }
    }
}

/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
class DefaultUIRenderer {
    constructor() {
        this.container = null;
        this.mappingChangeCallback = null;
        this.currentOptions = null;
        this.hasInitialRender = false;
        this.lastDrawnMap = {};
        this.redrawHash = {};
        // Ensure CSS is loaded
        DefaultUIRenderer._ensureStyles();
        this.uniqid = Math.random().toString(36).substring(2, 10);
    }
    reset() {
        this.lastDrawnMap = {};
        this.redrawHash = {};
        return this;
    }
    conditionallySetContents(container, content) {
        if (container) {
            container.innerHTML = content;
        }
    }
    hashesAreEquivalent(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    mappingModeHeaders(mode) {
        return [
            mode === 'configToCsv' ? 'Your configured columns' : 'Your CSV headers',
            mode === 'configToCsv' ? 'Map to CSV header' : 'Map to configured column',
        ];
    }
    mappingModeText(mode) {
        return mode === 'configToCsv' ? '(Config → CSV)' : '(CSV → Config)';
    }
    tagText(options) {
        return `${options.rowCount} rows • sep: ${this._escape(options.dialect.separator || ',')}`;
    }
    reRender(container, options) {
        logger.group('Re-Rendering');
        this.container = container;
        this.currentOptions = options;
        container.dataset.mappingMode = options.mappingMode;
        const redrawHash = {
            mappingMode: options.mappingMode,
            allowMultipleSelection: options.allowMultipleSelection,
            headers: options.headers.slice()
        };
        logger.debug(redrawHash, this.redrawHash, this.hashesAreEquivalent(this.redrawHash, redrawHash));
        const validationDisplay = this._renderValidationMessages(options.validation);
        const mappingModeText = this.mappingModeText(options.mappingMode);
        const [leftHeader, rightHeader] = this.mappingModeHeaders(options.mappingMode);
        const tagText = this.tagText(options);
        if (container) {
            this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-validation-display"]`), validationDisplay);
            this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-mode"]`), mappingModeText);
            this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-tag"]`), tagText);
            this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-header-left"]`), leftHeader);
            this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-header-right"]`), rightHeader);
            if (!this.hashesAreEquivalent(this.redrawHash, redrawHash) ||
                !this.hashesAreEquivalent(this.lastDrawnMap, options.fullMapping)) {
                this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-mapping-table-body"]`), this._renderMappingTable(options));
                this._attachEventListeners();
            }
            else {
                debug({
                    redrawHash: { before: this.redrawHash, after: redrawHash },
                    lastDrawnMap: { before: this.lastDrawnMap, after: options.fullMapping }
                });
            }
        }
        this.redrawHash = redrawHash;
        this.lastDrawnMap = options.fullMapping;
        logger.groupEnd('Re-Rendering');
    }
    render(container, options) {
        if (this.hasInitialRender) {
            this.reRender(container, options);
            return;
        }
        logger.group('Rendering');
        this.container = container;
        this.currentOptions = options;
        container.dataset.mappingMode = options.mappingMode;
        if (!options.headers.length) {
            container.innerHTML = this._banner('No CSV loaded. Choose a file to begin.');
            logger.groupEnd('Rendering');
            return;
        }
        const mappingTable = this._renderMappingTable(options);
        const mappingDisplay = this._renderRequiredMappingStatus(options.mappingResult);
        const validationDisplay = this._renderValidationMessages(options.validation);
        const mappingModeText = this.mappingModeText(options.mappingMode);
        const [leftHeader, rightHeader] = this.mappingModeHeaders(options.mappingMode);
        const tagText = this.tagText(options);
        container.innerHTML = `
      <div id="${this.uniqid}-mapping-display">${mappingDisplay}</div>
      <div id="${this.uniqid}-validation-display">${validationDisplay}</div>
      <div class="csvm-card">
        <div class="csvm-card-h">
          Map your columns <span class="csvm-mapping-mode" id="${this.uniqid}-mode">${mappingModeText}</span>
          <span class="csvm-tag" id="${this.uniqid}-tag">${tagText}</span>
        </div>
        <div class="csvm-card-b">
          <table class="csvm-table">
            <thead>
              <tr>
                <th id="${this.uniqid}-header-left">${leftHeader}</th>
                <th id="${this.uniqid}-header-right">${rightHeader}</th>
              </tr>
            </thead>
            <tbody id="${this.uniqid}-mapping-table-body">
              ${mappingTable}
            </tbody>
          </table>
        </div>
      </div>
    `;
        this._attachEventListeners();
        this.hasInitialRender = true;
        logger.groupEnd('Rendering');
    }
    onMappingChange(callback) {
        this.mappingChangeCallback = callback;
    }
    updateMapping(mapping) {
        if (!this.container || !this.currentOptions)
            return;
        // Update just the validation display
        const validationElement = this.container.querySelector('.csvm-mapping-status');
        if (validationElement) {
            validationElement.outerHTML = this._renderRequiredMappingStatus(mapping);
        }
    }
    destroy() {
        // Clean up event listeners if needed
        this.container = null;
        this.mappingChangeCallback = null;
        this.currentOptions = null;
    }
    showMessage(message) {
        if (!this.container)
            return;
        this.container.innerHTML = this._banner(message);
    }
    _renderRequiredMappingStatus(mappingResult) {
        const { isValid, missingRequired } = mappingResult;
        return isValid
            ? `<div class="csvm-mapping-status csvm-mapping-success">✓ All required columns are mapped</div>`
            : `<div class="csvm-mapping-status csvm-mapping-error">
          ⚠ Missing required columns: ${missingRequired.join(', ')}
        </div>`;
    }
    _renderValidationMessages(validation) {
        if (validation.errors.length <= 0)
            return '';
        return `
      <details class="csvm-validation-messages">
        <summary>Validation Errors (${validation.errors.length})</summary>
        <ul>
        ${validation.errors.map(error => `<li class="csvm-validation-error">${this._escape(error.message)}</li>`).join('')}
        </ul>
      </details>
    `;
    }
    _renderMappingTable(options) {
        debug('_renderMappingTable', { options });
        if (options.mappingMode === 'configToCsv') {
            // Config columns on the left, CSV headers on the right
            return options.columnSpecs.map(spec => {
                let currentMapping = options.currentMapping[spec.name] || '';
                const selectOptions = this._generateCsvHeaderOptions(options.headers, currentMapping, options.currentMapping, options.allowMultipleSelection);
                this.lastDrawnMap = options.fullMapping;
                return `
          <tr>
            <td><strong>${this._escape(spec.title || spec.name)}${spec.required ? ' *' : ''}</strong></td>
            <td>
              <select id="${this.uniqid}-${classSafeString(spec.name)}" name="${classSafeString(spec.name)}" data-src="${this._escape(spec.name)}">
                ${selectOptions}
              </select>
            </td>
          </tr>
        `;
            }).join('');
        }
        else {
            // CSV headers on the left, config columns on the right (standard mode)
            return options.headers.map(header => {
                const currentMapping = options.fullMapping[header] || '';
                const selectOptions = this._generateSelectOptions(options.columnSpecs, currentMapping, options.currentMapping, options.allowMultipleSelection);
                // Check if this CSV header has multiple mappings (beyond the simple mapping)
                const allMappings = this._getFullMappingsForHeader(header, options);
                const hasMultipleMappings = allMappings.length > 1;
                const additionalMappingsText = (!options.allowMultipleSelection && hasMultipleMappings) ?
                    ` <span class="csvm-multiple-mappings">(+${allMappings.length - 1} more: ${allMappings.slice(1).join(', ')})</span>` : '';
                const multipleAttr = options.allowMultipleSelection ? 'multiple' : '';
                const selectClass = options.allowMultipleSelection ? 'csvm-multi-select' : '';
                this.lastDrawnMap = options.fullMapping;
                return `
          <tr>
            <td><strong>${this._escape(header)}</strong></td>
            <td>
              <select id="${this.uniqid}-${classSafeString(header)}" name="${classSafeString(header)}" data-src="${this._escape(header)}" ${multipleAttr} class="${selectClass}">
                ${selectOptions}
              </select>
              ${additionalMappingsText}
            </td>
          </tr>
        `;
            }).join('');
        }
    }
    _generateSelectOptions(columnSpecs, currentTargetName, allMappings, allowMultipleSelection) {
        // Count how many times each target is used
        const usageCounts = new Map();
        Object.values(allMappings).forEach(target => {
            if (target)
                usageCounts.set(target, (usageCounts.get(target) || 0) + 1);
        });
        if (typeof currentTargetName === 'string') {
            currentTargetName = [currentTargetName];
        }
        const ignoreOption = '<option value="">— Ignore —</option>';
        const columnOptions = columnSpecs.map(spec => {
            const count = usageCounts.get(spec.name) || 0;
            const isCurrentTarget = currentTargetName.includes(spec.name);
            // For multiple selection mode or if duplicates are allowed, don't disable based on usage
            const canUse = allowMultipleSelection || spec.allowDuplicates === true || count === 0 || isCurrentTarget;
            const disabled = !canUse ? 'disabled' : '';
            const selected = isCurrentTarget ? 'selected' : '';
            const title = this._escape(spec.title || spec.name);
            const multiIndicator = (allowMultipleSelection || spec.allowDuplicates) ? ' (multi)' : '';
            const requiredIndicator = (spec.required && canUse) ? ' *' : '';
            return `<option class="${spec.required ? 'required' : ''}" value="${this._escape(spec.name)}" ${selected} ${disabled}>${title}${multiIndicator}${requiredIndicator}</option>`;
        });
        return [ignoreOption, ...columnOptions].join('');
    }
    _generateCsvHeaderOptions(csvHeaders, currentTargetHeader, allMappings, allowMultipleSelection) {
        // In configToCsv mode, multiple config columns can map to the same CSV header
        debug({ csvHeaders, currentTargetHeader, allMappings });
        const ignoreOption = '<option value="">— Ignore —</option>';
        const headerOptions = csvHeaders.map(header => {
            const isCurrentTarget = currentTargetHeader === header;
            // If allowMultipleSelection is false, check if this header is already used by another config column
            let disabled = '';
            if (!allowMultipleSelection) {
                const headerAlreadyUsed = Object.entries(allMappings).some(([configCol, csvHeader]) => csvHeader === header && configCol !== Object.keys(allMappings).find(k => allMappings[k] === currentTargetHeader));
                if (headerAlreadyUsed && !isCurrentTarget) {
                    disabled = 'disabled';
                }
            }
            const selected = isCurrentTarget ? 'selected' : '';
            const headerText = this._escape(header);
            return `<option value="${this._escape(header)}" ${selected} ${disabled}>${headerText}</option>`;
        });
        return [ignoreOption, ...headerOptions].join('');
    }
    _attachEventListeners() {
        if (!this.container || !this.mappingChangeCallback)
            return;
        debug('Attaching event listeners');
        const selectElements = this.container.querySelectorAll('select[data-src]');
        selectElements.forEach(select => {
            select.addEventListener('change', () => {
                let sourceHeader = select.getAttribute('data-src');
                debug('Select changed', { sourceHeader, value: select.value, selectedOptions: Array.from(select.selectedOptions).map(o => o.value) });
                if (this.container?.dataset.mappingMode === 'configToCsv') {
                    // In configToCsv mode: data-src=configColumn, value=csvHeader
                    const configColumn = sourceHeader;
                    const newCsvHeader = select.value;
                    if (!newCsvHeader && configColumn && this.currentOptions) {
                        // User is clearing the mapping - find the currently mapped CSV header
                        const currentCsvHeader = this.currentOptions.currentMapping[configColumn];
                        if (currentCsvHeader && this.mappingChangeCallback) {
                            // Only use special removal format if multiple selection is enabled
                            if (this.currentOptions.allowMultipleSelection) {
                                this.lastDrawnMap = this.mappingChangeCallback(`${currentCsvHeader}|${configColumn}`, '');
                            }
                            else {
                                this.lastDrawnMap = this.mappingChangeCallback(currentCsvHeader, '');
                            }
                        }
                    }
                    else if (newCsvHeader && configColumn && this.mappingChangeCallback) {
                        // User is setting a new mapping
                        // First clear any existing mapping for this config column
                        if (this.currentOptions) {
                            const currentCsvHeader = this.currentOptions.currentMapping[configColumn];
                            if (currentCsvHeader && currentCsvHeader !== newCsvHeader) {
                                // Remove the old mapping first
                                if (this.currentOptions.allowMultipleSelection) {
                                    this.lastDrawnMap = this.mappingChangeCallback(`${currentCsvHeader}|${configColumn}`, '');
                                }
                                else {
                                    this.lastDrawnMap = this.mappingChangeCallback(currentCsvHeader, '');
                                }
                            }
                        }
                        // Add the new mapping
                        this.lastDrawnMap = this.mappingChangeCallback(newCsvHeader, configColumn);
                    }
                }
                else {
                    // Standard csvToConfig mode
                    if (sourceHeader && this.mappingChangeCallback) {
                        if (select.multiple && this.currentOptions?.allowMultipleSelection) {
                            // Handle multiple selection - get all selected values
                            const selectedValues = Array.from(select.selectedOptions).map(option => option.value).filter(v => v);
                            // Clear existing mappings for this CSV header first
                            this.lastDrawnMap = this.mappingChangeCallback(sourceHeader, '');
                            // Add each selected mapping
                            selectedValues.forEach(targetColumn => {
                                if (targetColumn && this.mappingChangeCallback) {
                                    this.lastDrawnMap = this.mappingChangeCallback(sourceHeader, targetColumn);
                                }
                            });
                        }
                        else {
                            // Single selection mode
                            const targetColumn = select.value;
                            this.lastDrawnMap = this.mappingChangeCallback(sourceHeader, targetColumn ?? '');
                        }
                    }
                }
            });
        });
    }
    _banner(text) {
        return `<div class="csvm-note">${this._escape(text)}</div>`;
    }
    _escape(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    _getFullMappingsForHeader(header, options) {
        if (!options.fullMapping || !options.fullMapping[header]) {
            return [];
        }
        const mapping = options.fullMapping[header];
        if (typeof mapping === 'string') {
            return [mapping];
        }
        else {
            return [...mapping];
        }
    }
    static _ensureStyles() {
        const id = 'csv-mapper-styles';
        if (document.getElementById(id))
            return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      /* Light theme (default) */
      .csvm-card {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 10px 0;
        background: #ffffff;
      }
      .csvm-card-h {
        background: #f8f9fa;
        padding: 12px 16px;
        border-bottom: 1px solid #ddd;
        font-weight: 600;
        color: #333;
      }
      .csvm-card-b { padding: 0; }
      .csvm-table {
        width: 100%;
        border-collapse: collapse;
        background: #ffffff;
      }
      .csvm-table th, .csvm-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .csvm-table th {
        background: #f8f9fa;
        font-weight: 600;
      }
      .csvm-table select {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: #ffffff;
        color: #333;
      }
      .csvm-table select.csvm-multi-select {
        min-height: 80px;
      }
      .csvm-tag {
        background: #007cba;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.85em;
        font-weight: normal;
      }
      .csvm-mapping-mode {
        background: #28a745;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.85em;
        font-weight: normal;
        margin-right: 8px;
      }
      .csvm-note {
        padding: 12px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        color: #6c757d;
      }
      .csvm-mapping-status, .csvm-validation-messages {
        padding: 8px 12px;
        margin-bottom: 10px;
        border-radius: 4px;
        font-weight: 500;
      }
      .csvm-mapping-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }
      .csvm-mapping-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      .csvm-validation-messages {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      .csvm-validation-error {
        padding: 4px 0;
      }
      .csvm-table select option.required:not(:disabled) {
        font-weight: bold;
        color: #721c24;
      }
      .csvm-multiple-mappings {
        font-size: 0.85em;
        color: #007cba;
        font-weight: normal;
        margin-left: 8px;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .csvm-card {
          border: 1px solid #444;
          background: #1e1e1e;
        }
        .csvm-card-h {
          background: #2d2d2d;
          border-bottom: 1px solid #444;
          color: #e0e0e0;
        }
        .csvm-table {
          background: #1e1e1e;
        }
        .csvm-table th, .csvm-table td {
          border-bottom: 1px solid #444;
          color: #e0e0e0;
        }
        .csvm-table th {
          background: #2d2d2d;
        }
        .csvm-table select {
          border: 1px solid #555;
          background: #2d2d2d;
          color: #e0e0e0;
        }
        .csvm-table select.csvm-multi-select {
          min-height: 80px;
        }
        .csvm-table select:focus {
          border-color: #007cba;
          outline: none;
        }
        .csvm-tag {
          background: #0099e6;
        }
        .csvm-note {
          background: #2d2d2d;
          border: 1px solid #444;
          color: #a0a0a0;
        }
        .csvm-mapping-success {
          background: #1e3a1e;
          border: 1px solid #2d5a2d;
          color: #4caf50;
        }
        .csvm-mapping-error {
          background: #3a1e1e;
          border: 1px solid #5a2d2d;
          color: #f44336;
        }
        .csvm-validation-messages {
          background: #3a1e1e;
          border: 1px solid #5a2d2d;
          color: #f44336;
        }
        .csvm-table select option.required:not(:disabled) {
          color: #f44336;
        }
        .csvm-multiple-mappings {
          color: #0099e6;
        }
      }
    `;
        document.head.appendChild(style);
    }
}

/*
 * CSV Parser using PapaParse – Robust CSV parsing with excellent dialect detection
 * -------------------------------------------------------------------------------
 * This implementation uses the popular PapaParse library which handles edge cases
 * like multiline fields much better than custom parsing.
 *
 * Provides instance methods for parsing, dialect detection, and CSV generation.
 */
class PapaParser {
    /**
     * Parse CSV text with auto-detection or explicit dialect options
     * @param text CSV text to parse
     * @param options Parsing options including dialect preferences
     * @returns Parsed result with headers, rows, and detected dialect
     */
    parseCSV(text, { headers = true, separator = '', enclosure = '', escape = '', guessMaxLines = 25 } = {}) {
        const config = {
            header: false,
            skipEmptyLines: true,
            dynamicTyping: false
        };
        if (separator)
            config.delimiter = separator;
        if (enclosure)
            config.quoteChar = enclosure;
        if (escape)
            config.escapeChar = escape;
        const result = Papa.parse(text, config);
        if (result.errors.length > 0) {
            console.warn('PapaParse errors:', result.errors);
        }
        const rows = result.data;
        while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === '')) {
            rows.pop();
        }
        if (rows.length === 0) {
            return {
                headers: [],
                rows: [],
                rawRows: [],
                dialect: { separator: separator || ',', enclosure: enclosure || '"', escape: escape || null }
            };
        }
        const dialect = {
            separator: result.meta.delimiter || separator || ',',
            enclosure: enclosure || '"',
            escape: escape || null
        };
        if (headers) {
            const headerRow = rows.shift() || [];
            const dataRows = rows.map((arr) => Object.fromEntries(headerRow.map((h, idx) => [h, arr[idx] ?? ''])));
            return { headers: headerRow, rows: dataRows, rawRows: rows, dialect };
        }
        const maxLen = rows.reduce((m, a) => Math.max(m, a.length), 0);
        const generatedHeaders = Array.from({ length: maxLen }, (_, i) => `Column ${i + 1}`);
        const dataRows = rows.map((arr) => Object.fromEntries(generatedHeaders.map((h, idx) => [h, arr[idx] ?? ''])));
        return { headers: generatedHeaders, rows: dataRows, rawRows: rows, dialect };
    }
    /**
     * Detect CSV dialect (separator, enclosure, escape) from sample text
     * @param text CSV text to analyze
     * @param options Dialect detection options
     * @returns Detected CSV dialect
     */
    detectDialect(text, { separator = null, enclosure = null, escape = null, guessMaxLines = 25 } = {}) {
        let sampleText = text;
        if (guessMaxLines > 0) {
            const lines = text.split(/\r\n|\n|\r/);
            sampleText = lines.slice(0, guessMaxLines).join('\n');
        }
        const config = {
            header: false,
            preview: 5,
            skipEmptyLines: true
        };
        if (separator)
            config.delimiter = separator;
        if (enclosure)
            config.quoteChar = enclosure;
        if (escape)
            config.escapeChar = escape;
        const result = Papa.parse(sampleText, config);
        return {
            separator: result.meta.delimiter || separator || ',',
            enclosure: enclosure || '"',
            escape: escape || null
        };
    }
    /**
     * Convert array of values to CSV row string
     * @param arr Array of values to convert
     * @param sep Field separator (default: comma)
     * @param quote Enclosure character (default: double quote)
     * @param esc Escape character (null for quote doubling)
     * @returns CSV row string
     */
    toCsvRow(arr, sep = ',', quote = '"', esc = null) {
        const config = {
            delimiter: sep,
            quoteChar: quote,
            header: false
        };
        if (esc)
            config.escapeChar = esc;
        return Papa.unparse([arr.map((v) => String(v ?? ''))], config);
    }
    /**
     * Parse CSV text with a specific dialect
     * @param text CSV text to parse
     * @param sep Field separator character
     * @param quote Enclosure/quote character
     * @param esc Escape character (null for quote doubling)
     * @returns Array of string arrays (raw CSV rows)
     */
    _parseWithDialect(text, sep, quote, esc) {
        const config = {
            header: false,
            delimiter: sep,
            quoteChar: quote,
            skipEmptyLines: true,
            dynamicTyping: false
        };
        if (esc) {
            config.escapeChar = esc;
        }
        const result = Papa.parse(text, config);
        return result.data;
    }
    /**
     * Get a sample of text containing up to maxRows logical CSV rows
     * For PapaParse, we can just use a simple line-based approach since
     * PapaParse handles the complex parsing internally
     */
    _getSampleText(text, maxRows) {
        if (maxRows <= 0)
            return text;
        const lines = text.split(/\r\n|\n|\r/);
        return lines.slice(0, maxRows).join('\n');
    }
    // Keep these helper methods for API compatibility
    _mode(arr) {
        const m = new Map();
        let best = null, bestC = -1;
        for (const v of arr) {
            const c = (m.get(v) || 0) + 1;
            m.set(v, c);
            if (c > bestC) {
                best = v;
                bestC = c;
            }
        }
        return best;
    }
    _escRe(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, (r) => `\\${r}`);
    }
}

class CsvMapper extends EventTarget {
    /**
     * @param fileInput selector or element for <input type=file>
     * @param options configuration options
     */
    constructor(fileInput, options = {}) {
        super();
        this.input = null;
        this.columns = [];
        this.controlsEl = null;
        this.mapping = {}; // Flexible: CSV header -> config column(s)
        this.headers = [];
        this.dialect = { separator: ',', enclosure: '"', escape: null };
        this.uiRenderer = new DefaultUIRenderer();
        this.parser = new PapaParser();
        this.isValid = true;
        this.csv = null;
        if (typeof fileInput === 'string') {
            const fi = document.querySelector(fileInput);
            if (!(fi instanceof HTMLInputElement)) {
                throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
            }
            fileInput = fi;
        }
        if (fileInput instanceof HTMLInputElement) {
            this.input = fileInput;
            if (this.input.type !== 'file') {
                throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
            }
        }
        else if (typeof fileInput === 'object' && !(fileInput instanceof HTMLElement)) {
            options = fileInput;
        }
        else {
            throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
        }
        this.opts = Object.assign({
            // Parsing/dialect
            separator: '', // auto when falsy/empty string
            enclosure: '', // auto when falsy/empty string
            escape: '', // auto when falsy/empty string; fallback to doubling
            guessMaxLines: 25, // How many lines to use for auto dialect parsing
            // Library behavior
            headers: true,
            remap: true,
            showUserControls: this.input ? true : false,
            mappingInput: null, // HTMLElement | false
            controlsContainer: null, // selector | element | null
            columns: [], // canonical column spec
            autoThreshold: 0.8,
            allowUnmappedTargets: true,
            setInputValidity: false, // Whether to use setCustomValidity on the file input
            uiRenderer: null, // Custom UI renderer
            mappingMode: 'configToCsv', // Default mapping direction
            allowMultipleSelection: false, // Whether to allow many-to-many mapping
            allowMultiple: false, // Whether to generate multiple columns in output
        }, options || {});
        this.parser = this.opts.parser || new PapaParser();
        this.setColumns(this.opts.columns);
        this.controlsEl = this._resolveNode(this.opts.controlsContainer || null) || this._autoinsertContainer();
        this.setUiRenderer(this.opts.uiRenderer);
        this.transformer = new DataTransformer(this.opts.output ?? {});
        this.transformer.addEventListener('transformationFail', (evt) => {
            const transformationFailEvent = new CustomEvent('transformationFail', evt);
            return this.dispatchEvent(transformationFailEvent);
        });
        this.transformer.addEventListener('validationFail', (evt) => {
            const validationFailEvent = new CustomEvent('validationFail', evt);
            return this.dispatchEvent(validationFailEvent);
        });
        this._onFileChange = this._onFileChange.bind(this);
        if (this.input) {
            this.input.addEventListener('change', this._onFileChange);
        }
    }
    destroy() {
        if (this.input) {
            this.input.removeEventListener('change', this._onFileChange);
        }
        if (this.controlsEl && this.controlsEl.dataset.csvMapperAutocreated === '1')
            this.controlsEl.remove();
        this.uiRenderer.destroy();
    }
    // ===== Public API =====
    getMapping() { return Object.assign({}, this.mapping); }
    setMapping(map) {
        this.mapping = {};
        if (map) {
            Object.entries(map).forEach(([csvHeader, target]) => {
                if (typeof target === 'string') {
                    // Legacy format: string values
                    if (target) {
                        this.addMapping(csvHeader, target);
                    }
                }
                else {
                    // New format: array values
                    target.forEach(configColumn => {
                        if (configColumn) {
                            this.addMapping(csvHeader, configColumn);
                        }
                    });
                }
            });
        }
        this._onMappingChange();
    }
    getHeaders() { return [...this.headers]; }
    getRawRows() {
        if (!this.csv)
            return [];
        return Array.from(this.csv).map(row => {
            const obj = {};
            for (let i = 0; i < this.headers.length; i++) {
                obj[this.headers[i]] = row.get(i) || '';
            }
            return obj;
        });
    }
    getDialect() { return Object.assign({}, this.dialect); }
    redraw() { this.getMappedResult(); }
    setColumns(columns = []) {
        this.columns = columns.map(c => typeof c === 'string' ? { name: c } : Object.assign({}, c));
        this.columns.forEach(c => { if (!c.title)
            c.title = c.name; });
    }
    // Many-to-many mapping API methods
    resetColumnMapping() {
        this.mapping = {};
        this._onMappingChange();
    }
    addColumnMappings(mappings) {
        mappings.forEach(({ csvHeader, configColumn }) => {
            this.addMapping(csvHeader, configColumn);
        });
        this._onMappingChange();
    }
    addColumnMapping(csvHeader, configColumn) {
        this.addMapping(csvHeader, configColumn);
        this._onMappingChange();
    }
    removeColumnMapping(csvHeader, configColumn) {
        this.removeMapping(csvHeader, configColumn);
        this._onMappingChange();
    }
    clearColumnMapping(csvHeader) {
        this.clearMapping(csvHeader);
        this._onMappingChange();
    }
    getColumnMappings(csvHeader) {
        return this.getMappedColumns(csvHeader);
    }
    getAllMappings() {
        const result = {};
        // Include all CSV headers, even if they have no mappings
        this.headers.forEach(header => {
            result[header] = this.getMappedColumns(header);
        });
        return result;
    }
    setUiRenderer(uiRenderer) {
        this.uiRenderer = this._resolveUiRenderer(uiRenderer);
    }
    setCsv(csvText) {
        this._beforeParseCsv(csvText);
        const parsed = this.parser.parseCSV(csvText, {
            headers: this.opts.headers,
            separator: this.opts.separator,
            enclosure: this.opts.enclosure,
            escape: this.opts.escape,
            guessMaxLines: this.opts.guessMaxLines,
        });
        this._afterParseCsv(parsed);
        this.csv = new Csv(parsed.rawRows, parsed.headers);
        this.headers = parsed.headers;
        this.dialect = parsed.dialect;
        return this;
    }
    mapCsv(csvText) {
        if (typeof csvText !== 'undefined') {
            this.setCsv(csvText);
        }
        if (!this.csv) {
            debug('No csv');
            return false;
        }
        // Initialize empty mapping - we'll populate it through auto-mapping or user interaction
        this._autoMap();
        if (this.opts.showUserControls)
            this._renderControls();
        return this.getMappedResult() ?? false;
    }
    getMappedResult() {
        this.isValid = true;
        this._renderControls();
        const beforeMapEvent = new CustomEvent('beforeMap', { detail: { csv: this.csv } });
        this.dispatchEvent(beforeMapEvent);
        // Validate mapping
        const result = this._validateMapping();
        if (result.isValid) {
            // Trigger afterMap event when mapping changes
            const { data, csv, validation } = this._produceOutput();
            const amEvent = new CustomEvent('afterMap', { detail: { rows: data.rows, csv } });
            this.dispatchEvent(amEvent);
            // Update mapping input
            const mappingInput = this._resolveNode(this.opts.mappingInput || null);
            if (mappingInput instanceof HTMLInputElement) {
                mappingInput.value = JSON.stringify(this.mapping);
            }
            this._renderControls(validation);
            return { data, csv, validation };
        }
    }
    _resolveUiRenderer(uiRenderer) {
        if (typeof uiRenderer === 'string') {
            switch (uiRenderer) {
                default:
                    uiRenderer = new DefaultUIRenderer();
            }
        }
        else {
            uiRenderer = uiRenderer || new DefaultUIRenderer();
        }
        uiRenderer.onMappingChange((sourceHeader, targetColumn) => {
            debug(`Mapping changed for ${sourceHeader} to ${targetColumn}`);
            // Check if this is a removal request in the format "csvHeader|configColumn"
            if (!targetColumn && sourceHeader.includes('|')) {
                const [csvHeader, configColumn] = sourceHeader.split('|');
                this.removeMapping(csvHeader, configColumn);
            }
            else if (targetColumn) {
                // Only add multiple mappings if allowMultipleSelection is enabled
                if (this.opts.allowMultipleSelection) {
                    this.addMapping(sourceHeader, targetColumn);
                }
                else {
                    // For single selection mode, clear any existing mapping first
                    this.clearMapping(sourceHeader);
                    this.mapping[sourceHeader] = targetColumn;
                }
            }
            else {
                this.clearMapping(sourceHeader);
            }
            debugTable(this.mapping);
            this._onMappingChange();
            return this.mapping;
        });
        return uiRenderer;
    }
    async _onFileChange() {
        this.isValid = true;
        this.csv = null;
        this.uiRenderer.reset();
        if (this.input) {
            const file = this.input.files && this.input.files[0];
            if (!file)
                return;
            const afterReadEventOb = { detail: { text: await file.text() } };
            const bpEvent = new CustomEvent('afterRead', afterReadEventOb);
            this.dispatchEvent(bpEvent);
            this.mapping = {};
            this.mapCsv(afterReadEventOb.detail.text);
        }
    }
    _beforeParseCsv(csv) {
        this.dispatchEvent(new CustomEvent('beforeParseCsv', { detail: { csv } }));
    }
    _afterParseCsv(csv) {
        this.dispatchEvent(new CustomEvent('afterParseCsv', { detail: { csv } }));
    }
    _autoMap() {
        AutoMapper.map(this.headers, this.columns, this.opts.mappingMode, this.opts.autoThreshold || 0.8, this.mapping);
        this._mappingChangeEvent();
    }
    _validateMapping() {
        const { isValid, mappedTargets, missingRequired } = this.validateRequiredColumns();
        this.isValid = isValid;
        if (isValid === false) {
            const mappingFailEvent = new CustomEvent('mappingFailed', {
                detail: {
                    isValid: this.isValid,
                    mappedTargets,
                    mapping: this.mapping,
                    missingRequired
                }
            });
            this.dispatchEvent(mappingFailEvent);
        }
        else {
            const mappingSuccessEvent = new CustomEvent('mappingSuccess', {
                detail: {
                    isValid: this.isValid,
                    mappedTargets,
                    mapping: this.mapping
                }
            });
            this.dispatchEvent(mappingSuccessEvent);
        }
        // Set input validity if enabled
        if (this.opts.setInputValidity && this.input) {
            if (isValid) {
                this.input.setCustomValidity('');
            }
            else {
                const message = `Missing required columns: ${missingRequired.join(', ')}`;
                this.input.setCustomValidity(message);
            }
            this.input.reportValidity();
        }
        return { isValid, mappedTargets, missingRequired };
    }
    _onMappingChange() {
        this.isValid = true;
        this._mappingChangeEvent();
        this.getMappedResult();
    }
    _mappingChangeEvent() {
        const mappingChangeEvent = new CustomEvent('mappingChange', {
            detail: { mapping: this.mapping }
        });
        this.dispatchEvent(mappingChangeEvent);
    }
    /**
     * Checks if all required columns are mapped
     * @returns Object with validation status and missing required columns
     */
    validateRequiredColumns() {
        const missingRequired = [];
        // Get all mapped targets using the helper method
        const mappedTargets = this.getAllMappedTargets();
        const mappedTargetsSet = new Set(mappedTargets);
        for (const spec of this.columns) {
            if ((spec.required && (typeof spec.defaultValue === 'undefined')) && !mappedTargetsSet.has(spec.name)) {
                missingRequired.push(spec.name);
            }
        }
        return {
            isValid: missingRequired.length === 0,
            missingRequired,
            mappedTargets
        };
    }
    // Helper methods for managing flexible mapping structure
    addMapping(csvHeader, configColumn) {
        const current = this.mapping[csvHeader];
        if (!current) {
            this.mapping[csvHeader] = configColumn;
        }
        else if (typeof current === 'string') {
            // Convert single value to array if adding another
            if (current !== configColumn) {
                this.mapping[csvHeader] = [current, configColumn];
            }
        }
        else {
            // Already an array, add if not present
            if (!current.includes(configColumn)) {
                current.push(configColumn);
            }
        }
    }
    removeMapping(csvHeader, configColumn) {
        const current = this.mapping[csvHeader];
        if (!current)
            return;
        if (typeof current === 'string') {
            if (current === configColumn) {
                delete this.mapping[csvHeader];
            }
        }
        else {
            const index = current.indexOf(configColumn);
            if (index > -1) {
                current.splice(index, 1);
                if (current.length === 0) {
                    delete this.mapping[csvHeader];
                }
                else if (current.length === 1) {
                    // Convert back to single value
                    this.mapping[csvHeader] = current[0];
                }
            }
        }
    }
    clearMapping(csvHeader) {
        delete this.mapping[csvHeader];
    }
    getMappedColumns(csvHeader) {
        const current = this.mapping[csvHeader];
        if (!current)
            return [];
        return typeof current === 'string' ? [current] : [...current];
    }
    getAllMappedTargets() {
        const targets = new Set();
        Object.values(this.mapping).forEach(value => {
            if (typeof value === 'string') {
                targets.add(value);
            }
            else {
                value.forEach(col => targets.add(col));
            }
        });
        return Array.from(targets);
    }
    // Convert internal mapping to simple format for UI compatibility
    getSimpleMapping() {
        const simple = {};
        Object.entries(this.mapping).forEach(([csvHeader, value]) => {
            if (typeof value === 'string') {
                simple[csvHeader] = value;
            }
            else if (value.length > 0) {
                // For UI, just show the first mapping
                simple[csvHeader] = value[0];
            }
        });
        return simple;
    }
    // Get reverse mapping for configToCsv mode (configColumn -> csvHeader)
    getReverseMapping() {
        const reverse = {};
        Object.entries(this.mapping).forEach(([csvHeader, value]) => {
            if (typeof value === 'string') {
                reverse[value] = csvHeader;
            }
            else if (value.length > 0) {
                // For many-to-many: each config column should map to the same CSV header
                value.forEach(configColumn => {
                    reverse[configColumn] = csvHeader;
                });
            }
        });
        return reverse;
    }
    _produceOutput() {
        // Check for missing required columns first
        const validationResult = this.validateRequiredColumns();
        if (!validationResult.isValid) {
            throw new Error(`Required columns are not mapped: ${validationResult.missingRequired.join(', ')}`);
        }
        const csvData = this.csv ?? new Csv();
        const transformationResult = this.transformer.transform(csvData, this.mapping, this.columns);
        const data = transformationResult.data;
        const validation = transformationResult.validation;
        const csv = transformationResult.csv;
        if (validation.totalErrors > 0) {
            const validationFailedEvent = new CustomEvent('validationFailed', { detail: { ...transformationResult } });
            this.dispatchEvent(validationFailedEvent);
            this.isValid = false;
            if (this.input) {
                const errors = validation.errors;
                const pl = errors.length > 1;
                let errorMessage = `There ${pl ? 'were' : 'was'} ${errors.length} total validation/transformation error${pl ? 's' : ''} across ${validation.errorRows} ${validation.errorRows > 1 ? 'rows' : 'row'}:\n` + errors.slice(0, 5).map((e) => {
                    return `Row ${e.rowIndex} [${e.field}] {${limitString(String(e.value), 20)}}`;
                }).join('\n');
                if (errors.length > 5) {
                    errorMessage += '\n...and ' + (errors.length - 5) + ' more errors';
                }
                if (this.opts.setInputValidity) {
                    this.input.setCustomValidity(errorMessage);
                    this.input.reportValidity();
                }
            }
        }
        else {
            const validationSuccessEvent = new CustomEvent('validationSuccess', { detail: { ...transformationResult } });
            this.dispatchEvent(validationSuccessEvent);
            if (this.opts.setInputValidity && this.input) {
                this.input.setCustomValidity('');
                this.input.reportValidity();
            }
        }
        return { data, csv, validation };
    }
    // ===== UI =====
    _renderControls(validation = { errors: [], totalRows: 0, errorRows: 0, totalErrors: 0, errorsByField: {} }) {
        if (!this.controlsEl || !this.opts.showUserControls)
            return;
        if (!this.headers.length) {
            this.uiRenderer.showMessage?.('No CSV loaded. Choose a file to begin.');
            return;
        }
        // Get current mapping status
        const mappingStatus = this._getMappingStatus();
        // Get appropriate mapping for UI based on mode
        const mappingMode = this.opts.mappingMode || 'csvToConfig';
        const currentMapping = mappingMode === 'configToCsv' ? this.getReverseMapping() : this.getSimpleMapping();
        // Prepare render options
        const renderOptions = {
            headers: this.headers,
            columnSpecs: this.columns,
            currentMapping,
            fullMapping: this.mapping, // Pass the full many-to-many mapping
            mappingResult: mappingStatus,
            validation,
            rowCount: this.csv?.length || 0,
            dialect: this.dialect,
            mappingMode,
            allowMultipleSelection: this.opts.allowMultipleSelection
        };
        // Render using the UI renderer
        this.uiRenderer.render(this.controlsEl, renderOptions);
    }
    _getMappingStatus() {
        const requiredColumns = this.columns.filter(c => c.required === true);
        const mappedTargets = this.getAllMappedTargets();
        const mappedTargetsSet = new Set(mappedTargets);
        const missingRequired = requiredColumns.filter(col => !mappedTargetsSet.has(col.name));
        return {
            isValid: missingRequired.length === 0,
            missingRequired: missingRequired.map(c => c.title || c.name),
            mappedColumns: mappedTargets
        };
    }
    _banner(text) { return `<div class="csvm-note">${CsvMapper.escape(text)}</div>`; }
    // ===== Helpers =====
    _resolveNode(ref) {
        if (!ref)
            return null;
        if (typeof ref === 'string')
            return document.querySelector(ref);
        return ref;
    }
    _autoinsertContainer() {
        if (!this.opts.showUserControls || !this.input)
            return null;
        const d = document.createElement('div');
        d.dataset.csvMapperAutocreated = '1';
        this.input.insertAdjacentElement('afterend', d);
        return d;
    }
    // ---------- CSV core - delegates to PapaParser ----------
    static parseCSV(text, options = {}) {
        const parser = new PapaParser();
        return parser.parseCSV(text, options);
    }
    static detectDialect(text, options = {}) {
        const parser = new PapaParser();
        return parser.detectDialect(text, options);
    }
    static toCsvRow(arr, sep = ',', quote = '"', esc = null) {
        const parser = new PapaParser();
        return parser.toCsvRow(arr, sep, quote, esc);
    }
    static _validateValue(fieldValue, validator) {
        if (typeof validator === 'string') {
            validator = { type: validator };
        }
        if (validator instanceof RegExp)
            return CsvMapper._validateRegex(fieldValue, validator);
        if (typeof validator === 'function')
            return !!validator(fieldValue);
        if (validator && typeof validator === 'object') {
            const validationType = validator.type;
            if (['date', 'time', 'datetime'].includes(validationType)) {
                // default datetime value
                let validationRegex = /^\d{2,4}([./-])\d{2}\1\d{2,4} \d{2}([.:])\d{2}\2\d{2}$/;
                switch (validationType) {
                    case 'date':
                        validationRegex = /^\d{2,4}([./-])\d{2}\1\d{2,4}$/;
                        break;
                    case 'time':
                        validationRegex = /^\d{2}([.:])\d{2}\1\d{2}$/;
                        break;
                }
                const format = validator.format ?? null;
                if (format !== null) {
                    validationRegex = CsvMapper.dateFormatToRegex(format);
                }
                return CsvMapper._validateRegex(fieldValue, validationRegex);
            }
            if (['tel', 'telephone', 'phone'].includes(validationType)) {
                const phoneRegex = /^[\d\s()+-]+$/;
                return CsvMapper._validateRegex(fieldValue, phoneRegex);
            }
            if (validationType === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return CsvMapper._validateRegex(fieldValue, emailRegex);
            }
            if (validationType === 'number') {
                const num = Number(String(fieldValue).replace(',', '.'));
                if (Number.isNaN(num))
                    return false;
                if (validator.min != null && num < validator.min)
                    return false;
                if (validator.max != null && num > validator.max)
                    return false;
                return true;
            }
            if (validationType === 'boolean') {
                const s = String(fieldValue).trim().toLowerCase();
                return ['1', '0', 'true', 'false', 'yes', 'no', 'y', 'n', ''].includes(s);
            }
        }
        console.error('Invalid validation type given', validator);
        throw new Error('Invalid validation type given');
    }
    static dateFormatToRegex(format, { anchors = true, allowUppercaseMD = true, } = {}) {
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        switch (format.toLowerCase()) {
            case 'iso8601': // example: 2005-08-15T15:52:01+0000
                return /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
            case 'rfc822': // example: Mon, 15 Aug 05 15:52:01 +0000
                return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d{2}|\d{4})\s(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;
            case 'rfc850': // example: Monday, 15-Aug-05 15:52:01 UTC
                return /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s(0[1-9]|[12]\d|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;
            case 'rfc1036': // example: Mon, 15 Aug 05 15:52:01 +0000
                return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|[PMCE][SD]T|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;
            case 'rfc1123': // example: Mon, 15 Aug 2005 15:52:01 +0000
                // 4-digit year; allows GMT/UT or numeric offset
                return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|UT|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;
            case 'rfc7231': // example: Sat, 30 Apr 2016 17:52:13 GMT
                // IMF-fixdate (HTTP-date) — must be GMT
                return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;
            case 'rfc2822': // example: Mon, 15 Aug 2005 15:52:01 +0000
                // Optional weekday; 4-digit year; seconds optional; numeric offset or common (obs-zone) names
                return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(0?[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;
            case 'w3c': // example: 2005-08-15T15:52:01+00:00
                // W3C-DTF (subset of ISO 8601): strict 'T', optional fractional seconds, 'Z' or ±HH:MM
                return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
        }
        const map = {
            // Years
            'X': '[-+]\\d{4}\\d*', // at least 4-digit year with - for BCE and + for CE, e.g. +0012, -1234, +1066, +2025
            'Y': '-?\\d{4}\\d*', // at least 4-digit year, e.g. 0012, -1234, 1066, 2025
            'y': '-?\\d+',
            // Months
            'F': '(?:(?i)January|February|March|April|May|June|July|August|September|October|November|December)',
            'M': '(?:(?i)Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',
            'm': '(?:0[1-9]|1[0-2])', // 01-12
            'n': '(?:[1-9]|1[0-2])', // 1-12 (no leading 0)
            // Days
            'l': '(?:(?i)Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)',
            'D': '(?:(?i)Mon|Tue|Wed|Thu|Fri|Sat|Sun)',
            'd': '(?:0[1-9]|[12]\\d|3[01])', // 01-31
            'j': '(?:[1-9]|[12]\\d|3[01])', // 1-31 (no leading 0)
            'S': '(?:(?i)st|nd|rd|th)', // 1st, 2nd, 3rd, 4th, etc.
            // Hours / minutes / seconds
            'a': '(am|pm)',
            'A': '(AM|PM)',
            'h': '(?:[0][0-9]|1[0-2])', // 00-12
            'H': '(?:[01]\\d|2[0-3])', // 00-23
            'g': '(?:\\d|1[0-2])', // 0-12
            'G': '(?:\\d|1\\d|2[0-3])', // 0-23
            'i': '[0-5]\\d', // 00-59
            's': '[0-5]\\d', // 00-59
            // Misc handy ones if you need them later:
            'U': '\\d+', // seconds since Unix epoch
        };
        if (allowUppercaseMD) {
            map['M'] = map['m'];
            map['D'] = map['d'];
        }
        let out = '';
        for (let i = 0; i < format.length; i++) {
            const ch = format[i];
            // Backslash escapes the next character (PHP-style)
            if (ch === '\\') {
                i++;
                if (i < format.length)
                    out += esc(format[i]);
                continue;
            }
            out += map[ch] || esc(ch);
        }
        return new RegExp((anchors ? '^' : '') + out + (anchors ? '$' : ''));
    }
    static _validateRegex(value, regex) {
        return regex.test(String(value));
    }
    static escape(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] || c));
    }
}
// Attach UI renderers as static properties for easy access
CsvMapper.DefaultUIRenderer = DefaultUIRenderer;

export { CsvMapper as default };
//# sourceMappingURL=csv-mapper.esm.js.map
