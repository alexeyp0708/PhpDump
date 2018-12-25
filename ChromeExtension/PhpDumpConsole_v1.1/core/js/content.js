// инициализация script_content. 
class DumpManager{
	constructor(port){
		this.dump=[];
		this.setPort(port);
	}
	setPort(port){
		this.port=port;
	}
	getDump(){
		return this.dump;
	}
	addDump(dump){
		this.dump.push(dump);
		
	}
	clearDump(){
		this.dump=[];
	}
	renderStack(dump=false){
		if(dump===false){
			dump =this.dump;
		}
		for (var z in dump){
			console.group(dump[z].details.response.type+'=>'+dump[z].details.response.url);
			console.info('Request :',{details:dump[z].details});
			for(var i in dump[z].data.stack){
				for(var j in dump[z].data.stack[i]){
					console.log(j+' :',dump[z].data.stack[i][j].data,typeof(dump[z].data.stack[i][j].backtrace)!=='undefined'?dump[z].data.stack[i][j].backtrace:'');
				}
			}
			console.groupEnd();
		}
	}
	renderDump(dump=false){
		if(dump===false){
			dump =this.dump;
		}
		for(var z in dump){
			console.log(dump[z]);
		}
	}
	saveStorageAllSettings(){
		// сохранить дамп в файл. 
		this.port.postMessage({destination:'saveStorageAllSettings'});
	}
	/**
	settings=[{
			url:'', // урл к которому будут применены настройки
			regexp:'', // регулярное выражение для дочерних ресурсов принцип url+regexp.
			turn_on:'',
			debug_backtrace:'',
		}...]
	*/
	setSettings(settings=[],save=false){	
		// установить настройки
		var self=this;
		var sym_pattern=/[\[,\],\{,\},\(,\),\\,\^,\$,\.,\|,\?,\*,\+]/ig;
		var n_settings=[];
		var buf=[];
		var n_settings={};
		for(var m in settings){
			buf[m]={};
			if(!('url' in settings[m])){
				buf[m].url=window.location.href;
			} else{
				buf[m].url=settings[m].url;
			}
			if(!('regexp' in settings[m])){
				buf[m].regexp='';
			} else {
				buf[m].regexp=settings[m].regexp;
			}
			buf[m].url=buf[m].url.trim()!=''?'^'+buf[m].url.replace(sym_pattern,"\\$&"):'';
			
			if(buf[m].url[0]=='^' && buf[m].regexp[0]=='^'){
				buf[m].regexp=buf[m].regexp.substr(1);
			}
			var pattern=buf[m].url+buf[m].regexp;
			n_settings[pattern]={dump_settings:{}};
			for(var i in settings[m]){
				switch(i){
					case 'url':
					case 'regexp':
					break;
					default:
						n_settings[pattern].dump_settings[i]=settings[m][i];
					break;	
				}
			}
		}
		this.port.postMessage({destination:'setSiteDumpSettings',data:{settings:n_settings,save:save}});
		
		/*var port = chrome.runtime.connect({name: 'debuger_command'});
		port.postMessage({command:'setSiteDumpSettings',settings:n_settings,reload:true});
		port.onMessage.addListener(function call(msg) {
			if(msg.command=='setSiteDumpSettings'){
				//self.reload();
			}
		});*/
	}
	renderSettings(callback=false){
		var result=false;
		this.port.postMessage({destination:'getDumpSettings'});	
		this.port.onMessage.addListener(function call(msg,port) {
			if (msg.destination == 'getDumpSettings' && 'return' in msg.data){
				if(typeof callback=='function'){
					callback(msg.data.return);
				} else {
					console.log(msg.data.return);
				}
			}
			port.onMessage.removeListener(call);
		});
	}
	clearSettings(urls=false,save=false){
		// сбросить настройки по url 
		var self=this;
		var sym_pattern=/[\[,\],\{,\},\(,\),\\,\^,\$,\.,\|,\?,\*,\+]/ig;
		if(urls==false){
			urls =[{url:window.location.href}];
		}
		var patterns={};	
		for(var i in urls){
			var url=urls[i];
			if(url instanceof RegExp){
				urls[i] ={regexp:url.source};
			} else if(typeof url=='string'){
				urls[i]={url:urls,type:'link'};
			}
			if(!('url' in urls[i])){
				urls[i].url=window.location.href;
			}
			if('type' in urls[i] && urls[i].type=='link'){
				patterns[urls[i].url]={type:'link'};
			} else {
				if(!('regexp' in urls[i])){
					urls[i].regexp='';
				} 
				urls[i].url=urls[i].url.trim()!=''?'^'+urls[i].url.replace(sym_pattern,"\\$&"):'';
				if(urls[i].url[0]=='^' && urls[i].regexp[0]=='^'){
					urls[i].regexp=urls[i].regexp.substr(1);
				}
				patterns[urls[i].url+urls[i].regexp]={};
			}
		}
		this.port.postMessage({destination:'clearSiteDumpSettings',data:{patterns:patterns, save:save,reload:true}});
	}
	clearAllSettings(save=false){
		this.port.postMessage({destination:'clearSiteDumpSettings',data:{urls:false, save:save,reload:true}});
	}
	// настройки хашкеев как и бакгроунд
	setHashKey(param)
	{
		/*{ hashkey:'',greeting_client:'',greeting_server:''}*/
		var self=this;
		console.log('Warn:If there is a hashkey in the database, it will be overwritten.');
		if(!('hashkey' in param && 'greeting_client' in param && 'greeting_server' in param)){
			console.warn('Object must have properties:domain,hashkey,greeting_client,greeting_server. If the domain is not specified then the current domain is taken');
			return;
		}
		this.port.postMessage({destination:'setHashKey',data:param});
	}
	deleteHashKey(param){
		this.port.postMessage({destination:'deleteHashKey',data:param});
	}
	getAuthHashKeys(callback=false){
		this.port.postMessage({destination:'getAuthHashKeys'});
		this.port.onMessage.addListener(function call(msg,port) {
			if (msg.destination == 'getAuthHashKeys' && 'return' in msg.data){
				if(typeof callback=='function'){
					callback(msg.data.return);
				} else{
					console.log(msg.data.return);
				}
			}
			port.onMessage.removeListener(call);
		});
	}
	bindHashKeyDomain(param={}){
		if(!('domain' in param)){
			param.domain=window.location.hostname;
		}
		//param:{hashkey:'',domain:''}
		this.port.postMessage({destination:'bindHashKeyDomain',data:param});
	}
	unbindHashKeyDomain(param={}){
		if(!('domain' in param)){
			param.domain=window.location.hostname;
		}
		//param:{hashkey:'',domain:''}
		this.port.postMessage({destination:'unbindHashKeyDomain',data:param});
	}
	reload(){
		window.location.reload();
	}
}


var sw=new MessageSwitch();
sw.connect({filter:{name:['content_script']}});
sw.addListener({
	event:'message',
	destination:'render_dump',
	filter:{name:['content_script']},
	call:function(msg,self,msg_port){
		dm.addDump(msg.data);
		dm.renderStack([msg.data]);
	}
});
var port=sw.getFilteredPorts({filter:{name:['content_script']}})[0].port;
var dm=new DumpManager(port);
chrome.runtime.onMessage.addListener(function call(dump,sender,sendResponse){
	dm.addDump(dump);
	dm.renderStack([dump]);
	sendResponse(true); 
	//chrome.runtime.onMessage.removeListener(call);
	return true;
});

//



