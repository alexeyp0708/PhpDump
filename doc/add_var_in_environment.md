[ переменные среды окружения в Windows](https://www.youtube.com/watch?v=bEroNNzqlF4)
[Переменные окружения Linux](https://losst.ru/peremennye-okruzheniya-v-linux)

# Добавление переменных окружения локально через сервер Apache
1. В Apache настройках должен быть подключен модуль mod_env
2. В основной дириктории добавляем файл .htaccess. Помним что директивы в .htaccess  родительских категорий (начиная от настроек сервера) будут установлены для дочерних, и будут разрешены в том случае, если настрйки сервера позволяют это. см [AllowOverride](https://httpd.apache.org/docs/2.4/mod/core.html#allowoverride). 
3. Если хотим добавить переменную окружения, например VAR=VALUE, в .htaccess  прописываем  `setEnv VAR VALUE`
Теперь данная переменная будет определяться для всех проектов, находящехся в данной категории. 
Чтобы деректива `setEnv` выполнялась, необходимо в настройках Apache (файл http.conf) или в настройках виртуального хоста вашего домена (файл conf/extra/vhost.conf) была установлена запись `<Directory dircetory/patch> AllowOverride All </Directory>` или `<Directory dircetory/patch> AllowOverride FileInfo </Directory>` где dircetory/patch - путь к категории чьи ресурсы могут использовать соответсвующие дерективы в .htaccess.


[AllowOverride](https://httpd.apache.org/docs/2.4/mod/core.html#allowoverride)
[Directives](https://httpd.apache.org/docs/2.4/mod/directive-dict.htm)
[XDG Base Directory Specification for \*nix system](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
[Composer environment variables](https://getcomposer.org/doc/03-cli.md#environment-variables)
[$\_ENV](http://php.net/manual/ru/reserved.variables.environment.php)
[putenv](http://php.net/manual/ru/function.putenv.php)
