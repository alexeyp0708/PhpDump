export default class ViewDebugger {
	constructor(){
		this.messages={};
		this.port=false;
		this.sw=new MessageSwitch();
		this.sw.connect({filter:{name:'content_script'}});
	}
	renderContentDump(tabId,data,name=''){
		var self=this;
		console.log('tab id => ',tabId,data);
		if(data.details.request.type=='main_frame' && data.details.request.parentFrameId==-1){
			this.sw.disconnect({filter:{name:['content_script'],tabId:[tabId]}}); // преждевременное завершение. ибо request вперед батьки (diconect) лезет
		}
		this.sw.post({
			destination:'render_dump',
			data:{details:data.details,data:data.dump,name:name},
			filter:{name:['content_script'],tabId:[tabId]},
			defer_connect:{remove:true,always:false} 
		});
	}
	renderEnabled(tabId,check){
		var self=this;
		if(check===true){
			self.iconsColor(tabId,'blue');
		} else {
			self.iconsColor(tabId,'red');
		}
	}
	iconsColor(tabId,color,size='16'){
		chrome.pageAction.setIcon({tabId:tabId,path:'icons/settings_'+color+size+'.png'});
	}
}