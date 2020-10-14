<?php

/**
 * Writes data and errors to the dump stack according to the set settings.
 * for PHP version 7 and more
 * @autor Alexey Pakhomov  <AlexeyP0708@gmail.com>
 * @version 1.1
 */

namespace Alpa\PhpDump;

use \Alpa\EntityDetails\ReflectInfo;

class Dumper {
    private $init_check = false;
    private $dump_fields;
    public $storage;
    private $reflect_info;
    private $is_close=false;
    private $default_settings = [
        'turn_on' => [],
        'save_dump' => false,
        'render_dump_after' => false,
        'unset_dump_after' => false,
        'storage_class' => __NAMESPACE__ . '\DataView\JsonDumpFileManager2',
        'debug_backtrace' => false
    ];
	private $settings=[];
    //---
    public function __construct()
	{
		$this->settings=$this->default_settings;
	}
	public function __destruct()
	{
		//$this->end();
        if ($this->init_check === false) {
            return;
        }
		$this->shutdown('__destruct');
	}
	protected function shutdown($type)
	{
		// проблема с закрытием деструкторов... деструктор обьекта данного класса может закрыться раньше... и логирующая инфа в дамп не попадет.
		switch($type){
			case 'pcntl_signal': 
			case 'register_shutdown_function':
				$e = error_get_last();
				if(!is_null($e)){
                    if (!in_array($e['type'],[E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR])){
                        break;
                    }
                    if ($this->settings['save_dump'] !== false) {
                        $this->error($e['type'], $e['message'], $e['file'], $e['line']);
                    }
                    break;
                }
			case '__destruct':
                if($this->is_close){break;}
				if ($this->settings['render_dump_after'] === true) {
					$this->renderDump();
					if ($this->settings['unset_dump_after'] === true) {
						$this->deleteDump();
					}
				}
				$this->end();
                $this->is_close=true;
			break;
		}
	}
	/**
     *  Initialize the dump.
     * 
     * @param array $settings  See method $this->setSettings
     * @param \Alpa\PhpDump\DataView\Dump|null $dump_fields  The entity that defines the fields to manage the dump.
     *  
     */
    public function init($settings = [], DataView\Dump $dump_fields = null)
	{	
        if (isset($settings['turn_on']) && is_bool($settings['turn_on'])) {
			$this->turnOn($settings['turn_on']);
        }
        if (!$this->turnOnCheck()) {
            return;
        }
        if ($this->init_check === true) {
            return;
        }
        $this->reflect_info = new ReflectInfo();
        $this->init_check = true;
        $this->setSettings($settings);
        $this->setDumpFields($dump_fields);
        $this->storage = new $this->settings['storage_class']();
        if ($this->settings['save_dump'] === true) {
            $this->storage->open($this->dump_fields, 'create');
        }
		$self=$this;
		$shutdown=function ()use($self){
			$self->shutdown('register_shutdown_function');
		};
		register_shutdown_function($shutdown);
		/*declare(ticks = 1){
			$sigterm=function()use($self){
				$self->shutdown('pcntl_signal');
			}	;		
			pcntl_signal(SIGTERM,$sigterm);
		};*/
        ErrorHandlers::init();
        ErrorHandlers::addHandler([$this,'errorHandler']);

        ExceptionHandlers::init();
        ExceptionHandlers::addHandler([$this,'exceptionHandler']);
        //set_error_handler([$this,'errorHandler']);
    }
    public function exceptionHandler($ex)
    {
        $return ='Exception: '. $ex->getCode() . ' => [' . $ex->getFile() . ']:[' . $ex->getLine() . '] ' . $ex->getMessage();
        //\deb::print($ex->getTrace(),$return);
        $this->print($ex->getTrace(),$return);
    }
    public function errorHandler($errno, $errstr, $errfile, $errline)
    {
        //$return = $errstr . ' => [' . $errfile . ']:[' . $errline . ']\n';
        $this->error($errno, $errstr, $errfile, $errline);
        //$storage = &$this->storage;
        //return false;
    }
    /**
     * Enable/disable Dumper.
     * 
     * @param bool|array $keys   if array, then to enable or disable individual output.
     *  Array keys 
     *  "all" (bool) enabled or disabled the data output for all
     *  "any_name_key" (bool) Включает или отключает запись данных в дамп под  именем "any_name_key".
     * Exemple: $this->turnOn(['name_list'=>true,'all'=>false]); $this->print(['Felix','Alex'],'name_list'); "print" method will only be activated for a key "name_list".
     * @return null
     */
    public function turnOn($keys = true)
	{	
        if (!$this->turnOnCheck()) {
            return;
        }
        if (is_array($this->settings['turn_on'])) {
            if (is_array($keys)) {
                foreach ($keys as $key => $check) {
                    $key = trim(str_replace('/', '\\', $key), '\\');
                    $this->settings['turn_on'][$key] = $check;
                    /* if($check===true){
                      $this->settings['turn_on'][$key]=true;
                      } else {
                      unset($this->settings['turn_on'][$key]);
                      } */
                }
            } else if (is_bool($keys)) {
                if ($keys === false) {
                    $this->settings['turn_on'] = false;
                } else {
                    $this->settings['turn_on'] = [];
                }
            }
        }
    }
    /**
     * Checks  is actived whether a dump or  a record with the given name 
     * @param string|bool $name
     * @return boolean
     */
    public function turnOnCheck($name = null)
    { 
        if (!isset($this->settings['turn_on']) ||
            !is_array($this->settings['turn_on'])
        ) {
            return false;
        }
        if (is_string($name)) {
            if (!isset($this->settings['turn_on']['all'])) {
                $this->settings['turn_on']['all'] = true;
            }
            if (count($this->settings['turn_on']) == 1) {
                if ($this->settings['turn_on']['all'] == true) {
                    return true;
                } else {
                    return false;
                }
            }
            $name_buf = str_replace('/', '\\', $name);
            $cat = explode('\\', $name);
            $names = [];
            $name_buf = '';
            foreach ($cat as $val) {
                $name_buf = $name_buf . '\\' . $val;
                $names[] = trim($name_buf, '\\');
            };
            if ($this->settings['turn_on']['all'] == true) {
                $check = true;
                foreach ($names as $nm) {
                    if (isset($this->settings['turn_on'][$nm])) {
                        if ($this->settings['turn_on'][$nm] == false) {
                            $check = false;
                            break;
                        }
                    }
                }
            } else {
                $check = false;
                foreach ($names as $nm) {
                    if (isset($this->settings['turn_on'][$nm])) {
                        if ($this->settings['turn_on'][$nm] == true) {
                            $check = true;
                            break;
                        }
                    }
                }
            }
            return $check;
        } else {
            return true;
        }
    }

