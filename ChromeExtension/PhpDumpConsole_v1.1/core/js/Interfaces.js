Symbol.for("Interfaces");
class Interfaces {
	constructor(props=false){ 
		this.constructInterface(props);
		//this.deprecatedInterface(props);
	}
	deprecatedInterface(props=false){
		if(typeof props ==='object' && props!=null && !Array.isArray(props)){
			for(var p in props){
				self[p]=props[p];
			}
		}
		var proto=this;
		var check=false;
		while(!check){
			proto=Object.getPrototypeOf(proto);
			if(proto==null){
				check=true;
				break;
			}
			var proto_keys=Object.getOwnPropertyNames(proto);
			if(proto_keys.indexOf('__interface__')>-1 ){
				for(var i in proto_keys){
					if(['constructor'].indexOf(proto_keys[i])>-1){
						continue;
					}
					delete proto[proto_keys[i]];
				}
			}
		}
	}
	constructInterface(props=false){
		var self=this;
		if(typeof props ==='object' && props!=null && !Array.isArray(props)){
			for(var p in props){
				self[p]=props[p];
			}
		}
		var prop=Object.getOwnPropertyNames(self);
		if(self instanceof Interfaces){
			Object.defineProperty(self,'__interfaces__',{
					enumerable:false,
					value:{}
				});
		}
		//------
		var keys_class=[],
			keys_interface=[],
			proto=self,
			is_interfaces=false
			;

		var check=false;
		while(!check){
			proto=Object.getPrototypeOf(proto);
			if(proto.constructor.name==='Interfaces'){
				check==true;
				break;
			}
			var proto_keys=Object.getOwnPropertyNames(proto);
			if(proto_keys.indexOf('__interface__')>-1 ){
				var s_key=Symbol.for("Interfaces");
				if(!(s_key in proto.__interface__)){
					Object.defineProperty(proto,'__interface__',{ // инициализация при первом вызове конструктора. далее просто импорт.
						enumerable:false
					});
					proto.__interface__[s_key]=s_key;
					for(var i in proto_keys){
						if(['__interface__','constructor'].indexOf(proto_keys[i])>-1){
							continue;
						}
						proto.__interface__[proto_keys[i]]=proto[proto_keys[i]];
						if(!(proto_keys[i] in self.__interfaces__)){
							self.__interfaces__[proto_keys[i]]=[];
						}
						if(typeof proto[proto_keys[i]] =='function'){
							var type='method';
							var criteries =proto[proto_keys[i]]();
						} else {
							var type='property';
							var criteries=proto[proto_keys[i]];
						}
						self.__interfaces__[proto_keys[i]].push({interface:proto.constructor.name,type:type,criteries:criteries});
						delete proto[proto_keys[i]];
					}
				} else {
					for(var i in  proto.__interface__){
						//self.__interfaces__[prop].push({interface:proto.constructor.name,type:type,criteries:criteries});
						if(!(prop in self.__interfaces__)){
							self.__interfaces__[i]=[];
						}
						if(typeof proto.__interface__[i] =='function'){
							var type='method';
							var criteries =proto.__interface__[i]();
						} else {
							var type='property';
							var criteries=proto.__interface__[i];
						}
						self.__interfaces__[i].push({interface:proto.constructor.name,type:type,criteries:criteries});
					}
				}
			} else {
				for(var i in proto_keys){
					if(['constructor'].indexOf(proto_keys[i])>-1){
						continue;
					}
					if(prop.indexOf(proto_keys[i])==-1){
						self[proto_keys[i]]=proto[proto_keys[i]];
						prop.push(proto_keys[i]);
					}
				}
			}
		}	
		for(let property in self.__interfaces__){
			if(!(property in self)){
				Interfaces.prototype.renderMesseges(['Missing property "'+self.constructor.name+'::'+property+'".']);
				continue;
			}
			let criteries_methods=[];
			for(let iface in self.__interfaces__[property]){					
				if(self.__interfaces__[property][iface].type=='property'){
					var check=Interfaces.prototype.checkingCriteries(self[property],self.__interfaces__[property][iface].criteries);
					if(check===false){
						Interfaces.prototype.renderMesseges(['Property "'+self.constructor.name+'::'+property+' does not correspond not to one of the criteries ',self.__interfaces__[property][iface]]);
						//break;
					}
				} else
				if(self.__interfaces__[property][iface].type=='method'){
					if(typeof self[property]!=='function'){
						Interfaces.prototype.renderMesseges(['Property "'+self.constructor.name+'::'+property+' is not method.']);
						continue;
					}
					var criteria=self.__interfaces__[property][iface].criteries;
					if(typeof criteria !='object' || criteria==null){
						continue;
					}
					criteries_methods.push(self.__interfaces__[property][iface]);
				}
			};
			if(typeof self[property]==='function' && criteries_methods.lengtch!=0){
				let method=self[property];
				// проверка  аргументов лучше проверять до выполнения метода. т.к. состояние аргументов может измениться в методе.
				self[property]=function(...arg){
					for (let i in arg){  
						for(let j in criteries_methods){
							var check=true;
							var criteria=criteries_methods[j].criteries;
							if(i in criteria){
								var check=Interfaces.prototype.checkingCriteries(arg[i],criteria[i]);
							} else if('rest' in criteria){
								var check=Interfaces.prototype.checkingCriteries(arg[i],criteria.rest);
							} 
							if(check===false){
								Interfaces.prototype.renderMesseges(['Argument "'+i+'" in "'+self.constructor.name+'::'+property+'" method  does not correspond not to one of the criteries ',criteries_methods[j]]);
							}
						}
					}
					var re=method.call(self,...arg);
					for(let i in criteries_methods){
						var check=true;	
						var criteria=criteries_methods[i].criteries;
						if('return' in criteria){
							var check=Interfaces.prototype.checkingCriteries(re,criteria.return);
						} 
						if(check===false){
							Interfaces.prototype.renderMesseges(['Return result in "'+self.constructor.name+'::'+property+'" method  does not correspond not to one of the criteries ',criteries_methods[i]]);
						}
					}
					return re;
				}
			}
		}
	}
	renderMesseges(messege){
		if(!Array.isArray(messege)){
			messege=[messege];
		}
		console.warn('Interfaces: ',...messege);
	}
	checkingCriteries(obj,criteries){
		var check=true;
		label1: 
		for(var s in criteries){	
			switch(s){
				case 'typeof':
					for(var i in criteries[s]){
						var check=false;
						if(typeof obj === criteries[s][i]){
							check=true;
							break label1;
						}
					}
				break;
				case 'instanceof':
					for(var i in criteries[s]){
						var check=false;
						if( obj instanceof criteries[s][i]){
							check=true;
							break label1;
						}
					}
					break;
				case 'class': 									
					for(var i in criteries[s]){
						var check=false;
						if(typeof obj=='function' && obj === criteries[s][i]){
							check=true;
							break label1;
						}
					}
				break;	
			}
		}
		return check;
	}
 	
}
