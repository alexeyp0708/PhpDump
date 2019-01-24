## Запуск на сайте с CMS MODX.

Установите PhpDump как описано ранее. 

MODX по своей природе вместо того чтобы генерировать ошибку или создавать исключаения средствами PHP, он просто их логирует в журнале, что не есть хорошо. 
Поэтому для отображения сгенерированных логов в консоли необходимо провести кастомизацию. 
В файле  `core\xpdo\xpdo.class.php` (для MODX revo 2.7) оформить метод log следующим образом:
 ```php
    public function log($level, $msg, $target= '', $def= '', $file= '', $line= '') {
    	if(class_exists('deb',false) && \deb::isTurnOn()){
    		\deb::print($msg."=>[$target][$def][$file][$line]",'LOG');
    	} else{
    		$this->_log($level, $msg, $target, $def, $file, $line); 
    	}
        
    }
 ```
За отображение ошибок и исключений PHP отвечает в MODX класс modErrorHandler
Данный класс можно переопределить. 
Создадим собственный класс `{core_path}components/alpa/alpaerrorhandler.class.php` 
```php
<?php
	include_once MODX_CORE_PATH.'model/modx/error/moderrorhandler.class.php';
	class AlpaErrorHandler extends modErrorHandler {
	    public function handleError($errno, $errstr, $errfile = null, $errline = null, $errcontext = null) {
			if(class_exists('\deb',false) && \deb::isTurnOn()){
				\deb::error($errno, $errstr, $errfile,$errline); 
			} else {
				parent::handleError($errno, $errstr, $errfile, $errline);
			}
			return true;
	    }
	}

```
Далее, в админ панели MODX зайдем в настройки и установим следующие новые настройки
`error_handler_class=AlpaErrorHandler`
`error_handler_path={core_path}components/alpa/` 
Класс будет определяеться на момент инициализации MODX.
Путь к классу можно изменить в соответсвии где он лежит. Но важно помнить что на момент инициализации, MODX знает только системные переменные, такие как {base_pach}, {core_path}. Если вы создадите собственные переменные, то они не распознаются на момент инициализации. 

Запись логов в журнал логов MODX не будет происходить, если Php Dump  будет активирован.
Php Dump активируется вслучае если активирован на бекенде, и клиент запрашивает формирование дампа.
