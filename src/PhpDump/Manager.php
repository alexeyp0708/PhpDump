<?php
namespace Alpa\PhpDump;
class Manager {

    public $settings = [
        'hashkeys' => [],
    ];
    public $dump_fields;
    public $dump_settings = [];
    public $is_init = false;
	public $dumper;
	static public $self;
    public function __construct($settings = [], $dump_settings = [], $dump_fields = null, $read_exit = true) {
        $this->dumper=new Dumper();
		self::$self=$this;
		$this->init($settings, $dump_settings, $dump_fields);
    }
    public function defaultSettings($settings = [], $dump_settings = [], $dump_fields = []) {
        $this->dump_fields = new DataView\Dump();
        $this->dump_fields->path = __DIR__ . '/temp/';

        foreach ($dump_fields as $key => $value) {
            $this->dump_fields->$key = $value;
        }
        $this->dump_settings = array_merge($this->dump_settings, $dump_settings);
        $this->settings = array_merge($this->settings, $settings);
    }

    public function setSettings($settings = [], $dump_settings = [], $dump_fields = null) {
        if (!empty($settings)) {
            $this->settings = array_merge($this->settings, $settings);
        }
        if (!empty($dump_settings)) {
            $this->dump_settings = array_merge($this->dump_settings, $dump_settings);
        }
        if (!empty($dump_fields)) {
            $new_dump_fields = new DataView\Dump();
            foreach ($this->dump_fields as $key => $value) {
                $new_dump_fields->$key = $value;
            }
            foreach ($dump_fields as $key => $value) {
                $new_dump_fields->$key = $value;
            }
        } else {
            $new_dump_fields = $this->dump_fields;
        }
        if (!empty($dump_settings) || !empty($dump_fields)) {
            $this->dumper->reorganization($this->dump_settings, $new_dump_fields);
            $this->dump_fields = $new_dump_fields;
        }
    }

    public function getSettings($settings = [], $dump_settings = [], $dump_fields = []) {
        // аргументы - дополнить данные аргументами

        return ['settings' => array_merge($this->settings), 'dump_settings' => array_merge($this->dumper->getSettings(), $dump_settings), 'dump_fields' => array_merge((array) $this->dumper->getDumpFields(), (array) $dump_fields)];
    }

    public function getFilteredSettingsHeader($settings = [], $dump_settings = [], $dump_fields = []) {

        return $res;
    }

