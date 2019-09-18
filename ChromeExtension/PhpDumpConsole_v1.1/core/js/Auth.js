export default class Auth{
	constructor(){
		this.auth_sites={};
		this.hashkeys={};
		this.initStorageAuth();
	}
	/**
	* Инициализирует служебные данные из хранилища
	*/
	initStorageAuth(){
		var self=this;
		chrome.storage.local.get(['debugger_autch'], function(result) {
			if('debugger_autch' in result ){
				self.auth_sites=result.debugger_autch.auth_sites;
				self.hashkeys=result.debugger_autch.hashkeys;
			}
        });
	}
	/**
	* Сохраняет служебные данные в хранилище
	*/
	saveStorageAuth(){
		chrome.storage.local.set({debugger_autch:{hashkeys:this.hashkeys,auth_sites:this.auth_sites}});
	}
	/**
	* удаляет служебные данные из хранилища
	*/
	removeStorageAuth(){
		chrome.storage.local.remove(['debugger_autch']);
	}
	/**
	* Запрашивает ключи авторизации
	*/
	getHashKeys(){
		return {
					auth_sites:this.auth_sites,
					hashkeys:this.hashkeys
				};
	}
	/**
	* проверяет  авторизацию на сервере и на клиенте
	*/
	isAuthServer(headers){
		var self=this;
		var client_auth_data=self.getHashKey(headers.hashkey);
		if(	
			!Lib.isProp(headers,'status_server')||
			headers.status_server!=='enabled'||
			headers.status_server!=='enabled'||
			!Lib.isProp(headers,'hashkey')||
			!Lib.isProp(headers,'greeting_server')||
			client_auth_data==false||
			client_auth_data.greeting_server!==headers.greeting_server
		){
			return false;
		} else {
			return true;
		}
	}
	/**
	*  запрашивает заголовки авторизации. В том числе устаннавливает свои заголовки авторизации 
	*
	*/
	getAuth(details){
		/*{url:'',requestHeaders:''} */
		var self=this;
		var hostname=Lib.parseUrl(details.url).hostname;
		var dump_settings=self.getAuthSettings(hostname);
		if(dump_settings===false){
			return {requestHeaders: details.requestHeaders};
		}
		var check=false;
		for(var i in details.requestHeaders){
			if(details.requestHeaders[i].name=='php-dump-settings'){
				details.requestHeaders[i].value=JSON.stringify(Lib.expand_replace(JSON.parse(details.requestHeaders[i].value),dump_settings));
				check=true;
				break;
			}
		}
		if(check===false){
			details.requestHeaders.push({name:'php-dump-settings',value:JSON.stringify(dump_settings)});
		}
		return {requestHeaders: details.requestHeaders};
	}
	/**
	* запрашивает настройки авторизайии для доменна
	*/
	getAuthSettings(domain){ // запрашиваем настройки авторизации
		var self=this;
		var hashkey=self.getHashKeyDomain(domain);
		if(hashkey==false){
			return false;
		}
		var settings={};
		settings.status_client='enabled';
		settings.hashkey=hashkey.key;
		settings.greeting_client=hashkey.greeting_client;
		return settings;
	}
	/**
	* устанавливает ключи для авторизации
	*/
	setHashKey(key,greeting_client,greeting_server){
		var self=this;
		self.hashkeys[key]={
			key:key,
			greeting_client:greeting_client,
			greeting_server:greeting_server
		}
	}
	/**
	*
	*/
	getHashKey(key){
		var self=this;
		if(!Lib.isProp(self.hashkeys,key)){
			return false;
			
		}
		return self.hashkeys[key];
	}
	getHashKeyDomain(domain){
		var self=this;
		if(!Lib.isProp(self.auth_sites,domain)){
			if(Lib.isProp(self.auth_sites,'global')){
				return  self.auth_sites['global'];
			} else{
				return false;
			}
		}
		return self.auth_sites[domain];
	}
	setHashKeyDomain(domain,key,greeting_client,greeting_server)
	{
		var self=this;
		self.setHashKey(key,greeting_client,greeting_server);
		return self.bindHashKeyDomain(domain,key);
	}
	bindHashKeyDomain(domain,key)
	{
		var self=this;
		var hashkey=self.getHashKey(key);
		if(hashkey==false){
			return false;
		}
		self.auth_sites[domain]=hashkey;
		return self.auth_sites[domain];
	}
	unbindHashKeyDomain(domain,key)
	{
		if(typeof this.auth_sites[domain]=='object' && key===this.auth_sites[domain].key){delete this.auth_sites[domain];}
	}
	deleteHashKey(key)
	{
		for(var i in this.auth_sites){
			if(this.auth_sites[i].key==key){
				delete this.auth_sites[i];
			};
		}
		
		return delete this.hashkeys[key];
	}
	addHashKeyDomain(domain,key,greeting_client,greeting_server)
	{
		var self=this;
		if(!Lib.isProp(self.hashkeys,key)){
			self.setHashKeyDomain(domain,key,greeting_client,greeting_server);
		} else {
			self.bindHashKeyDomain(domain,key);
		}
		return self.getHashKeyDomain(domain);
	}
}
