<?php
namespace Alpa\PhpDump;
class Manager {

    protected static $settings = [
        'hashkeys' => [],
    ];
    protected static $dump_fields;
    protected static $dump_settings = [];
    protected static $is_init = false;
	protected static $dumper;
    public static function defaultSettings($settings = [], $dump_settings = [], $dump_fields = []) {
        self::$dump_fields = new DataView\Dump();
        self::$dump_fields->path = __DIR__ . '/temp/';

        foreach ($dump_fields as $key => $value) {
            self::$dump_fields->$key = $value;
        }
        self::$dump_settings = array_merge(self::$dump_settings, $dump_settings);
        self::$settings = array_merge(self::$settings, $settings);
    }

    public static function setSettings($settings = [], $dump_settings = [], $dump_fields = null) {
        if (!empty($settings)) {
            self::$settings = array_merge(self::$settings, $settings);
        }
        if (!empty($dump_settings)){
            self::$dump_settings = array_merge(self::$dump_settings, $dump_settings);
        }
        if (!empty($dump_fields)) {
            $new_dump_fields = new DataView\Dump();
            foreach (self::$dump_fields as $key => $value) {
                $new_dump_fields->$key = $value;
            }
            foreach ($dump_fields as $key => $value) {
                $new_dump_fields->$key = $value;
            }
        } else {
            $new_dump_fields = self::$dump_fields;
        }
        if (!empty($dump_settings) || !empty($dump_fields)) {
            self::$dumper->reorganization(self::$dump_settings, $new_dump_fields);
            self::$dump_fields = $new_dump_fields;
        }
    }
    public static function getSettings($settings = [], $dump_settings = [], $dump_fields = []) {
        // аргументы - дополнить данные аргументами

        return ['settings' => array_merge(self::$settings), 'dump_settings' => array_merge(self::$dumper->getSettings(), $dump_settings), 'dump_fields' => array_merge((array) self::$dumper->getDumpFields(), (array) $dump_fields)];
    }

