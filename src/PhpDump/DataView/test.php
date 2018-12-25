<?php
namespace Alpa\PhpDump\DataView;
include_once __DIR__.'\Dump.php';
include_once __DIR__.'\DebuggerFile.php';
$settings=[];
$dump=new Dump();

$dBug=new DumpFileManager();
$dBug->open($dump,'create');
$dBug->write(['myvar'=>'Какакака']);
$dBug->write(['dfgg'=>'wesrdtfvghjk']);
$dBug->close(['dfgh'=>'fgh']);

$dBug->open($dump,'read');
$dBug->read(function($data){
	echo $data;
	
});
$dBug->close();