    /**
     *  @param array $settings
     *  Assoc Array settings paarams.
     *      "turn_on" - (bool or assoc array) default - empty array.  If the type is bool, enables disables the Dumper.
     *          If an associative array, enables and/or disables output data whose keys match the given list.
     *      "save_dump" - (bool) default-false. Save dump 
     *      "render_dump_after" - (bool) default -false. Return the dump at the end of the script
     *      "unset_dump_after" - (bool) remove the dump when you end the script
     *      "storage_class"  - class which defines the format of the dump (write to file or database) and performs reading or writing  in dump. 
     *      "debug_backtrace" - adds  backtrace to the output data
     */
    public function setSettings($settings = [])
    {    
        if (!$this->turnOnCheck()) {
            return;
        }
        $this->init();
        foreach ($settings as $key => &$value) {
            switch ($key) {
                case 'storage_class':    
                if(!in_array('Alpa\\PhpDump\\DataView\\DumpManagerInterface',class_implements($value))){
                    break;
                }; 
                case 'turn_on':
                    $buf_val = [];
                    if (is_bool($value)) {
                        $this->turnOn($value);
                        break;
                    }
                    foreach ($value as $k => &$v) {
                        $k_buf = str_replace('/', '\\', $k);
                        if ($k_buf !== $k) {
                            $buf_val[$k_buf] = $v;
                        } else {
                            $buf_val[$k] = $v;
                        }
                    }
                    $value = $buf_val;
                default:
                    if (isset($this->settings[$key])) {
                        $this->settings[$key] = $value;
                    }
                break;
            }
        }

        //$this->settings=array_merge($this->settings,$settings);
    }
    /**
     * 
     * @return array Return settings params
     */
    public function getSettings()
	{
        return $this->settings;
    }
    /**
     * 
     * @return \Alpa\PhpDump\DataView\Dump
     */
    public function getDumpFields() : DataView\Dump
    {
        return $this->dump_fields;
    }
    /**
     * 
     * @param \Alpa\PhpDump\DataView\Dump $dump_fields
     */
    public function setDumpFields(DataView\Dump $dump_fields = null) 
	{
        $this->dump_fields = ($dump_fields === null) ? new DataView\Dump() : $dump_fields;
    }
   
