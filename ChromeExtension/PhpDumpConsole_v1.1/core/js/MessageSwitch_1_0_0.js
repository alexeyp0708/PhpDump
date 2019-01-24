class MessageSwitch  { 
	constructor(global=false){
		this.default_settings={
			ports:[],
			filter:{
				name:[],
				tabId:[],
				extId:[],
			}
		};
		this.env=('tabs' in chrome)?'background':'content';
		this.stack={
			ports:{maps:new Map(),stack:{}},
			listener:{
				connect:{
					maps:new Map(),
					stack:[]
				},
				disconnect:{
					maps:new Map(),
					stack:[]
				},
				message:{
					maps:new Map()	
				}		
			}
		};
		if(global!=false){
			if(global in MessageSwitch.prototype.stacks){
				this.stack=MessageSwitch.prototype.stacks[global];
			} else {
				MessageSwitch.prototype.stacks[global]=this.stack;
			}
		}
	}
	getSettings(...arg){                
		var new_settings=Object.assign({},this.default_settings);
		new_settings.filter=Object.assign([],this.default_settings.filter);
		for(var settings of arg){
			for(var i in this.default_settings){
				switch (i){
					/*case 'ports': //
						if('ports' in settings && settings.ports.length>0){
							for (var port of settings.ports){
								if('sender' in port){
									var buf_settings={filter:{name:[port.name],extId:[port.sender.id],tabId:('tab' in port.sender)?[port.sender.tab.id]:[]}};
								} else {
									var buf_settings={filter:{name:[port.name]}};
								}
								new_settings=this.getSettings(new_settings,buf_settings);
							}
							//console.log(new_settings,buf_settings);
						}
					break; */
					case 'filter':
						if(i in settings){
							for(var j in new_settings[i]){
								if(j in settings[i]){
									if(!Array.isArray(settings[i][j])){
										settings[i][j]=[settings[i][j]];
									}
									new_settings[i][j]=new_settings[i][j].concat(settings[i][j]);
								}
							}
						}
					break;
					default: new_settings[i]=(i in settings)?settings[i]:new_settings[i];
				}
			}
		}
		return new_settings;
	}
	connect(settings={}){ // type c tab or devTools or Extensions 
		var self=this;	
		settings=self.getSettings(settings);
		var first_ports=[]; // settings.ports в first_ports
		if(settings.filter.extId.length>0){
			// исключить совпадения в массиве
			// проверить наличие порта
			for(extId of settings.filter.extId){
				for(name of self.settings.filter.name){
					if(self.getFilteredPorts({name:[name],extId:[extId]}).length>0){
						continue;
					}
					first_ports.push({
						name:name,
						extId:extId,
						tabId:'any',
						port:chrome.runtime.connect(extId,{ // могут инициировать вкладки и расширения для инициализации связи с др расширением
							name:name
						})
					});
				}
			}
		} else 
		if(settings.filter.tabId.length>0 && self.env=='background'){ 
			for(var tabId of settings.filter.tabId){
				for(var name of settings.filter.name){
					if(self.getFilteredPorts({name:[name],extId:[chrome.runtime.id],tabId:[tabId]}).length>0){
						continue;
					}
					first_ports.push({
						name:name,
						tabId:tabId,
						extId:chrome.runtime.id,
						port:chrome.tabs.connect(tabId,{ // могут инициировать расширения для связи с вкладкой
							name:name
						})
					});
				}
			}
		} else if(self.env=='content'){
			for(var name of settings.filter.name){
				if(self.getFilteredPorts({name:[name],extId:[chrome.runtime.id],tabId:[tabId]}).length>0){
					continue;
				}
				first_ports.push({
					name:name,
					extId:chrome.runtime.id,
					tabId:'any',
					port:chrome.runtime.connect({  //могут инициализировать вкладки для связи с текущим расширением.
						name: name
					})
				});
			}
		}
		//first_port - поместить как отложенные порты.  если у портов коннектед проходит то помещаются в постоянный стек. сделать для тогобы чтобы синхронные операции (post addListener)проходили при конекте. 
		for(var  i in first_ports){
			var first_port=first_ports[i];
			first_port.port.onDisconnect.addListener(function(port){
				self.disconnect({ports:[port]});
			});
			if(self.isRegistredPort(first_port.port)==false){
				self.registredPort(first_port.port,{name:first_port.name,extId:first_port.extId,tabId:first_port.tabId});
			}	
			/*var callOnMessage=function call(msg,msg_port){
				// оценить вариант записи в стек порта др расширения
				if(msg.connected!==true){return;} 
				if(self.isRegistredPort(msg_port)==false){ //проверяем был ли ранне обьект порта зарегестрирован
					delete first_ports[i];
					self.registredPort(msg_port,{name:msg_port.name,extId:first_port.extId,tabId:first_port.tabId});
					msg_port.onDisconnect.addListener(function(port){
						self.disconnect({port:port});
					});
					self.triggerConnected(msg_port);
				};
				msg_port.onMessage.removeListener(call);
			};
			first_port.port.onMessage.addListener(callOnMessage); */
		}
		var callOnConnect=function call(connect_port){
			if(!self.isInFilteredPort(connect_port,settings.filter)){ 
				return;
			}
			connect_port.is_connected=true;
			// прописать удаление first_port из стека. при удовлетворении условий т.е.  точное сравнение connect_port и first_port 
			if(self.isRegistredPort(connect_port)==false){
				connect_port.onDisconnect.addListener(function(port){
					self.disconnect({ports:[port]});
				});
				var param={name:connect_port.name,extId:'any',tabId:'any'};
				if('sender' in connect_port){
					param.extId=connect_port.sender.id;
					if('tab' in connect_port.sender){
						param.tabId=connect_port.sender.tab.id;
					}
				} 
				self.registredPort(connect_port,param);
				connect_port.postMessage({connected:true});
				self.triggerConnected(connect_port);
			}
		}
		chrome.runtime.onConnect.removeListener(self.noConnection);
		chrome.runtime.onConnect.addListener(callOnConnect);
		chrome.runtime.onConnect.addListener(self.noConnection);
	}
	disconnect(settings={}){
		//console.log('disconnect');
		if('ports' in settings){
			for(var port of settings.ports){
				this.triggerDisconnected(port);
				this.unRegistredPort(port);
				port.disconnect();
			}
		}
		if('filter' in settings){
			var ports =this.getFilteredPorts(settings.filter);
			for(port of ports){
				this.triggerDisconnected(port.port);
				this.unRegistredPort(port.port);
				port.port.disconnect();
			}
		}	
	}
	registredPort(port,settings={name:'any',extId:'any',tabId:'any'}){
		var ports=this.stack.ports;
		if(!(settings.name in ports.stack)){
			ports.stack[settings.name]={};
		}
		settings.name=port.name;
		if(('sender' in port) && typeof(port.sender)!=='undefined'){
			settings.extId=port.sender.id;
			if('tab' in port.sender){
				settings.tabId=port.sender.tab.id;
			}
		}
		var pp=ports.stack[settings.name];
		if(!(settings.extId in pp)){
			pp[settings.extId]={};
		}
		pp=pp[settings.extId];
		if(!(settings.tabId in pp)){
			pp[settings.tabId]={port:port};
		} else {
			var buf=pp[settings.tabId].port;
			buf.disconnect();
			ports.maps.delete(buf);
			pp[settings.tabId].port=port;
		}
		pp=pp[settings.tabId];
		//pp.push(port);
		//settings.position=pp.length-1; 
		ports.maps.set(port,settings);
		return true;
	}
	unRegistredPort(port){
		var ports=this.stack.ports;
		var settings=ports.maps.get(port);
		if(typeof settings=='undefined'){
			return true;
		}
		ports.maps.delete(port);
		if(
			settings.name in ports.stack &&
			settings.extId in ports.stack[settings.name] &&
			settings.tabId in ports.stack[port.name][settings.extId]
		){
			 //delete ports.stack[port.name][settings.extId][settings.tabId].port;
			 delete ports.stack[port.name][settings.extId][settings.tabId];
		} 
	}
	isRegistredPort(port){
		return this.stack.ports.maps.has(port);
	}
	/// проверяем подходит ли порт под условие фильтра 
	isInFilteredPort(port,filter={name:[],extId:[],tabId:[]}){
		var buf={};
		var res=[];
		var names=['name','extId','tabId'];
		var count=0;
		var data={};
		var recurs=function(data,ftr){
            if(count>=names.length){
				return true;
            }
			if(ftr.length>0){
				if(ftr.indexOf(data[names[count]])!=-1){
					count++;
					 res=recurs(data,filter[names[count]]);
					count--;
				} else {
					res= false;
				}
			} else {
				count ++;
				res= recurs(data,filter[names[count]]);
				count --;
			}
			return res;
        }
		data.name=port.name;
		data.extId='any';
		data.tabId='any';
		if('sender' in port){
			data.extId=port.sender.id;
			if('tab' in port.sender){
				data.tabId=port.sender.tab.id;
			}
		}
		if(this.env=='background'){
			filter=Object.assign({name:[],extId:[],tabId:[]},filter);
			
		} else if(this.env=='content'){
			filter=Object.assign({name:[],extId:[]},filter,{tabId:[]});
		}
		return recurs(data,filter[names[count]]);
	}
	/// запрашиваем порты в стеке согласно фильтру. 
	getFilteredPorts(filter={name:[],extId:[],tabId:[]}){
		var names=['name','extId','tabId'];
		var count=0;
		var res=[];
		filter=Object.assign({name:[],extId:[],tabId:[]},filter);
		var recurs =function(obj,ftr){
			if(count>=names.length){
				res.push(obj);	
			} else {
                if(ftr.length>0){
                    for(var i in ftr){
                        if(ftr[i] in obj){
							count++;
                            recurs(obj[ftr[i]],filter[names[count]]);
							count--;
                        } 
                    }
                } else {
                    for(var j in obj){
						count++;			
                        recurs(obj[j],filter[names[count]]);
						count--;
                    }
                }
            }
		}
		recurs(this.stack.ports.stack,filter[names[count]]);
		return res;		
    }
	
	/**
		param.distaneiton  string -required
		param.data  any -requiried
		param.answer function - optional 
		param.filter -{name:[],extId:'ext_id',tabId:'tabId'}
		param.defer_connect true/false
	*/
	post(param={}){
		var self=this;
		if('destination' in param){
			var destination=param.destination;
		} else {
			return;
		}
		if('data' in param){
			var data =param.data;
		} else {
			return;
		}
		var filter={name:[],extId:[],tabId:[]};
		if('filter' in param){
			filter=Object.assign(filter,param.filter);
		}
		var defer_connect=false;
		if('defer_connect' in param){
			defer_connect=param.defer_connect;
		}
		if('answer' in param){ 
			self.addListener({event:'message',destination:destination,call:param.answer,filter:filter,defer_connect:defer_connect});
		}
		var ports=self.getFilteredPorts(filter);
		for(var port of ports){
			port.port.postMessage({destination:destination,data:data});
		}
		
		// 
		if(defer_connect!=false){
			if(ports.length==0 || defer_connect.always==true ){
				self.addListener({
					event:'connect',
					filter:filter,
					destination:'post',
					call:function call(port){
						port.postMessage({destination:destination,data:data});
						if(defer_connect.remove==true){
							self.removeListener({event:'connect',destination:'post',call:call,port:port});
						}
					}
				});
			}
		}
	}
	/**
		param.event default 'message'
			param.event =message
			param.destination string required .
			param.call - function required.
			param.self - objects optional. управляющий обьект 
			param.filter -{name:[],extId:'ext_id',tabId:'tabId'}
			param.defer_connect {remove:true/false,always:false}/false
			----------
			param.event =connect
			param.call - function required.
			param.destination string
			param.filter -{name:[],extId:['ext_id'],tabId:['tabId']} 
	*/
	addListener(param={}){ //
		let self=this;
		let event='message';
		if('event' in param){
			event=param.event;
		}
		if('call' in param){
			var callback=param.call;
		}else{
			return;
		}
		var slf=this;
		if('self' in param){
			var slf=param.self;
		}
		var filter={name:[],extId:[],tabId:[]};
		if('filter' in param){
			filter=Object.assign(filter,param.filter);
		}
		var defer_connect=false;
		if('defer_connect' in param){
			defer_connect=param.defer_connect;
		}
		if(event=='message'){
			if('destination' in param){
				var destination=param.destination;
			}else {
				return;
			}
			var ports=this.getFilteredPorts(filter);
			for(let port of ports){
				self.__triggerListener(port.port,{destination:destination,call:callback},slf);
			}
			if(defer_connect!=false){
				if(ports.length<=0 || defer_connect.always==true ){
					self.addListener({
						event:'connect',
						filter:filter,
						destination:destination,
						call:[
								callback,
								function call(port){
									self.__triggerListener(port,{destination:destination,call:callback},slf);
									if(defer_connect.remove==true){
										self.removeListener({event:'connect',destination:destination,call:callback,port:port});
									}
								}
							]
					});
				}
			}
		} else if(event=='connect'){
			var destination='no_dst';
			if('destination' in param){
				destination=param.destination;
			}
			if(typeof callback=='function'){
				var ck=callback;
				var cv={call:callback,destination:destination,filter:filter};
			} else if(Array.isArray(callback)){
				var ck=callback[0];
				var cv={call:callback[1],destination:destination,filter:filter};
			}
			var len=self.stack.listener.connect.stack.push(cv);
			cv._position=len-1;
			if(!self.stack.listener.connect.maps.has(ck)){
				self.stack.listener.connect.maps.set(ck,[]);
			}
			self.stack.listener.connect.maps.get(ck).push(cv);
		} else if (event =='disconnect'){
			var destination='no_dst';
			if('destination' in param){
				destination=param.destination;
			}
			if(typeof callback=='function'){
				var ck=callback;
				var cv={call:callback,destination:destination,filter:filter};
			} else if(Array.isArray(callback)){
				var ck=callback[0];
				var cv={call:callback[1],destination:destination,filter:filter};
			}
			var len=self.stack.listener.disconnect.stack.push(cv);
			cv._position=len-1;
			if(!self.stack.listener.disconnect.maps.has(ck)){
				self.stack.listener.disconnect.maps.set(ck,[]);
			}
			self.stack.listener.disconnect.maps.get(ck).push(cv);
		}
	}
	triggerConnected(port){
		for(var i in this.stack.listener.connect.stack){
			var filter=this.stack.listener.connect.stack[i].filter;
			if(this.isInFilteredPort(port,filter)){
				this.stack.listener.connect.stack[i].call(port);
			}
		}
	}
	triggerDisconnected(port){
		for(var i in this.stack.listener.disconnect.stack){
			var filter=this.stack.listener.disconnect.stack[i].filter;
			if(this.isInFilteredPort(port,filter)){
				this.stack.listener.disconnect.stack[i].call(port);
			}
		}
	}
	__triggerListener(port, clist,slf=this){
		var self=this;
		var call=function call(msg,msg_port){
			if(clist.destination == msg.destination){
				return clist.call({destination:clist.destination,data:msg.data},slf,msg_port);
			} else if(clist.destination=='any'){
				return clist.call({destination:msg.destination,data:msg.data},slf,msg_port);
			}
		}
		if(!self.stack.listener.message.maps.has(clist.call)){
			self.stack.listener.message.maps.set(clist.call,new Map());
		}
		self.stack.listener.message.maps.get(clist.call).set(port,call);
		port.onMessage.addListener(call);
	
	}
	/**
		param.destination
		param.calls
		param.port
	*/
	removeListener(param={}){
		var self=this;
		var event=['message','connect'];
		if('event' in param){
			event=param.event;
		}
		if(typeof event=='string'){
			event=event.split(',');
		}
		var callback=false;
		if('call' in param){
			callback=param.call;
			if(typeof callback=='function'){
				callback=[callback];
			}
		} 
		var destination=false;
		if('destination' in param){
			destination=param.destination;
		}
		var port=false;
		if('port' in param){
			port=param.port;
		}
		if(event.indexOf('messsage')!=-1){
			var calls=[];
			if(callback==false){
				var buf_calls=self.stack.listener.message.maps.keys();
				for(call of buf_calls){
					calls.push(call);
				}
			} else{
				calls=callback;
			}
			for(var i in calls){
				var call=calls[i];
				var callMap=self.stack.listener.message.maps.get(call);
				if(callMap!='undefined'){
					if(port!=false){
						port.onMessage.removeListener(callMap.get(port));
						callMap.delete(port);
					} else {
						callMap.forEach(function(call,port){
							port.onMessage.removeListener(call);
						});	
						callMap.clear();
					}
					if(self.stack.listener.message.maps.get(call).size<=0){
						self.stack.listener.message.maps.delete(call);
					}
				}
			}
		}
		if(event.indexOf('connect')!=-1){
			var calls=[];
			if(callback==false){
				var buf_calls=self.stack.listener.connect.maps.keys();
				for(call of buf_calls){
					calls.push(call);
				}
			} else{
				calls=callback;
			}
			for(var call of calls){
				var params=self.stack.listener.connect.maps.get(call);
				if(params=='undefined'){
					continue;
				}
				for(i in params){
					var param=params[i];
					if((destination==false || param.destination==destination)&&(port==false || self.isInFilteredPort(port,param.filter))){
						delete self.stack.listener.connect.stack[param._position];
						delete params[i];
					}
				}
				if([].concat(params).length==0){
					self.stack.listener.connect.maps.delete(call);
				}	
				//---
			}
		}
		if(event.indexOf('disconnect')!=-1){
			var calls=[];
			if(callback==false){
				var buf_calls=self.stack.listener.disconnect.maps.keys();
				for(call of buf_calls){
					calls.push(call);
				}
			} else{
				calls=callback;
			}
			for(var call of calls){
				var params=self.stack.listener.disconnect.maps.get(call);
				if(params=='undefined'){
					continue;
				}
				for(i in params){
					var param=params[i];
					if((destination==false || param.destination==destination)&&(port==false || self.isInFilteredPort(port,param.filter))){
						delete self.stack.listener.disconnect.stack[param._position];
						delete params[i];
					}
				}
				if([].concat(params).length==0){
					self.stack.listener.disconnect.maps.delete(call);
				}	
				//---
			}
		}
	}
}
MessageSwitch.prototype.stacks={};
MessageSwitch.prototype.noConnection=function(port){
			if(port.is_connected!==true){
				port.disconnect();
				console.log('disconnect');
				port.is_connected=false;
			}
		};	