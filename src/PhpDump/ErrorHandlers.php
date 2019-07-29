<?php
/**
 * Created by PhpStorm.
 * User: AlexeyP
 * Date: 28.07.2019
 * Time: 15:37
 */
namespace Alpa\PhpDump;
    class ErrorHandlers {
        protected static $handlers=[];
        protected static $last_handler=null;
        protected static $init=false;

        /**
         * Инициализирует  обработчики.
         * устанавливает в set_error_handler исполнение метода runHandlers
         */
        public static function init(){
            if (self::$init==true){ return; }
            self::$init=true;
            $prev =set_error_handler([static::class,'runHandlers']);
            if (!empty($prev)){
               static::setHandler($prev,null);
            }
        }

        /**
         * Добавляет обработчик в стек обработчиков
         * @param $hand
         * @param null $error_types
         * @return null
         */
        public static  function addHandler($hand,$error_types=null)
        {
            if(is_callable($hand)){
                self::$handlers[]=[$hand,$error_types];
            }
        }
        public static function clearHandlers($lst=false)
        {
            self::$handlers=[];
            if($lst){
                self::$last_handler=null;
            }
        }
        /**
         * Устанавливает стек обработчиков
         * @param array $handlers массив Каждый элемент это массив из 2 составляющих
         * [0]- это обработчик. может быть [класс\обьект, метод], именем функции или функцией замыкания
         * [1]- это типы ошибок на которые он будет установлен. Если его нет то будет установлен $error_types_default
         * или  элементом может быть обработчик([класс\обьект, метод], именем функции или функцией замыкания).
         * ТОгда по умолчанию будет установлен $error_types_default
         * @param null $error_types_default
         */
        public function setHandlers(array $handlers,$error_types_default=null)
        {
            foreach($handlers as &$handler){
                if(!is_array($handler) || is_callable($handler)){
                    $handler=[$handler,$error_types_default];
                }
                if(!isset($handler[1])){
                    $handler[1]=$error_types_default;
                }
            }
            unset($handler);
            self::$handlers=$handlers;
        }

        /**
         * возвращает стек обработчиков.
         * Каждый элемент это массив из 2 составляющих
         * [0]- это обработчик. может быть [класс\обьект, метод], именем функции или функцией замыкания
         * [1]- это типы ошибок на которые он будет установлен
         * @return array
         */
        public static function getHandlers()
        {
            $answer=self::$handlers;
            $answer[]=self::$last_handler;
            return $answer;
        }

        /**
         * Устанавливает  последний обработчик ошибки
         * как правило необходим для замены set_error_handlers в коде не нарушаая целостности.
         * но можно использовать в качестве завершающего обработчика.
         * @param $hand обработчик
         * @param array|integer|null $error_types
         */
        public static function setLastHandler($hand,$error_types=null)
        {
            if(is_callable($hand)){
                self::$last_handler=[$hand,$error_types];
            }
        }

        /**
         * Запускает обработчики ошибок. Как правило устанавливается в set_error_handlers
         * для обработчка в стеке, возвращаемый результат не имеет значения.
         *  результат возвращается последнего обработчика если он установлен через setLastHandler
         *  и имеет такоеже значение как и возвращаемый результат в set_error_handlers
         * @param $errno
         * @param mixed ...$args
         * @return bool|mixed
         */
        public static function runHandlers($errno,...$args)
        {
            $answer=true;
            foreach(self::$handlers as &$handler){
                if( static::permissionProcess($errno,$handler[1])){
                    call_user_func($handler[0],$errno,...$args);
                }
            }
            unset($handler);
            if(self::$last_handler!=null){
                // отработать условия по self::$last_handler[1]см set_error_handler 2й аргумент
                if(static::permissionProcess($errno,self::$last_handler[1])){
                    $answer=call_user_func(self::$last_handler[0],$errno,...$args);
                }
            }
            return $answer;
        }

        /**
         * РАзрешение на выполнение процесса исходя из ошибки и установленных правил для исполнения процесса
         * https://www.php.net/manual/ru/errorfunc.constants.php
         * @param $param  номер ошибки
         * @param array|int $rule массив с перечислинными константами типов ошибок, или битовая маска
         * @return bool
         */
        protected static function permissionProcess($param, $rule){
            if(is_null($rule)){
                return true;
            } else
            if(is_array($rule)){
                return in_array($param,$rule);
            } else if(((int)$param & (int)$rule)>0){
                return true;
            }
        }
    }
//$check_exception_rename=runkit_function_rename ('set_exception_handler' , '_set_exception_handler');