    /**
     * Writing to the dump the result of the var_dump function
     * @param mixed $var
     * @param string $name Record key
     * @return null;
     */
    public function vdump($var, string $name = '',$backtrace=false)
	{
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
        ob_start();
		if(($ovd=ini_get("xdebug.overload_var_dump"))!==false){
			ini_set('xdebug.overload_var_dump','off');
			var_dump($var);
			ini_set('xdebug.overload_var_dump',$ovd);
		} else {
			var_dump($var);
		}
        $return = ob_get_contents();
        ob_end_clean();
        $this->addDump($return, $name,$backtrace);
    }
    /**
     * Writing to the dump the result.
     * @param mixed $var
     * @param string $name Record key
     * @return void
     */
    public function vexport($var, $name = '',$backtrace=false)
	{
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
       // $var = $this->excludeCircularReferences($var);
		$var =$this->reflect_info->repeatRecursiveDataIntoArray($var);
        $return = var_export($var, true);
        $this->addDump($return, $name,$backtrace);
    }
    /**
     * Performs the analysis of objects recursively and Writing to the dump the result.
     * @param mixed $var
     * @param string $name Record key
     * @return void
     */
    public function dump($var, $name = '',$backtrace=false)
    {
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
        $return = $this->reflect_info->getInfoObjectArrayRecurs($var);
        $this->addDump($return, $name,$backtrace);
    }
    public function infoClass($var, $name = '') 
    {
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
        $return = $this->reflect_info->getInfoClass($var);
        $this->addDump($return, $name);
    }
    /**
     * Performs variable analysis  and Prepares a variable to write to dump. eliminates loops in arrays and objects.
     * @param mixed $var
     * @param string $name Record key
     * @return void
     */
    public function print($var, $name = '', $backtrace=false)
	{
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
        //$return = $this->excludeCircularReferences($var);
		$return =$this->reflect_info->repeatRecursiveDataIntoArray($var);
        $this->addDump($return, $name,$backtrace);
    }
    /**
     * 
     * @param string|int $errno Code Error or custom identification
     * @param string $errstr Error message 
     * @param string $errfile  file where the error occurred
     * @param string $errline  line where the error occurred
     * @return void
     */
    public function error($errno = false, $errstr, $errfile = false, $errline = false) 
	{
        $errno = $errno == false ? 1024 : $errno;
        $name = 'Errors\\' . $errno;
        if (!$this->turnOnCheck() || !$this->turnOnCheck($name)) {
            return;
        }
        $this->init();
        if ($errfile === false || $errline === false) { // при trigger_error и др генераций ошибок debug_backtrace  не будет вызываться 
            $dbt = array_slice(debug_backtrace(2, 0), -1);
            $errfile = $errfile !== false ? $errfile : $dbt[0]['file'];
            $errline = $errline !== false ? $errline : $dbt[0]['line'];
        }
        $res = $errstr . ' [' . $errfile . ']:[' . $errline . "]";
        $err_stack = [
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE ',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
            E_STRICT => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED',
            E_ALL => 'E_ALL'
        ];
        $errno_str = isset($err_stack[$errno]) ? $err_stack[$errno] : $errno;
        $this->addDump($errno_str . ': ' . $res, $name,false);
    }
    public function emptyMethod()
	{
		return null;
	}
    private function addDump($data, $name,$backtrace=false)
	{
        $uniq = '';
        $name = ($name !== '') ? $name : 't_' . time() . $uniq;
        $data = ['data' => $data];
        if ($this->settings['debug_backtrace'] || $backtrace) {
            $dbt = array_slice(debug_backtrace(2, 0), 0);
            $data = array_merge($data, ['backtrace' => $dbt]);
        }
        $this->saveDump([$name => &$data]);
    }

    private function saveDump($dump = false) 
	{
        if (!$this->turnOnCheck()) {
            return;
        }
        $this->init();
        $this->storage->write($dump);
    }
    /* reading an existing dump implies that all entries to it have been made and will be closed for writing and open for reading. old entries  erases */

    private function renderDump(DataView\Dump $dump = null) 
	{
        if (!$this->turnOnCheck()) {
            return;
        }
        if ($dump == null) {
            $storage = $this->storage;
            $storage->open($this->dump_fields, 'read');
        } else {
            $storage = new $this->settings['storage_class']();
            $storage->open(DataView\Dump, 'read');
        }
        $call = function($data) {
            echo $data;
        };
        $storage->read($call);
    }

    private function deleteDump(DataView\Dump $dump = null) 
	{
        if (!$this->turnOnCheck()) {
            return;
        }
        if ($dump == null) {
            $storage = $this->storage;
            $storage->open($this->dump_fields, 'read');
        } else {
            $storage = new $this->settings['storage_class']();
            $storage->open(DataView\Dump, 'read');
        }
        $storage->delete(false);
    }
    /**
     * If the settings are changed based on the code logic, then this method is used to change them in dumper.
     * The method should call before displaying the content.
     * @param type $settings
     * @param type $dump_fields
     * @return void
     */
    public function reorganization($settings = [], $dump_fields = null) 
	{
        if (!$this->turnOnCheck()) {
            return;
        }
        if ($this->init_check === false) {
            $this->init($settings, $dump_fields);
            return;
        };
        if (empty($dump_fields)) {
            $dump_fields = $this->dump_fields;
        }
        if (!isset($settings['storage_class'])) {
            $settings['storage_class'] = $this->settings['storage_class'];
        }
        if ($settings['storage_class'] != $this->settings['storage_class'] || $dump_fields != $this->dump_fields) {
            $this->storage->close(false);
            $new_storage = new $settings['storage_class']($dump_fields);
            $this->storage->open($this->dump_fields, 'read');
            $new_storage->open($dump_fields, 'create', false);
            $call = function($data)use($new_storage) {
                $new_storage->write($data, true);
            };
            $data = $this->storage->read($call);
            $this->storage->delete();
            $this->storage = $new_storage;
            $this->setDumpFields($dump_fields);
        }
        $this->setSettings($settings);
    }
	public function end()
	{
		if (!$this->turnOnCheck()) {
            return;
        }
		$this->storage->close();
		$this->storage=null;
		$dump_fields=null;
		$this->settings=[];
		$this->turn_on=false;
	}
}
