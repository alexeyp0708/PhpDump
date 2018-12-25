
export default class DebuggerSettings{
	constructor(){
		this.tabs=[];
		this.initStorage();
	}
	get(tabId,url,new_settings={})
	{
		var self=this;
		var global_settings=self.getApp();
		var local_settings=self.getTab(tabId);
		var site_settings=self.getSite(url);
		var res= Lib.expand_replace({},global_settings,local_settings,site_settings);
		return Lib.expand_replace_recursive({},res,new_settings);
	}
	setTab(tabId,settings)
	{
		var self=this;
		var local_settings=self.getTab(tabId);	
		Lib.setValPropPath(self.tabs,tabId+'.settings.dump',Lib.expand_replace({},local_settings,settings));
	}
	initTab(tabId,settings)
	{
		var self=this;
		var local_settings=self.getTab(tabId);	
		if(Lib.empty(local_settings)){
			Lib.setValPropPath(self.tabs,tabId+'.settings.dump',settings);
		}
	}
	//getTabDumpSettings
	getTab(tabId)
	{
		var self=this;
		var local_settings=Lib.getValPropPath(self.tabs,tabId+'.settings.dump');
		if(Lib.isUndefined(local_settings)){
			local_settings={};
		}	
		return local_settings;
	}
	//setSiteDumpSettings
	setSite(settings={},save=false)
	{
		var self=this;
		var res_array={};
		for(var pattern in settings){
			var check=false;
			if(Lib.isProp(self.site,pattern)){
				self.site[pattern]=Lib.expand_replace({},self.site[pattern],settings[pattern]);
				res_array[pattern]=self.site[pattern];
				check=true;
				break;
			} else{
				self.site[pattern]=settings[pattern];
				res_array[pattern]=settings[pattern];
			} 
		}
		if(save==true){
			self.saveStorage({site:res_array});
		}
	} 
	//getSiteDumpSettings
	getSite(url=false)
	{
		var self=this;
		if(url!==false){
			var rest=[];
			for(var ps in self.site){
				pattern=new RegExp(ps,'i');
				if(pattern.test(url)){
					rest.push(self.site[ps]);
				}
			}
			
			return Lib.expand_replace_recursive({},...rest);
		} else {
			return self.site;
		}
	}
	// clearSiteDumpSettings
	clearSite(patterns=false,save=false,sites=false)
	{
		var self=this;
		if(sites===false){
			if( !Lib.isset(self.site)){
				self.initStorage();
			}
			sites=self.site;
		}	
		if(patterns!==false){
			var rest=[];
			for(var pattern in patterns){
				if(patterns[pattern].type=='link'){
					for(var ps in sites){
						var ps_r=new RegExp(ps,'i');
						if(ps_r.test(pattern)){
							delete sites[ps];
						}
					}
				} else {
						
					if(pattern in sites ){
						delete sites[pattern];
					}
				}	
			}
		} else {
			self.site={};
		}
		
		if(save==true && sites==false){
			chrome.storage.sync.get(['debugger_settings'], function(result) {
				var settings={};
				var site={};
				if('debugger_settings' in result){
					settings=result.debugger_settings.settings;
					site=result.debugger_settings.site;
				}
				if(urls!==false){
					self.clearSite(urls,false,site);
				} else{
					site={};
				}
				chrome.storage.sync.set({debugger_settings:{settings:settings,site:site}});
			});
		}
	}
	//setGlobalDumpSettings
	setApp(settings)
	{
		var self=this;
		self.settings=Lib.expand_replace_recursive({},self.settings,settings);
	}
	//getGlobalDumpSettings
	getApp()
	{
		var self=this;
		if(!Lib.isset(self.settings)){
			self.initStorage();
		}
		return self.settings;
	}
	//saveStorageAllSettings
	saveStorageAll()
	{
		var self=this;
		//сохраняем настройки в хранилище
		chrome.storage.sync.set({debugger_settings:{settings:self.settings,site:self.site}});
	}
	//saveStorageSettings
	saveStorage(data)
	{
		var self=this;
		//сохраняем настройки в хранилище
		chrome.storage.sync.get(['debugger_settings'], function(result) {
			var settings={};
			var site={};
			if('debugger_settings' in result){
				settings=result.debugger_settings.settings;
				site=result.debugger_settings.site;
			}
			if('settings' in data){
				settings=Lib.expand_replace_recursive(settings,data.settings);
			}
			if('site' in data){
				site=Lib.expand_replace_recursive(site,data.site);
			}
			chrome.storage.sync.set({debugger_settings:{settings:settings,site:site}});
        });
	}
	//initStorageSettings
	initStorage()
	{
		var self=this;
		self.settings={};
		self.site={};
		// запрашиваем настройки из хранилища.	
		chrome.storage.sync.get(['debugger_settings'], function(result) {
			if('debugger_settings' in result){
				self.settings=result.debugger_settings.settings;
				self.site=result.debugger_settings.site;
			} else {
				self.settings={};
				self.site={};
			}
        });
	}
}