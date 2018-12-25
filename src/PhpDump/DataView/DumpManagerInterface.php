<?php
namespace Alpa\PhpDump\DataView;
/*
 * for PHP version 7 and more
 * @autor Alexey Pakhomov  <AlexeyP0708@gmail.com>
 * @version 1.1
 */

interface DumpManagerInterface {
    /**
     * Open Dump.
     * @param \Alpa\PhpDump\DataView\Dump $param
     * @param string $type value "create" or "read".  Specifies for what purpose open the dump. read -  to read the existing dump . create - to create a new dump or to complete dump .
     * @param bool $new_complect.  
     *      $new_completct =f
     * alse - the last dump is not completed and a write to the existing dump.
     *      $new_completct =true - create new dump
     * @return object|resource  control object. This can be a database object or resource.
     */
    public function open(Dump $param,$type='read',$new_complect=true);
    /**
     * Closes the dump.
     * @param type $is_commpleted - true - dump is complete. false - the dump will be completed later.
     */
    public function close($is_commpleted = true);
    
    /**
     * write data in dump. 
     * Before recording, data is converted to dump format.
     * @param mixed $data   
     * @param bool $is_flow true -  data flow.Required when copying dump. (no converting data)   
     */
    public function write($data, $is_flow = false);
    /**
     * read dump.
     * @param callable|false $render_callback_flow  If $render_callback_flow==false then return result, else  in portions of the stream will be passed to the $ render_callback_flow function as an argument. 
     * $render_callback_flow function  itself determines which  in format to  the data convert.
     * @return mixed|null  All dump. or null.
     *  
     */
    public function read($render_callback_flow = false);
    /**
     * Delete Dump.
     */
    public function delete();
}



