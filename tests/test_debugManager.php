<?php
namespace Alpa;
include_once __DIR__.'/../vendor/autoload.php';
new PhpDump\InitDump();
\Deb::print(['gh'=>'Hello','bay','may'],'print');
\Deb::vdump(['gh'=>'Hello','bay','may'],'vdump');
trigger_error ('My Error');
class TestClass{
	public function test(){
		\Deb::print(__METHOD__,get_class());
		\Deb::print(__METHOD__,get_called_class());
	}
	public static function test2(){
		\Deb::print(__METHOD__,get_called_class());
	}
	public function __destruct (){
		trigger_error('error in __destruct method');
	}
}
class TestClass2 extends TestClass{
	
}
$obj=new TestClass2();
$obj->test();
$obj::test2();
?>
<html>
<head>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
	<script>
		$(document).ready(function(){
			$('#b1').on('click',function(){
				$.ajax({
					url:window.location.href,
					type:'post',
					dataType:'html',
					data:{hello:'pup'},
					success:function(data){
						//console.log($data);
					}
				});
			});
			
		});
	</script>
</head>
<body>
<input type="button" id="b1" value="test ajax"/>
</body>
</html>