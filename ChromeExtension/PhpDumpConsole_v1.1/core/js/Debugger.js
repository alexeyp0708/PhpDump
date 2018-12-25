import Auth from './Auth.js';
import ViewDebugger from './ViewDebugger.js';
import DebuggerSettings from './DebuggerSettings.js';
export default class Debugger{
	constructor()
	{
		this.auth=new Auth();
		this.view=new ViewDebugger(this);
		this.settings=new DebuggerSettings();
		this.tabs=[];
		//this.site=[];
		this.separated_response_data={settings:{},dump_settings:{'turn_on':{},'debug_backtrace':{}},dump_fields:{user:{},context:{},group:{},name:{},timestamp:{},path:{}}};
	}
	separatedResponseData(data)
	{
		var self=this;
		return Lib.separated_recursive(data,self.separated_response_data).include;
	}
	createDumpWebRequest(details)
	{ // details={tabId:'',requestHeaders:''}
		var self=this;
		if(details.tabId===-1 || !self.isEnabled(details.tabId)){
			return;
		}
		details=Lib.expand_replace(details,self.auth.getAuth(details));
		var dump_settings=self.settings.get(details.tabId,details.url,{command:'create',dump_fields:{context:details.tabId}});
		var check=false;
		for(var i in details.requestHeaders){
			if(details.requestHeaders[i].name=='PHP-Dump-Settings'){
				details.requestHeaders[i].value=JSON.stringify(Lib.expand_replace(JSON.parse(details.requestHeaders[i].value),dump_settings));
				check=true;
				break;
			}
		}
		if(check===false){
			details.requestHeaders.push({name:'PHP-Dump-Settings',value:JSON.stringify(dump_settings)});
		}
		Lib.setValPropPath(self.tabs,details.tabId+'.data.'+details.requestId+'.details.request.requestHeaders',details.requestHeaders);
		return {requestHeaders: details.requestHeaders};
	}
	createDumpWebResponse(details)
	{ /*details={tabId:'',responseHeaders:''} */ 
		var self=this;
		if(details.tabId===-1 ||!self.isEnabled(details.tabId)){
			return;
		}
		var check=false;
		var dump_settings={};
		for(var i in details.responseHeaders){
			if(details.responseHeaders[i].name=='PHP-Dump-Settings'){
				dump_settings=JSON.parse(details.responseHeaders[i].value);
				check=true;
				break;
			}
		}
		if(!self.auth.isAuthServer(dump_settings)){
			if(details.type==='main_frame'){
				self.setEnabled(details.tabId,false);
			}
			return;
		}
		dump_settings=self.separatedResponseData(dump_settings);
		Lib.setValPropPath(self.tabs,details.tabId+'.data.['+details.requestId+'].details.response',details);
		self.getDump(details,dump_settings);
		// прблемс - например мы изменили настройки сервера - то дальше он будет слать эти измененые настройки  
	
		//self.settings.setTab(details.tabId,dump_settings);
		self.settings.initTab(details.tabId,dump_settings);
	}
	getDump(details,settings={},sum_data=[])
	{ 
		var self=this;
		var header_dump={};
		var hostname=Lib.parseUrl(details.url).hostname; 
		var headers=self.auth.getAuth({url:details.url,requestHeaders:[]}).requestHeaders;
		settings=Lib.expand_replace(settings,{command:'read'});
		var header_dump=self.settings.get(details.tabId,details.url,settings);
		var xhr = new XMLHttpRequest();
		xhr.open('POST',details.url,true);
		var check=false;
		for(var i in headers){
			if(headers[i].name==='PHP-Dump-Settings'){
				headers[i].value=JSON.stringify(Lib.expand_replace(JSON.parse(headers[i].value),header_dump));
				check=true;
			}
			xhr.setRequestHeader(headers[i].name, headers[i].value);
		}
		if(check===false){
			headers.push({name:'PHP-Dump-Settings',value:JSON.stringify(header_dump)});
			xhr.setRequestHeader('PHP-Dump-Settings', header_dump);
		}
		//var buf=Lib.getValPropPath(self.tabs,details.tabId+'.data.[-1]');
		xhr.onload=function(response){
			var data =JSON.parse(response.target.responseText);
			Lib.setValPropPath(self.tabs,details.tabId+'.data.['+details.requestId+'].dump',data);
			self.view.renderContentDump(details.tabId,Lib.getValPropPath(self.tabs,details.tabId+'.data.'+details.requestId));
		}
		xhr.onerror=function(response){
			//self.renderContentDump(details,sum_data);
		}
		xhr.send();
	}
	isEnabled(tabId)
	{ // для включения выключения запросов на вкладке. 
		//return true;
		var self=this;
		if(!Lib.isProp(self.tabs,tabId)){
			self.view.renderEnabled(tabId,false);
			return false;
		}
		self.view.renderEnabled(tabId,self.tabs[tabId].settings.enabled);
		return self.tabs[tabId].settings.enabled;
	}
	setEnabled(tabId,check=true,tab=false)
	{
		var self=this;
		Lib.setValPropPath(self.tabs,tabId+'.settings.enabled',check);
		if(tab!==false){
			if(check==true){
				self.tabEnabled(tab);
			}else{
				self.tabDisabled(tab);
			}
		}	
		self.view.renderEnabled(tabId,check);
	}
	isEnabledServer(tabId,headers=false)
	{
		var self=this;
		self.auth.isAuthServer(headers);
	}
	tabEnabled(tab)
	{
		var self=this;
		
		if(!Lib.isPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onBeforeRequest')){
			var call=function call(details){
				Lib.setValPropPath(self.tabs,tab.id+'.data.'+details.requestId+'.details.request',details);
			}
			Lib.setValPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onBeforeRequest',call);
			chrome.webRequest.onBeforeRequest.addListener
				(	call
					,
					{urls:['<all_urls>'],tabId: tab.id},
					["requestBody"]
				);
		}
		if(!Lib.isPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onBeforeSendHeaders')){
			var call=function call(details){
						if(details.type==='main_frame'){
							//Lib.setValPropPath(self.tabs,tab.id+'.data',[]);
							//console.log(self.tabs[tab.id].data);
						}
						//Lib.setValPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onBeforeSendHeaders',call);
						return self.createDumpWebRequest(details);
					}
			Lib.setValPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onBeforeSendHeaders',call);
			chrome.webRequest.onBeforeSendHeaders.addListener
				( 	
					call,
					{urls:['<all_urls>'],tabId: tab.id},
					["blocking","requestHeaders"]
				);
		}
		if(!Lib.isPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onCompleted')){
			var call=function call(details){
					self.createDumpWebResponse(details);
				}
			Lib.setValPropPath(self.tabs,tab.id+'.settings.callbacks.webRequest.onCompleted',call);
			chrome.webRequest.onCompleted.addListener
				(	call
					,
					{urls:['<all_urls>'],tabId: tab.id},
					["responseHeaders"]
				);
		}
		chrome.tabs.reload(tab.id);
	}
	tabDisabled(tab)
	{
		var self=this;
		chrome.webRequest.onBeforeSendHeaders.removeListener(self.tabs[tab.id].settings.callbacks.webRequest.onBeforeSendHeaders);
		delete self.tabs[tab.id].settings.callbacks.webRequest.onBeforeSendHeaders;
		chrome.webRequest.onCompleted.removeListener(self.tabs[tab.id].settings.callbacks.webRequest.onCompleted);
		delete self.tabs[tab.id].settings.callbacks.webRequest.onCompleted;
		chrome.webRequest.onBeforeRequest.removeListener(self.tabs[tab.id].settings.callbacks.webRequest.onBeforeRequest);
		delete self.tabs[tab.id].settings.callbacks.webRequest.onBeforeRequest;
		self.settings.clearSite({[tab.url]:{type:'link'}});
		delete self.tabs[tab.id];
	}
}