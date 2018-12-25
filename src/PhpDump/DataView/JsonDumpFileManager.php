<?php

namespace Alpa\PhpDump\DataView;

/**
 *      for PHP version 7 and more
 *      @autor Alexey Pakhomov  <AlexeyP0708@gmail.com>
 *      @version 1.1
 */
class JsonDumpFileManager implements DumpManagerInterface {

    public $param;
    private $file;
    private $dump;
    private $type_open;
    private $q = '';
    public $compressed = false;

    public function __construct() {
        
    }
    public function __destruct() {
        //$this->close();
    }
    private function getPaths(Dump $field) {
        $result = [];
        $result['name_file'] = $field->timestamp . '_' . $field->group . '_' . $field->name . '.json';
        $result['dir'] = $field->path . '/' . $field->context . '/' . $field->user . '/';
        $result['file'] = $result['dir'] . $result['name_file'];
        return (object) $result;
    }

    private function getMemoryLimit() {
        if (isset($this->memory_limit)) {
            return $this->memory_limit;
        }
        $this->memory_limit = ini_get('memory_limit');

        if (preg_match('~^([\d]+)([\w]{0,1})$~ix', $this->memory_limit, $match)) {
            switch (strtolower($match[2])) {
                case 'g':$this->memory_limit = (int) $match[1] * 1024 * 1024 * 1024;
                    break;
                case 'm':$this->memory_limit = (int) $match[1] * 1024 * 1024;
                    break;
                case 'k':$this->memory_limit = (int) $match[1] * 1024;
                    break;
                default: $this->memory_limit = (int) $match[1];
                    break;
            }
        }
        return $this->memory_limit;
    }

    public function open(Dump $param, $type = 'read', $new_complect = true) {
        if ($this->file instanceof \SplFileObject) {
            $this->close();
        }
        $path_file = $this->getPaths($param);
        $this->dump = $param;
        if (!file_exists($path_file->dir)) {
            mkdir($path_file->dir, 0777, true);
        }
        if ($type == 'create') {
            $tp = 'wb+';
        } elseif ($type == 'read') {
            $tp = 'rb';
        }
        $file = new \SplFileObject($path_file->file, $tp);
		
        if ($type == 'create') {
            if ($new_complect === true) {
                $file->fwrite('{"stack":[');
            }
        }
        $this->file = $file;
        $this->type_open = $type;
        return $file;
    }
    public function close($is_commpleted = true) {
        if ($this->file instanceof \SplFileObject && $this->file->isWritable()) {
            if ($is_commpleted === true) {
                //$other_data=json_encode($data);
                //$other_data=preg_replace('~^[\{\[]|[\}\]]$~i','',$other_data); 
                //$other_data=empty($other_data)?$other_data:','.$other_data;
                $this->file->fwrite(']}');
                $this->q = '';
            }
            $this->type_open = null;
            $this->file = null;
        }
    }
    // $data строка в формате json или данные потока $is_flow=true 
    public function write($data, $is_flow = false) {
		if($this->file==null){
			return;
		}
		if(is_string($data)&&!json_decode($data,true)||!is_string($data)){
            $data=json_encode($data,JSON_PARTIAL_OUTPUT_ON_ERROR);
        } 
		if(empty($data) && !is_array($data)){
			$data='{"Error":""}';
		}
        $this->file->fwrite($this->q . $data);
        if ($is_flow == false) {
            $this->q = ',';
        }
    }
    public function &read($render_callback_flow = false) {
		if($this->file==null){
			return;
		}
        $check = false;
        $read_size = $this->file->getSize();
        while ($check == false) {
            if (memory_get_usage() + $read_size < $this->getMemoryLimit()) {
                $check = true;
            } else {
                $read_size = $read_size / 2;
            }
        }
        $data = '';
        while (!$this->file->eof()) {
            if (is_callable($render_callback_flow)) {
                $render_callback_flow($this->file->fread($read_size));
            } else {
                $data .= $this->file->fread($read_size);
            }
        }
        if(!empty($data)){
            $data=json_decode($data,true);
            $this->dump->data = &$data;
            return $data;
        } else {
            $data=null;
            return $data;
        }
    }
    public function delete() {
        if ($this->file !== null) {
            $path_file = $this->file->getRealPath();
            $dir_context = $this->dump->path . $this->dump->context;
            $dir_user = $this->dump->path . $this->dump->context . '/' . $this->dump->user;
            $this->close();
            unlink($path_file);
            if(empty(glob($dir_user.'/*'))){
                rmdir($dir_user);
            } 
            if(empty(glob($dir_context.'/*'))){
                rmdir($dir_context);
            }
        }
    }

}
