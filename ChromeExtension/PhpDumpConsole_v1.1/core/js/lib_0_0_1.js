class Lib {
	constructor(){}
	isset(vr,tpf=false){
		var result=true;
		var tpf=(tpf!==false)?tpf:typeof(vr);
		if(tpf=='undefined'){
			result=false;
		}
		return result;
	}
	countProperties(vr){
		var count=0;
		if(this.isObject(vr)){
			if(this.isProp(vr,'countProperties')){
				count=vr.countProperties();
			} else {
				var keys=this.getAllNumKeys(vr);
				count=keys.length;
			}
		}  
		return count;
	}
	countIntProperties(vr){
		var count=0;
		if(this.isObject(vr)){
			if(this.isProp(vr,'countIntProperties')){
				count=vr.countIntProperties();
			} else {
				var keys=this.getAllIntKeys(vr);
				count=keys.length;
			}
		}  
		return count;
	}
	countChars(vr){ 
		return String(vr).length;
	}
	empty(vr){
		var result=false;
		if(	
			vr===false||
			this.isNumber(vr) && vr==0  || 
			this.isString(vr) && vr.trim()===''||
			this.isObject(vr)&& this.countProperties(vr)==0||
			vr==null
		){
			result=true;
		} 
		return result;
	}
	isUndefined(vr,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(vr);
		if(tpf=='undefined'){
			result=true;
		}
		return result;
	}
	isObject(obj,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(obj);
		if(tpf=='object' && obj!=null){
			result=true;
		}
		return result;
	}
	isObjectNotArray(obj,tpf=false){ // Objects do not Array
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(obj);
		if(tpf=='object' && obj!=null && !this.isArray(obj)){
			result=true;
		}
		return result;
	}
	isObjectNA(obj){
		return this.isObjectNotArray(obj);
	}
	isArray(obj){
		return Array.isArray(obj);
	}
	isNumber(num,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(num);
		if(tpf=='number'){
			result=true;
		}
		return result;
	}
	isNumeric(num,tpf=false){ //  является ли числом 
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(num);
		if(tpf=='number' || !isNaN(num)){
			result=true;
		}
		return result;
	}
	isBool(bl,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(bl);
		if(tpf=='boolean' ){//|| tpf=='number'&& (bl==1||bl==0)
			result=true;
		}
		return result;
	}
	isString(str,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(str);
		if(tpf==='string'){
			result=true;
		}
		return result;
	}
	isFunc(fnc,tpf=false){
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(fnc);
		if(tpf==='function'){
			result=true;
		}
		return result;
	}
	isPrimitiveNF(vr,tpf=false){ // примитивы как есть исключая функцию.
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof(vr);
		if(tpf==='string' || tpf==='boolean' || tpf==='number'|| tpf==='undefined' || vr===null || vr=='symbol'){
			result=true;
		}
		return result;
	}
	isPrimitive(vr,tpf=false){ // function хоть и не примитив (замороженый обьект) но воспринимается как примитив. т.е с ней не работают как с обьектом  и в typeof  не включен в перечень обьектов.
		var result=false;
		var tpf=(tpf!==false)?tpf:typeof (vr);
		if(tpf==='function'||tpf==='string' || tpf==='boolean' || tpf==='number'|| tpf==='undefined' || vr===null || vr=='symbol'){
			result=true;
		}
		return result;
	}
	isProp(obj,prop,tpf=false){
		var result=false;
		if(this.isObject(obj,tpf)){
			if(prop in obj){
				result=true;
			}
		}
		return result;
	}
	deprecated_isPropPath(obj,str){
		// str = a.b.1.g.[].s  
		//где []- последний элемент массива (numeric)prop -массив или обьект который имее числовые свойства. 
		//[x]-последний перечисляемые или неперечисляемый собственные свойства  Object.getOwnPropertyNames
		//[y]-последний  собственный перечисляемый элемент обьектa Object.keys
		//[z]-последний перечисляемый элемент обьекта(учитывает прототип) for in
		var result=true;
		var props=str.split('.');
		var buf_obj=obj;
		endfor:
		for(var i in props){
			if(!this.isObject(buf_obj)){
				result=false;
				break;
			}
			if(/^\[[\s|\S]*\]$/.test(props[i])){
				var call=function(){};
				switch(props[i]){
					case '[]': 	call=this.getAllIntKeys;
					break;
					/*case '[x]': call=this.getKeys;
					break;
					case '[y]': call=this.getNumKeys;
					break;
					case '[z]': call=this.getAllNumKeys;
					break;*/
					default:
					result=false;
					break endfor;
				}
				var keys= call.call(this,buf_obj);
				if(keys.length<=0){
					result=false;
					break;
				}
				props[i]=keys[keys.length-1];
			} else if(!this.isProp(buf_obj,props[i])){
				result=false;
				break;
			}
			buf_obj=buf_obj[props[i]];
		}
		
		return result;
	}
	deprecated_getValPropPath(obj,str){
		var result=undefined;
		var props=str.split('.');
		var buf_obj=obj;
		endfor:
		for(var i in props){
			if(!this.isObject(buf_obj)){
				var result=undefined;
				break;
			}
			if(/^\[[\s|\S]*\]$/.test(props[i])){
				var call=function(){};
				switch(props[i].replace(' ','')){
					case '[]': 	call=this.getAllIntKeys;
					break;
					default:
					var result=undefined;
					break endfor;
				}
				var keys= call.call(this,buf_obj);
				if(keys.length<=0){
					var result=undefined;
					break;
				}
				props[i]=keys[keys.length-1];
			}
			if(!this.isProp(buf_obj,props[i])){
				var result=undefined;
				break;
			}
			result=buf_obj[props[i]];
			buf_obj=buf_obj[props[i]];
		}
		return result;
	}
	/**	isPropPath(obj,path)
	obj - (object) обьект в котором вычисляются свойства согласно path. Если свойство отсутствует согласно пути path то возвращает false иначе true
	path - (string) строка формата  prop.prop.[].prop или prop.prop.[-1].prop где
		[] или [-1]- последняя позиция массива
		[0] или 0 - позиция массива  начиная с 0. 
		[-2] вычисляет позицию массива с конца [-1] - последняя позиция [-2] предпоследняя позиция и так далее.
		
	*/	
	isPropPath(obj,str){
		// str = a.b.1.g.[].s  
		//где []- последний элемент массива (numeric)prop -массив или обьект который имее числовые свойства. 
		//[x]-последний перечисляемые или неперечисляемый собственные свойства  Object.getOwnPropertyNames
		//[y]-последний  собственный перечисляемый элемент обьектa Object.keys
		//[z]-последний перечисляемый элемент обьекта(учитывает прототип) for in
		var result=true;
		var props=str.split('.');
		var buf_obj=obj;
		var ps=null;
		for(var i in props){
			if(!this.isObject(buf_obj)){
				result=false;
				break;
			}
			ps=/^\[([\s\S]*?)\]$/i.exec(props[i]);				
			if(ps!=null){
				if(this.isNumeric(ps[1])){	
					var keys=this.getAllIntKeys.call(this,buf_obj);
					if(keys.length<=0){
						var result=false;
						break;
					}
					var last_key=0;
					if(this.isArray(buf_obj)){
						last_key=buf_obj.length-1;
					} else if(keys.length>0){
						last_key=keys[keys.length-1];
					}
					if(ps[1]!=''){
						ps[1]=Number(ps[1]);
						if(ps[1]>=0){
							props[i]=ps[1];
						} else {
							props[i]=last_key+1+ps[1];
							if(props[i]<0){
								props[i]=0;
							}
						}
					} else {
						props[i]=last_key;
					}
				} else{
					props[i]=ps[1];
				}
			}
			if(!this.isProp(buf_obj,props[i])){
				result=false;
				break;
			}
			buf_obj=buf_obj[props[i]];	
		}
		return result;
	}
	/**
	getValPropPath(obj,path)
	obj - (object) обьект в котором вычисляются свойства согласно path. Если свойство отсутствует согласно пути path то возвращает undefined
	path - (string) строка формата  prop.prop.[].prop или prop.prop.[-1].prop где
		[] или [-1]- последняя позиция массива
		[0] или 0 - позиция массива  начиная с 0. 
		[-2] вычисляет позицию массива с конца [-1] - последняя позиция [-2] предпоследняя позиция и так далее.
		
	*/	
	getValPropPath(obj,str){
		var result=undefined;
		var props=str.split('.');
		var buf_obj=obj;
		var ps=null;
		for(var i in props){
			ps=/^\[([\s\S]*?)\]$/i.exec(props[i]);				
			if(ps!=null){
				if(this.isNumeric(ps[1])){	
					var keys=this.getAllIntKeys.call(this,buf_obj);
					if(keys.length<=0){
						var result=undefined;
						break;
					}
					var last_key=0;
					if(this.isArray(buf_obj)){
						last_key=buf_obj.length-1;
					} else if(keys.length>0){
						last_key=keys[keys.length-1];
					}
					if(ps[1]!=''){
						ps[1]=Number(ps[1]);
						if(ps[1]>=0){
							props[i]=ps[1];
						} else {
							props[i]=last_key+1+ps[1];
							if(props[i]<0){
								props[i]=0;
							}
						}
					} else {
						props[i]=last_key;
					}
				} else{
					props[i]=ps[1];
				}
			}			
			if(!this.isProp(buf_obj,props[i])){
				var result=undefined;
				break;
			}
			result=buf_obj[props[i]];
			buf_obj=buf_obj[props[i]];
		}
		return result;
	}
	/**
	setValPropPath(obj,path,value)
	obj - (object) обьект в котором вычисляются/создаются свойства согласно path. Если свойство отсутствует согласно пути path то оно создается.  
	path - (string) строка формата  prop.prop.[].prop или prop.prop.[-1].prop где
		[]- добавление значения в конец массива
		[1] или 1 - добавление/изминение значения согласно указанной позиции 
		[-1] изминение значения в позиции исходя с конца массива.  [-1] - последняя позиция [-2] предпоследняя позиция и так далее 
	value - значение которое будет добавленно согласно path.	
	*/
	setValPropPath(obj,str,value){
		var props=str.split('.');
		var buf_obj=obj;
		var ps=null;
		for(var i in props){
			ps=/^\[([\s\S]*?)\]$/i.exec(props[i]);				
			if(ps!=null){
				if(this.isNumeric(ps[1])){	
					var keys=this.getAllIntKeys.call(this,buf_obj);
					var last_key=-1;
					if(this.isArray(buf_obj)){
						last_key=buf_obj.length-1;
					} else if(keys.length>0){
						last_key=keys[keys.length-1];
					} 
					if(ps[1]!=''){
						ps[1]=Number(ps[1]);
						if(ps[1]>=0){
							props[i]=ps[1];
						} else {
							props[i]=last_key+1+ps[1];
							if(props[i]<0){
								props[i]=0;
							}
						}
					} else {
						props[i]=last_key+1;
					}
				} else{
					props[i]=ps[1];
				} 
			}
			if(i<props.length-1){
				if(!this.isObject(buf_obj[props[i]])){
					if(this.isNumeric(props[Number(i)+1])||/^\[[\s|\d]*\]$/.test(props[Number(i)+1])){
						buf_obj[props[i]]=[];
					}else{
						buf_obj[props[i]]={};
					}
				}
				buf_obj=buf_obj[props[i]];
			} else {
				buf_obj[props[i]]=value;
			}
		}
		return obj;
	}
	getAllNumKeys(obj){ // перечисляемые свойства в том числе и прототайпа
		var result=[];
		for(var i in obj){
			result.push(i);
		}
		return result;
	}
	getKeys(obj){ //  перечисляемые и не перечисляемые собственные свойства 
		return Object.getOwnPropertyNames(obj);
	}
	getNumKeys(obj){ // все перечисляемые собственные свойства.
		return Object.keys(obj);
	}
	getAllIntKeys(vr){ // все перечисляемые свойства являющиеся числовыми в том числе и прототайпа.
		var keys_buf=this.getAllNumKeys(vr);
		var result=[];
		for(var i in vr){
			if(!this.isNumeric(i)){continue;}
			result.push(Number(i));
		}
		// отсортировать ключи по возврастанию. 
		result.sort(function (a, b) {
			if (a > b) return 1;
			if (a < b) return -1;
		});
		return result;
	}
	getAllAssocKeys(vr){ // все перечисляемые свойства являющиеся ассоциативными в том числе и прототайпа.
		var keys_buf=this.getAllNumKeys(vr);
		var result=[];
		for(var i in vr){
			if(this.isNumeric(i)){continue;}
			result.push(i);
		}
		return result;
	}
	getAllSeparatedKeys(vr){// все перечисляемые свойства рассортированные на ассоциативные/числовые ({assoc:[],int:[]})  в том числе и прототайпа.
	var result={assoc:[],int:[]};
		for(var i in vr){
			if(this.isNumeric(i)){
				result.int.push(Number(i));
			}else{
				result.assoc.push(i);
			}
		}
		// отсортировать ключи по возврастанию. 
		result.int.sort(function (a, b) {
			if (a > b) return 1;
			if (a < b) return -1;
		});
		return result;
	}
	initPropRecurs(obj={},tmplObj={}){// создает ветвления дерева обьектов в obj согласно ветвлению tmplObj и устанавливает значения по умолчанию. если переменная существует-примитив то не проводит над ней настройки.
		var self=this;
		if(this.isUndefined(obj)){
			obj={};
		}
		var recurs=function(obj,tmplObj){
			for(var i in tmplObj){
				if(!self.isProp(obj,i)){
					if(self.isArray(tmplObj[i])){
						obj[i]=[];
					}else if(self.isObject(tmplObj[i])){
						obj[i]={}
					} else {
						obj[i]=tmplObj[i];
					}
				}
				if(self.isObject(obj[i]) && self.isObject(tmplObj[i])){
					recurs(obj[i],tmplObj[i]);
				}
			}
			return obj;
		}
		return recurs(obj,tmplObj);
	}
	parseUrl(url){
		
		var parser = document.createElement('a')
		parser.href = url;
		return {hash:parser.hash,host:parser.host,href:parser.href,hostname:parser.hostname,pathname:parser.pathname,port:parser.protocol,protocol:parser.protocol,search:parser.search};
	}
	uniqId(){
		return Math.random().toString(36).split('.')[1];
	}
	encode_utf8(s) {
	  return unescape(encodeURIComponent(s));
	}
	decode_utf8(s) {
	  return decodeURIComponent(escape(s));
	}
	//   getAllIntKeysDetail{keys:[],first_key:'',last_key:'',count:'',free_keys:{}} getFirstProp getLastProp trim clone 
	/** 	expand_recursive  рекусрсивное расширение обьекта без перезаписи 
	  свойства обьекта не перезаписываются при совпадении. 
	  Если два свойства- обьекты, то и эти обьекты сравниваютсся и рекурсивно дополняются
	  expand_recursive(target,..sources);return target; 
	  все данные клонируются в target 
	  будут обработаны только перечисляемые свойства обьектов (собственные и прототайпа)
	  ссылочность сохраняется внутри дерева
	  Внимание - если свойство обьект - то оно не реализует(клонирует) его прототайп.
		данный метод предназначе лишь для работы с данными
	*/
	expand_recursive(target,...rest){ 
		var stamp=new Map(),steckSymbolKey=[],self=this;
		if(typeof target !='object' || target==null){
			return target;
		}
		function recurs(clone,obj){ 
			if(obj===clone){return clone;}
			var k=self.getAllNumKeys(obj);
			k=k.concat(steckSymbolKey); // реализовать через Set - тогда сохраним уникальность.
			if(!stamp.has(clone)){stamp.set(clone,clone);}
			if(!stamp.has(obj)){
				stamp.set(obj,clone);
			} else {
				return stamp.get(obj);
			}
			for(var z in k){
				var i=k[z];	
				if(typeof(clone[i])=='object'){
					if(!stamp.has(clone)){stamp.set(clone,clone);}
				}
				if(typeof(obj[i])=='object'&& obj[i]!=null){
					if(typeof(clone[i])=='object' && clone[i]!=null || typeof(clone[i])=='undefined' ){
						if(!(i in clone)){
							if(Array.isArray(obj[i])){
								clone[i]=[];
							}else{
								clone[i]={};
							}
						}
						clone[i]=recurs(clone[i],obj[i]);// рекурсивим обьект и возвращаем клон						
					} 
				} else { 
					if(!(i in clone)){
						clone[i]=obj[i];
					} if(typeof(clone[i])=='object' && clone[i]!=null && !stamp.has(clone)){
						stamp.set(clone,clone);
					}
				}
			}
			return clone;
		}
		for (var i in rest){
			target=recurs(target,rest[i]);
		}	
		return target;
	}
	
	/** 	expand_replace_recursive  рекусрсивное расширение обьекта с перезаписью
	  свойства обьекта перезаписываются при совпадении. 
	  Если два свойства- обьекты, то и эти обьекты сравниваются и рекурсивно расширяются
	  expand_replace_recursive(target,..sources);return target; 
	  все данные клонируются в target 
	  будут обработаны только перечисляемые свойства обьектов (собственные и прототайпа)
	  Внимание - если свойство обьект - то оно не реализует(клонирует) его прототайп.
		данный метод предназначе лишь для работы с данными
	*/
	expand_replace_recursive(target,...rest){
		var stamp=new Map(),steckSymbolKey=[],self=this;
		if(typeof target !='object' || target==null){
			target={};
		}
		function recurs(clone,obj){ 
			if(obj===clone){return clone;}
			var k=self.getAllNumKeys(obj);
			k=k.concat(steckSymbolKey);
			if(!stamp.has(clone)){stamp.set(clone,clone);}
			if(!stamp.has(obj)){
				stamp.set(obj,clone);
			} else {
				return stamp.get(obj);
			}
			for(var z in k){
				var i=k[z];
				if(typeof(obj[i])=='object'&& obj[i]!=null){
					if(typeof(clone[i])!='object' || clone[i]==null){
						if(Array.isArray(obj[i])){
							clone[i]=[];
						}else{
							clone[i]={};
						}
					}
					clone[i]=recurs(clone[i],obj[i]);// рекурсивим обьект и возвращаем клон
				} else {
					// возвращаем примитив
					clone[i]=obj[i];
				}
				
				// тут дескрипторы расширяем // и заморозку
			}
			return clone;
		}
		for (var i in rest){
			target=recurs(target,rest[i]);
		}	
		return target;
	}
	
	/** 	merge_recursive  рекусрсивное обьеденение обьекта с перезаписью
	  Ассоциативные свойства при совпадении перезаписываются.  числовые расширяет (дополняет числовыми свойствами обьект как в конец массива.) 
	  Если два свойства- обьекты, то и эти обьекты сравниваются и рекурсивно расширяются
	  merge_recursive(target,..sources);return target; 
	  все данные клонируются в target 
	  будут обработаны только перечисляемые свойства обьектов (собственные и прототайпа)
		Внимание - если свойство обьект - то не реализуется(клонируется) его прототайп.
		данный метод предназначе лишь для работы с данными
	*/
	merge_recursive(target,...rest){  
		var stamp=new Map(),steckSymbolKey=[],self=this;
		if(typeof target !='object' || target==null){
			target={};
		}
		function recurs(clone,obj){ 
			if(obj===clone){return clone;}
			var k=self.getAllSeparatedKeys(obj);
			k.assoc=k.assoc.concat(steckSymbolKey);
			if(!stamp.has(clone)){stamp.set(clone,clone);}
			if(!stamp.has(obj)){
				stamp.set(obj,clone);
			} else {
				return stamp.get(obj);
			}
			var m=self.getAllIntKeys(clone);
			var itr=(m.length>0?m[m.length-1]:-1)+1;
			for(var z in k.int){
				var i=k.int[z];
				if(self.isObject(obj[i])){
					if(self.isArray(obj[i])){
						clone[itr]=[];
					}else{
						clone[itr]={};
					}
					clone[itr]=recurs(clone[itr],obj[i]);
				} else {
					clone[itr]=obj[i];
				}
				itr++;
			}
			for(var z in k.assoc){
				var i=k.assoc[z];
				if(self.isObject(obj[i])){
					if(!self.isObject(clone[i])){
						if(self.isArray(obj[i])){
							clone[i]=[];
						}else{
							clone[i]={};
						}
					}
					clone[i]=recurs(clone[i],obj[i]);// рекурсивим обьект и возвращаем клон
				} else {
					// возвращаем примитив
					clone[i]=obj[i];
				}
				
				// тут дескрипторы расширяем // и заморозку
			}
			return clone;
		}
		for (var i in rest){
			target=recurs(target,rest[i]);
		}	
		return target;
	}
	expand (target,...rest){
		for(var i in rest){
			if(this.isObject(rest[i])){
				for(var j in rest[i]){
					if(!this.isset(target[j])){
						target[j]=rest[i][j];
					}
				}
			}
		}
		return target;
	}
	expand_replace(target,...rest){
		for(var i in rest){
			if(this.isObject(rest[i])){
				for(var j in rest[i]){
					target[j]=rest[i][j];
				}
			}
		}
		return target;
	}
	merge(target,...rest){
		var m=this.getAllIntKeys(target);
		var itr=(m.length>0?m[m.length-1]:-1)+1;
		for(var i in rest){
			var k=this.getAllSeparatedKeys(rest[i]);
			for(var z in k.int){
				target[itr]=k.int[z];
				itr++;
			}
			for(var z in k.assoc){
				target[z]=k.assoc[z];
			}
		}
		return target;
	}
	/** Разделяет данные target по шаблону обьекта  tpl(согласно свойствам) с рекурсивной вложенностью  {exclude:{...},include:{...}} Значение примитива не имеет значениz*/
	separated_recursive(target,tpl){
		var self=this;
		var recurs=function(target,tpl,exclude,include){
			var result={};
			for(var i in target){
				if(self.isProp(tpl,i) && !self.isObject(tpl[i])){
					tpl[i]={};
				}
				if(self.isProp(tpl,i)){
					if(self.isObject(target[i]) && self.isObject(tpl[i]) &&self.countProperties(tpl[i])>0){
						if(self.isArray(target[i])){
							include[i]=[];
							exclude[i]=[];
						}else{
							include[i]={};
							exclude[i]={};
						}
						recurs(target[i],tpl[i],exclude[i],include[i]);
						if(self.countProperties(exclude[i])==0){
							delete exclude[i];
						}
					} else  {
						if(self.isObject(target[i])){
							include[i]=self.expand_recursive({},target[i]);
						}else{
							include[i]=target[i];
						}
					} 
				} else {
					if(self.isObject(target[i])){
						exclude[i]=self.expand_recursive({},target[i]);
					} else {
						exclude[i]=target[i];
					}
				}
			}
			
		}
		var result={exclude:{},include:{}};
		recurs(target,tpl,result.exclude,result.include);
		return result;
	}
	instanceof(obj,Class){
		
	}
}
Lib = new Lib();

