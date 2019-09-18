<?php
use Alpa\PhpDump\Manager;
//Author: AlexeyP0708
//Warning:(all methods with the trap of recursive loops) - Direct intervention. Use methods only for analysis.
// Warning: Also, try not to use a large data stack. Can cause memory overflow.
include_once __DIR__.'/lib.php';
$settings=[
	'hashkeys'=>[
		'HashKey'=>[
			'key'=>'HashKey',
			'greeting_server'=>'greeting_server',
			'greeting_client'=>'greeting_client'
		]
	]
];
$dump_settings=[ 
//allowed settings from client 'turn_on' 'debug_backtrace'
	'turn_on'=>['all'=>true], //turn_on=false - full off PhpDump. if array, then determines policy according to section. ['cat1/cat2'=>true, 'cat1/cat2/name'=>false , 'NS\\NS\\Class'=>true]  
	'unset_dump_after'=>true, // PhpDump safely removes directories. But first check the PhpDump operation on your system to enable this feature.
	'debug_backtrace'=>false
];
$dump_fields=[
	'path'=>__DIR__.'/../temp', //  directory for stack logs
	//'user'=>'' // Can be changed by the client part (via the browser console)
	//'context'=>''// Can be changed by the client part (via the browser console)
	//'group'=>'' //Can be changed by the client part (via the browser console)
	//'name'=>'' // only for server part
];

$_debugger_= Manager::init($settings,$dump_settings,$dump_fields);
class_alias('\Alpa\PhpDump\Manager','deb');
