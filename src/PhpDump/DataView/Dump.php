<?php
	namespace Alpa\PhpDump\DataView;
	class Dump {
		public $id;
		public $timestamp;
		public $path;
		public $user;		
		public $context;
		public $group;
		public $name;
		public $data;
		public function __construct($settings=[]){
			$this->timestamp=time();
			$this->path=__DIR__;
			$session_id=session_id();
			$this->user=!empty($session_id)?$session_id:'other_users';
			$this->context='web';
			$this->group=uniqid();
			$this->name=uniqid();
			$this->data='';
		}
	}