    /*public static function getFilteredSettingsHeader($settings = [], $dump_settings = [], $dump_fields = []) {

        return $res;
    }*/
    public static function filteredSettingsHeader($data, $type = 'create') {
        $res = ['settings' => [], 'dump_settings' => [], 'dump_fields' => []];
        if (isset($data['dump_settings'])) {
            foreach ($data['dump_settings'] as $key => $value) {
                switch ($key) {
                    case 'turn_on':
                        if (is_bool(self::$dump_settings['turn_on'])) {
                            $res['dump_settings']['turn_on'] = self::$dump_settings['turn_on'];
                            break;
                        }
                    case 'debug_backtrace':
                        $res['dump_settings'][$key] = $value;
                        break;
                }
            }
        }
        if (isset($data['dump_fields'])) {
            foreach ($data['dump_fields'] as $key => $value) {
                switch ($key) {
                    case 'user':
                    case 'context':
                    case 'group':
                        $res['dump_fields'][$key] = $value;
                        break;
                    case 'name':
                    case 'timestamp':
                    //case 'path': //  патч должен определяться только сервером. Если клиент пошлет на чтение другой путь то он может прочитать любой файл. 
                        if ($type == 'read') {
                            $res['dump_fields'][$key] = $value;
                        }
                        break;
                }
            }
        }
        return $res;
    }
    public static function reorganization($settings = [], $dump_settings = [], $dump_fields = null, $read_exit = true) {
        /* нахера козе боян.  Принцип. - Если нужно где то настройки изменить до отправки заголовков, то вызываем этот метод. 
          Он применит соответствующие настройки и изменит заголовки. Заголовки дебагера определенные ранее будут перезаписаны с соответствующими настройками.
          Вопрос: и нахера повторная авторизация если init это совершает. можно просто проверить - авторизированы или нет.
        */
        if (headers_sent()) {
            return;
        }
        $headers = getallheaders();
        $header = [];
        if (is_bool(self::$dump_settings['turn_on'])) {
            self::$dumper->turnOn(self::$dump_settings['turn_on']);
            if (self::$dump_settings['turn_on'] == false) {
                return;
            }
        }
        if (isset($headers['php-dump-settings'])){
            $header = json_decode($headers['php-dump-settings'], true);
        }
        $hashkeys = self::$settings['hashkeys'];
        // проходим аунтентификацию.
        if (empty($header) ||
                !isset($header['status_client']) ||
                $header['status_client'] === 'disabled' ||
                !isset($header['hashkey']) ||
                !isset($hashkeys[$header['hashkey']]) ||
                $hashkeys[$header['hashkey']]['greeting_client'] !== $header['greeting_client']
        ) {
            self::$dumper->turnOn(false);
            return false;
        }
        $buf_response_headers = headers_list();
        $response_headers = [];
        foreach ($buf_response_headers as $value){
            $value = explode(':', $value);
            $response_headers[$value[0]] = implode(':', array_slice($value, 1));
        }
        $response_header = [];
        if (isset($response_headers['php-dump-settings'])){
            $response_header = json_decode($response_headers['php-dump-settings'], true);
        }
        if ($header['command'] == 'create') {
            $response_header = self::filteredSettingsHeader($response_header, 'create');
            self::setSettings(array_merge($settings, $response_header['settings']), array_merge($dump_settings, $response_header['dump_settings']), array_merge($dump_fields, $response_header['dump_fields']));
            $res = self::getSettings();
            $response_header = array_merge($response_header, $res);
            // header перезаписать
            header_register_callback(function()use ($response_header) {
                header('php-dump-settings:' . json_encode($response_header));
            });
        }
    }
	public static function includeFileInit($file=__DIR__.'/../init_php_dump.php')
	{
		include_once $file;	
	}
    public static function init($settings = [], $dump_settings = [], $dump_fields = null, $read_exit = true) {

        if (self::$is_init == true) {
            return;
        }
		self::$dumper=new Dumper();
        self::$is_init = true;
        $headers = \getallheaders();
        $header = [];
        self::defaultSettings($settings, $dump_settings, $dump_fields);
        if (is_bool(self::$dump_settings['turn_on'])) {
            self::$dumper->turnOn(self::$dump_settings['turn_on']);
            if (self::$dump_settings['turn_on'] == false) {
                return;
            }
        }
        if (isset($headers['php-dump-settings'])) {
            $header = json_decode($headers['php-dump-settings'], true);
        }
        $hashkeys = self::$settings['hashkeys'];
        // проходим аунтентификацию. // создать отдельный метод

        if (empty($header) ||
                !isset($header['status_client']) ||
                $header['status_client'] === 'disabled' ||
                !isset($header['hashkey']) ||
                !isset($hashkeys[$header['hashkey']]) ||
                $hashkeys[$header['hashkey']]['greeting_client'] !== $header['greeting_client']
        ) {
            self::$dumper->turnOn(false);
            return false;
        }
        // устанавливаем заголовки авторизации
        $dump_response_settings = [
            'status_server' => 'enabled',
            'hashkey' => $hashkeys[$header['hashkey']]['key'],
            'greeting_server' => $hashkeys[$header['hashkey']]['greeting_server']
        ];
        if (!isset($header['command'])) {
            $header['command'] = 'create';
        }
        // запись дампа- запрос дампа запрос файла дампа
        if ($header['command'] == 'create') {
            $header = self::filteredSettingsHeader($header);
            /* $dump_fields=self::$dump_fields;
              foreach($header['dump_fields'] as $k=>$v){
              $dump_fields->$k=$v;
              } */
            //self::setSettings(array_merge($header['settings'],$settings),array_merge($header['dump_settings'],$dump_settings),$dump_fields);
            self::$dump_settings['save_dump'] = true;
            self::setSettings($header['settings'], $header['dump_settings'], $header['dump_fields']);
            $headers_fields = self::getSettings();
            $headers_fields = self::filteredSettingsHeader($headers_fields, 'read');
            $headers_fields = array_merge($dump_response_settings, $headers_fields);
            header_register_callback(function()use($headers_fields) {
                header('php-dump-settings:' . json_encode($headers_fields));
            });
        } else if ($header['command'] == 'read') {
            self::$dump_settings['save_dump'] = false;
            self::$dump_settings['render_dump_after'] = true;
            $header = self::filteredSettingsHeader($header, 'read');
            /* foreach($header['dump_fields'] as $k=>$v){
              $dump_fields[$k]=$v;
              } */
            //self::setSettings(array_merge($settings,$header['settings']),array_merge($dump_settings,$header['dump_settings']),$dump_fields);
            self::setSettings($header['settings'], $header['dump_settings'], $header['dump_fields']);
            header_register_callback(function()use ($dump_response_settings) {
                header('php-dump-settings:' . json_encode($dump_response_settings));
            });
            if ($read_exit === true) {
                exit;
            }
        }
    }
	public static function isTurnOn($name = null)
	{
		return self::$dumper->turnOnCheck($name);
	}
	public static function end ()
	{
		$self=self::$self;
		$self->dumper->end();
		$self->dumper=null;
		self::$self=null;
	}
	public static function dump($data, $name='',$backtrace=false) {
		self::$dumper->dump($data, $name,$backtrace);
	}
	public static function infoClass($data, $name='',$backtrace=false) {
		self::$dumper-> infoClass($data, $name,$backtrace);
	}
	public static function error($errno = false, $errstr, $errfile = false, $errline = false, $errcontext = false) {
	   self::$dumper->error($errno, $errstr, $errfile, $errline, $errcontext);
	}

	public static function vdump($data, $name = '',$backtrace=false)
	{
		self::$dumper->vdump($data, $name,$backtrace);
	}

	public static function vexport($data, $name = '',$backtrace=false)
	{
		self::$dumper->vexport($data, $name,$backtrace);
	}
	public static function print($data, $name = '',$backtrace=false)
	{
		self::$dumper->print($data, $name,$backtrace);
	}
}
