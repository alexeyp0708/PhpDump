import Debugger from './Debugger.js';
var sw= new MessageSwitch();
sw.connect({filter:{name:'content_script'}});
//-----------------------------------------------------
//-----------------------------------------------------
var dbgr=new Debugger();
dbgr.auth.setHashKeyDomain('global','HashKey','greeting_client','greeting_server');
chrome.pageAction.onClicked.addListener
(
	function (tab){
		dbgr.setEnabled(tab.id,!dbgr.isEnabled(tab.id),tab);
	}
);
chrome.tabs.onUpdated.addListener(
	function(tabId, changeInfo, tab){
		dbgr.isEnabled(tabId);
		chrome.pageAction.show(tabId);
	}
);
sw.addListener({
		destination:'any',
		filter:{name:['content_script']},
		defer_connect:true,
		call:function(msg,self,port){
			var tabId=port.sender.tab.id;
			var url=port.sender.tab.url;
			switch(msg.destination){
				case 'getDumpSettings':
					var settings=dbgr.settings.get(tabId,url);
					port.postMessage({destination:'getDumpSettings',data:{return:settings}});
				break;
				case 'setSiteDumpSettings':
					dbgr.settings.setSite(msg.data.settings, msg.data.save);
					port.postMessage({destination:'setSiteDumpSettings',data:{return:true}});
				break;
				case 'saveStorageAllSettings':
					dbgr.saveStorageAll();
					port.postMessage({destination:'saveStorageAllSettings',data:{return:true}});
				break;
				case 'clearSiteDumpSettings':
					dbgr.settings.clearSite(msg.data.patterns,msg.data.save);
					port.postMessage({destination:'clearSiteDumpSettings',data:{return:true}});
				break;
				case 'bindHashKeyDomain':
					dbgr.auth.bindHashKeyDomain(msg.data.domain,msg.data.hashkey);
					dbgr.auth.saveStorageAuth();
					break;
				case 'unbindHashKeyDomain':
					dbgr.auth.unbindHashKeyDomain(msg.data.domain,msg.data.hashkey);
					dbgr.auth.saveStorageAuth();
					break;
				case 'setHashKey':
					dbgr.auth.setHashKey(
												msg.data.hashkey,
												msg.data.greeting_client,
												msg.data.greeting_server);
					dbgr.auth.saveStorageAuth();
				break;
				case 'deleteHashKey':
					dbgr.auth.deleteHashKey(msg.data.hashkey);
					dbgr.auth.saveStorageAuth();
				case 'getAuthHashKeys':		
					port.postMessage({destination:'getAuthHashKeys',data:{return:dbgr.auth.getHashKeys()}});
				break;
			}
			if(typeof msg.data !='undefined' && 'reload' in msg.data && msg.data.reload==true){
				port.postMessage({destination:'reload'});
			}
		}
});

var openCount = 0;
/*
chrome.runtime.onConnect.addListener(function (port) {
	console.log(port);
    if (port.name == "devtools-page") {  console.log('open');
      if (openCount == 0) {
      
      }
      openCount++;

      port.onDisconnect.addListener(function(port) {
          openCount--;console.log('close');
          if (openCount == 0) {
				
          }
      });
    }
});
*/