    public function filteredSettingsHeader($data, $type = 'create') {
        $res = ['settings' => [], 'dump_settings' => [], 'dump_fields' => []];
        if (isset($data['dump_settings'])) {
            foreach ($data['dump_settings'] as $key => $value) {
                switch ($key) {
                    case 'turn_on':
                        if (is_bool($this->dump_settings['turn_on'])) {
                            $res['dump_settings']['turn_on'] = $this->dump_settings['turn_on'];
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

    public function reorganization($settings = [], $dump_settings = [], $dump_fields = null, $read_exit = true) {
        /* нахера козе боян.  Принцип. - Если нужно где то настройки изменить до отправки заголовков, то вызываем этот метод. 
          Он применит соответствующие настройки и изменит заголовки. Заголовки дебагера определенные ранее будут перезаписаны с соответствующими настройками.
          Вопрос: и нахера повторная авторизация если init это совершает. можно просто проверить - авторизированы или нет.
         */
        if (headers_sent()) {
            return;
        }
        $headers = getallheaders();
        $header = [];
        if (is_bool($this->dump_settings['turn_on'])) {
            $this->dumper->turnOn($this->dump_settings['turn_on']);
            if ($this->dump_settings['turn_on'] == false) {
                return;
            }
        }
        if (isset($headers['PHP-Dump-Settings'])) {
            $header = json_decode($headers['PHP-Dump-Settings'], true);
        }
        $hashkeys = $this->settings['hashkeys'];
        // проходим аунтентификацию.
        if (empty($header) ||
                !isset($header['status_client']) ||
                $header['status_client'] === 'disabled' ||
                !isset($header['hashkey']) ||
                !isset($hashkeys[$header['hashkey']]) ||
                $hashkeys[$header['hashkey']]['greeting_client'] !== $header['greeting_client']
        ) {
            $this->dumper->turnOn(false);
            return false;
        }
        $buf_response_headers = headers_list();
        $response_headers = [];

        foreach ($buf_response_headers as $value) {
            $value = explode(':', $value);
            $response_headers[$value[0]] = implode(':', array_slice($value, 1));
        }
        $response_header = [];
        if (isset($response_headers['PHP-Dump-Settings'])) {
            $response_header = json_decode($response_headers['PHP-Dump-Settings'], true);
        }
        if ($header['command'] == 'create') {
            $response_header = $this->filteredSettingsHeader($response_header, 'create');
            $this->setSettings(array_merge($settings, $response_header['settings']), array_merge($dump_settings, $response_header['dump_settings']), array_merge($dump_fields, $response_header['dump_fields']));
            $res = $this->getSettings();
            $response_header = array_merge($response_header, $res);
            // header перезаписать
            header_register_callback(function()use ($response_header) {
                header('PHP-Dump-Settings:' . json_encode($response_header));
            });
        }
    }

    public function init($settings = [], $dump_settings = [], $dump_fields = null, $read_exit = true) {
        if ($this->is_init == true) {
            return;
        }
        $this->is_init = true;
        $headers = \getallheaders();
        $header = [];
        $this->defaultSettings($settings, $dump_settings, $dump_fields);
        if (is_bool($this->dump_settings['turn_on'])) {
            $this->dumper->turnOn($this->dump_settings['turn_on']);
            if ($this->dump_settings['turn_on'] == false) {
                return;
            }
        }
        if (isset($headers['PHP-Dump-Settings'])) {
            $header = json_decode($headers['PHP-Dump-Settings'], true);
        }
        $hashkeys = $this->settings['hashkeys'];
        // проходим аунтентификацию. // создать отдельный метод

        if (empty($header) ||
                !isset($header['status_client']) ||
                $header['status_client'] === 'disabled' ||
                !isset($header['hashkey']) ||
                !isset($hashkeys[$header['hashkey']]) ||
                $hashkeys[$header['hashkey']]['greeting_client'] !== $header['greeting_client']
        ) {
            $this->dumper->turnOn(false);
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
            $header = $this->filteredSettingsHeader($header);
            /* $dump_fields=$this->dump_fields;
              foreach($header['dump_fields'] as $k=>$v){
              $dump_fields->$k=$v;
              } */
            //$this->setSettings(array_merge($header['settings'],$settings),array_merge($header['dump_settings'],$dump_settings),$dump_fields);
            $this->dump_settings['save_dump'] = true;
            $this->setSettings($header['settings'], $header['dump_settings'], $header['dump_fields']);
            $headers_fields = $this->getSettings();
            $headers_fields = $this->filteredSettingsHeader($headers_fields, 'read');
            $headers_fields = array_merge($dump_response_settings, $headers_fields);
            header_register_callback(function()use($headers_fields) {
                header('PHP-Dump-Settings:' . json_encode($headers_fields));
            });
        } else if ($header['command'] == 'read') {
            $this->dump_settings['save_dump'] = false;
            $this->dump_settings['render_dump_after'] = true;
            $header = $this->filteredSettingsHeader($header, 'read');
            /* foreach($header['dump_fields'] as $k=>$v){
              $dump_fields[$k]=$v;
              } */
            //$this->setSettings(array_merge($settings,$header['settings']),array_merge($dump_settings,$header['dump_settings']),$dump_fields);
            $this->setSettings($header['settings'], $header['dump_settings'], $header['dump_fields']);
            header_register_callback(function()use ($dump_response_settings) {
                header('PHP-Dump-Settings:' . json_encode($dump_response_settings));
            });
            if ($read_exit === true) {
                exit;
            }
        }
    }
	
	static public function end (){
		$self=self::$self;
		$self->dumper->end();
		$self->dumper=null;
		self::$self=null;
	}
	static public function dump($data, $name='') {
		$self=self::$self;
		$self->dumper->dump($data, $name);
	}

	static public function error($errno = false, $errstr, $errfile = false, $errline = false, $errcontext = false) {
		$self=self::$self;
	   $self->dumper->error($errno, $errstr, $errfile, $errline, $errcontext);
	}

	static public function vdump($data, $name = '')
	{
		$self=self::$self;
		$self->dumper->vdump($data, $name);
	}

	static public function vexport($data, $name = '')
	{
		$self=self::$self;
		$self->dumper->vexport($data, $name);
	}
	static public function print($data, $name = '')
	{
		$self=self::$self;
		$self->dumper->print($data, $name);
	}
    /*public function turnOn($check = true) {
        self::$dumper_static->turnOn($check);
    }*/
	
}
